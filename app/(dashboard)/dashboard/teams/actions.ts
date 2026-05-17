"use server";

import { requireCompletedProfile } from "@/lib/auth";
import {
    commitmentInitialState,
    teamRenameInitialState,
    teamResourceInitialState,
    teamResultInitialState,
    testimonialInitialState,
} from "@/lib/forms";
import { sendServerNotification } from "@/lib/notifications/service";
import { assertRateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { logServerError, PublicActionError } from "@/lib/security/server-errors";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
    safeParseCommitment,
    safeParseTeamRename,
    safeParseTeamResource,
    safeParseTeamResult,
    sanitizeTeamResourceUrl,
    safeParseTestimonial,
} from "@/lib/team/validation";
import type {
    CommitmentFieldName,
    FormActionState,
    TeamRenameFieldName,
    TeamResourceFieldName,
    TeamResultFieldName,
    TestimonialFieldName,
} from "@/lib/types";
import { refreshProfileSummaries } from "@/app/(dashboard)/dashboard/_lib/profile-writes";
import {
    revalidateMatchingPaths,
    revalidateProfilePaths,
    revalidateTeamPaths,
} from "@/app/(dashboard)/dashboard/_lib/revalidation";
import { insertTeamActivityEvent } from "@/app/(dashboard)/dashboard/_lib/team-writes";

function getStringValue(formData: FormData, fieldName: string): string {
    const value = formData.get(fieldName);
    return typeof value === "string" ? value : "";
}

function getCommitmentValues(formData: FormData) {
    return {
        hours_per_week: getStringValue(formData, "hours_per_week"),
        team_member_id: getStringValue(formData, "team_member_id"),
    };
}

function getTeamRenameValues(formData: FormData) {
    return {
        team_id: getStringValue(formData, "team_id"),
        team_name: getStringValue(formData, "team_name"),
    };
}

function getTeamResourceValues(formData: FormData) {
    return {
        label: getStringValue(formData, "label"),
        resource_type: getStringValue(formData, "resource_type"),
        team_id: getStringValue(formData, "team_id"),
        url: getStringValue(formData, "url"),
    };
}

function getTeamResultValues(formData: FormData) {
    return {
        competition_ended_at: getStringValue(formData, "competition_ended_at"),
        result_summary: getStringValue(formData, "result_summary"),
        team_id: getStringValue(formData, "team_id"),
    };
}

function getTestimonialValues(formData: FormData) {
    return {
        body: getStringValue(formData, "body"),
        rating: getStringValue(formData, "rating"),
        target_profile_id: getStringValue(formData, "target_profile_id"),
        team_id: getStringValue(formData, "team_id"),
        testimonial_id: getStringValue(formData, "testimonial_id"),
    };
}

export async function confirmTeamCommitment(
    _previousState: FormActionState<CommitmentFieldName>,
    formData: FormData,
): Promise<FormActionState<CommitmentFieldName>> {
    const values = getCommitmentValues(formData);

    try {
        await requireCompletedProfile();
        const validationResult = safeParseCommitment(formData);

        if (!validationResult.success) {
            return {
                ...commitmentInitialState,
                formError: "Periksa kembali konfirmasi komitmen Anda.",
                fieldErrors: getFieldErrors<CommitmentFieldName>(validationResult.error),
                values,
            };
        }

        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.rpc("confirm_team_commitment", {
            p_hours_per_week: validationResult.data.hours_per_week,
            p_team_member_id: validationResult.data.team_member_id,
        });

        if (error) {
            throw new Error(`Gagal menyimpan komitmen: ${error.message}`);
        }

        const result = data?.[0];
        if (!result) {
            throw new Error("Komitmen berhasil diproses tanpa respons tim.");
        }

        if (result.all_members_confirmed) {
            await sendServerNotification({
                type: "team_all_members_confirmed",
                teamId: result.confirmed_team_id,
                teamName: result.confirmed_team_name,
                userId: result.creator_user_id,
            });
        }

        revalidateTeamPaths({ teamId: result.confirmed_team_id, boardId: null });

        return {
            ...commitmentInitialState,
            success: true,
            message: "Komitmen berhasil dikonfirmasi.",
        };
    } catch (error) {
        logServerError({ action: "teams.confirmTeamCommitment" }, error);
        return {
            ...commitmentInitialState,
            formError: "Komitmen belum dapat dikonfirmasi saat ini.",
            values,
        };
    }
}

export async function sendCommitmentReminder(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const teamMemberId = formData.get("team_member_id");
    if (typeof teamMemberId !== "string" || teamMemberId.length === 0) {
        throw new Error("Anggota tim tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    await assertRateLimit({
        limitCount: 60,
        scope: "notification_action",
        subject: `user:${user.id}`,
        windowSeconds: 3600,
    });

    const { data, error } = await supabase.rpc("send_commitment_reminder", {
        p_team_member_id: teamMemberId,
    });

    if (error) {
        logServerError({ action: "teams.sendCommitmentReminder", userId: user.id }, error);
        throw new Error("Reminder belum dapat dikirim saat ini.");
    }

    const memberRow = data?.[0];
    if (!memberRow) {
        throw new Error("Anda tidak memiliki akses untuk mengirim reminder ini.");
    }

    await sendServerNotification({
        type: "team_commitment_reminder",
        teamId: memberRow.reminder_team_id,
        teamName: memberRow.reminder_team_name,
        userId: memberRow.reminder_profile_id,
    });

    revalidateTeamPaths({ teamId: memberRow.reminder_team_id, boardId: null });
}

export async function reopenExpiredSlot(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const teamMemberId = formData.get("team_member_id");
    if (typeof teamMemberId !== "string" || teamMemberId.length === 0) {
        throw new Error("Anggota tim tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("reopen_expired_slot", {
        p_team_member_id: teamMemberId,
    });

    if (error) {
        logServerError({ action: "teams.reopenExpiredSlot", userId: user.id }, error);
        throw new Error("Slot belum dapat dibuka ulang saat ini.");
    }

    const memberRow = data?.[0];
    if (!memberRow) {
        throw new Error("Anda tidak memiliki akses untuk membuka ulang slot ini.");
    }

    await sendServerNotification({
        type: "team_slot_reopened",
        roleName: memberRow.reopened_role_name,
        teamId: memberRow.reopened_team_id,
        teamName: memberRow.reopened_team_name,
        userId: user.id,
    });

    revalidateTeamPaths({ teamId: memberRow.reopened_team_id, boardId: memberRow.reopened_board_id });
}

export async function renameTeam(
    _previousState: FormActionState<TeamRenameFieldName>,
    formData: FormData,
): Promise<FormActionState<TeamRenameFieldName>> {
    const values = getTeamRenameValues(formData);

    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseTeamRename(formData);

        if (!validationResult.success) {
            return {
                ...teamRenameInitialState,
                formError: "Periksa kembali nama tim Anda.",
                fieldErrors: getFieldErrors<TeamRenameFieldName>(validationResult.error),
                values,
            };
        }

        const supabase = await createServerSupabaseClient();
        const { error } = await supabase
            .from("teams")
            .update({
                name: validationResult.data.team_name,
                updated_at: new Date().toISOString(),
            })
            .eq("id", validationResult.data.team_id)
            .eq("creator_id", user.id);

        if (error) {
            throw new Error(`Gagal mengganti nama tim: ${error.message}`);
        }

        await insertTeamActivityEvent(validationResult.data.team_id, user.id, "team_renamed", {
            team_name: validationResult.data.team_name,
        });

        revalidateTeamPaths({ teamId: validationResult.data.team_id, boardId: null });

        return {
            ...teamRenameInitialState,
            success: true,
            message: "Nama tim berhasil diperbarui.",
        };
    } catch (error) {
        logServerError({ action: "teams.renameTeam" }, error);
        return {
            ...teamRenameInitialState,
            formError: "Nama tim belum dapat diperbarui saat ini.",
            values,
        };
    }
}

export async function saveTeamResource(
    _previousState: FormActionState<TeamResourceFieldName>,
    formData: FormData,
): Promise<FormActionState<TeamResourceFieldName>> {
    const values = getTeamResourceValues(formData);

    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseTeamResource(formData);

        if (!validationResult.success) {
            return {
                ...teamResourceInitialState,
                formError: "Periksa kembali resource tim yang Anda tambahkan.",
                fieldErrors: getFieldErrors<TeamResourceFieldName>(validationResult.error),
                values,
            };
        }

        const supabase = await createServerSupabaseClient();
        const { data: teamRow, error: teamError } = await supabase
            .from("teams")
            .select("id, creator_id")
            .eq("id", validationResult.data.team_id)
            .eq("creator_id", user.id)
            .maybeSingle();

        if (teamError) {
            throw new Error(`Gagal memuat tim untuk resource: ${teamError.message}`);
        }
        if (!teamRow) {
            throw new Error("Anda tidak memiliki akses untuk menambahkan resource tim.");
        }

        const sanitizedResourceUrl = sanitizeTeamResourceUrl(validationResult.data.url);
        const { error: resourceError } = await supabase.from("team_resources").insert({
            team_id: validationResult.data.team_id,
            resource_type: validationResult.data.resource_type,
            label: validationResult.data.label,
            url: sanitizedResourceUrl,
        });

        if (resourceError) {
            throw new Error(`Gagal menyimpan resource tim: ${resourceError.message}`);
        }

        await insertTeamActivityEvent(validationResult.data.team_id, user.id, "resource_added", {
            resource_type: validationResult.data.resource_type,
            label: validationResult.data.label,
        });

        revalidateTeamPaths({ teamId: validationResult.data.team_id, boardId: null });

        return {
            ...teamResourceInitialState,
            success: true,
            message: "Resource tim berhasil ditambahkan.",
        };
    } catch (error) {
        logServerError({ action: "teams.saveTeamResource" }, error);
        return {
            ...teamResourceInitialState,
            formError: "Resource tim belum dapat ditambahkan saat ini.",
            values,
        };
    }
}

export async function recordCompetitionResult(
    _previousState: FormActionState<TeamResultFieldName>,
    formData: FormData,
): Promise<FormActionState<TeamResultFieldName>> {
    const values = getTeamResultValues(formData);

    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseTeamResult(formData);

        if (!validationResult.success) {
            return {
                ...teamResultInitialState,
                formError: "Periksa kembali hasil lomba yang Anda isi.",
                fieldErrors: getFieldErrors<TeamResultFieldName>(validationResult.error),
                values,
            };
        }

        const supabase = await createServerSupabaseClient();
        await assertRateLimit({
            limitCount: 60,
            scope: "notification_action",
            subject: `user:${user.id}`,
            windowSeconds: 3600,
        });

        const { data: rawTeamRow, error: teamError } = await supabase
            .from("teams")
            .select("id, creator_id, name, competition_name")
            .eq("id", validationResult.data.team_id)
            .eq("creator_id", user.id)
            .single();

        if (teamError) {
            throw new Error(`Gagal memuat tim: ${teamError.message}`);
        }

        const teamRow = rawTeamRow as unknown as {
            id: string;
            creator_id: string;
            name: string;
            competition_name: string | null;
        };

        const { data: rpcRows, error: rpcError } = await supabase.rpc("record_team_result_and_history", {
            p_team_id: validationResult.data.team_id,
            p_competition_name: teamRow.competition_name ?? teamRow.name,
            p_result_summary: validationResult.data.result_summary,
            p_best_result: validationResult.data.result_summary,
            p_competition_ended_at: new Date(validationResult.data.competition_ended_at).toISOString(),
            p_actor_user_id: user.id,
        });

        if (rpcError) {
            throw new Error(`Gagal menyimpan hasil tim: ${rpcError.message}`);
        }

        const rpcResult = rpcRows?.[0];
        if (!rpcResult) {
            throw new Error("Hasil tim gagal dicatat karena respons sinkronisasi database tidak lengkap.");
        }

        const affectedProfileIds = rpcResult.affected_profile_ids ?? [];
        try {
            await refreshProfileSummaries(affectedProfileIds);
        } catch (error) {
            revalidateTeamPaths({ teamId: validationResult.data.team_id, boardId: null });
            revalidateMatchingPaths({ candidateIds: affectedProfileIds });
            revalidateProfilePaths();
            logServerError({ action: "teams.recordCompetitionResult.refreshProfileSummaries", userId: user.id }, error);
            return {
                ...teamResultInitialState,
                formError: "Hasil lomba tersimpan, tetapi snapshot trust belum tersinkron.",
                values,
            };
        }

        await sendServerNotification({
            type: "testimonial_prompt",
            teamId: teamRow.id,
            teamName: teamRow.name,
            userId: user.id,
        });
        revalidateTeamPaths({ teamId: validationResult.data.team_id, boardId: null });
        revalidateMatchingPaths({ candidateIds: affectedProfileIds });
        revalidateProfilePaths();

        return {
            ...teamResultInitialState,
            success: true,
            message: "Hasil lomba berhasil dicatat.",
        };
    } catch (error) {
        if (error instanceof RateLimitError || error instanceof PublicActionError) {
            return {
                ...teamResultInitialState,
                formError: error.message,
                values,
            };
        }

        logServerError({ action: "teams.recordCompetitionResult" }, error);
        return {
            ...teamResultInitialState,
            formError: "Hasil lomba belum dapat dicatat saat ini.",
            values,
        };
    }
}

export async function submitTestimonial(
    _previousState: FormActionState<TestimonialFieldName>,
    formData: FormData,
): Promise<FormActionState<TestimonialFieldName>> {
    const values = getTestimonialValues(formData);

    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseTestimonial(formData);

        if (!validationResult.success) {
            return {
                ...testimonialInitialState,
                formError: "Periksa kembali testimonial Anda.",
                fieldErrors: getFieldErrors<TestimonialFieldName>(validationResult.error),
                values,
            };
        }

        const supabase = await createServerSupabaseClient();
        const { data: teamMember, error: teamMemberError } = await supabase
            .from("team_members")
            .select("team_id, profile_id")
            .eq("team_id", validationResult.data.team_id)
            .eq("profile_id", user.id)
            .maybeSingle();

        if (teamMemberError) {
            throw new Error(`Gagal memverifikasi keanggotaan tim: ${teamMemberError.message}`);
        }
        if (!teamMember) {
            throw new Error("Anda bukan anggota tim ini.");
        }
        if (validationResult.data.target_profile_id === user.id) {
            throw new Error("Anda tidak bisa menulis testimoni untuk diri sendiri.");
        }
        const { data: targetMember, error: targetMemberError } = await supabase
            .from("team_members")
            .select("team_id, profile_id")
            .eq("team_id", validationResult.data.team_id)
            .eq("profile_id", validationResult.data.target_profile_id)
            .maybeSingle();

        if (targetMemberError) {
            throw new Error(`Gagal memverifikasi target testimonial: ${targetMemberError.message}`);
        }
        if (!targetMember) {
            throw new Error("Target testimonial tidak valid karena bukan anggota tim yang sama.");
        }

        const now = new Date();
        if (validationResult.data.testimonial_id) {
            const { data: existing, error: existingError } = await supabase
                .from("testimonials")
                .select("id, author_id, target_profile_id, created_at, body, rating, locked_at")
                .eq("id", validationResult.data.testimonial_id)
                .eq("author_id", user.id)
                .single();

            if (existingError) {
                throw new Error(`Gagal memuat testimonial: ${existingError.message}`);
            }
            const lockedAt = existing.locked_at ? new Date(existing.locked_at) : null;
            if (
                (lockedAt && lockedAt.getTime() <= now.getTime()) ||
                now.getTime() - new Date(existing.created_at).getTime() > 7 * 24 * 60 * 60 * 1000
            ) {
                throw new Error("Testimoni sudah terkunci dan tidak bisa diedit lagi.");
            }

            const { error: editLogError } = await supabase.from("testimonial_edits").insert({
                testimonial_id: existing.id,
                previous_body: existing.body,
                previous_rating: existing.rating,
            });

            if (editLogError) {
                throw new Error(`Gagal menyimpan riwayat edit testimonial: ${editLogError.message}`);
            }

            const { error: updateError } = await supabase
                .from("testimonials")
                .update({
                    rating: validationResult.data.rating,
                    body: validationResult.data.body,
                    updated_at: now.toISOString(),
                })
                .eq("id", existing.id);

            if (updateError) {
                throw new Error(`Gagal memperbarui testimonial: ${updateError.message}`);
            }

            try {
                await refreshProfileSummaries([existing.target_profile_id]);
            } catch (error) {
                revalidateTeamPaths({ teamId: validationResult.data.team_id, boardId: null });
                revalidateMatchingPaths({ candidateIds: [existing.target_profile_id] });
                revalidateProfilePaths();
                logServerError({ action: "teams.submitTestimonial.refreshProfileSummaries", userId: user.id }, error);
                return {
                    ...testimonialInitialState,
                    formError: "Testimoni tersimpan, tetapi snapshot trust belum tersinkron.",
                    values,
                };
            }
        } else {
            const { error: insertError } = await supabase.from("testimonials").insert({
                team_id: validationResult.data.team_id,
                author_id: user.id,
                target_profile_id: validationResult.data.target_profile_id,
                rating: validationResult.data.rating,
                body: validationResult.data.body,
                locked_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });

            if (insertError) {
                throw new Error(`Gagal menyimpan testimonial: ${insertError.message}`);
            }

            try {
                await refreshProfileSummaries([validationResult.data.target_profile_id]);
            } catch (error) {
                revalidateTeamPaths({ teamId: validationResult.data.team_id, boardId: null });
                revalidateMatchingPaths({ candidateIds: [validationResult.data.target_profile_id] });
                revalidateProfilePaths();
                logServerError({ action: "teams.submitTestimonial.refreshProfileSummaries", userId: user.id }, error);
                return {
                    ...testimonialInitialState,
                    formError: "Testimoni tersimpan, tetapi snapshot trust belum tersinkron.",
                    values,
                };
            }
        }

        revalidateTeamPaths({ teamId: validationResult.data.team_id, boardId: null });
        revalidateMatchingPaths({ candidateIds: [validationResult.data.target_profile_id] });
        revalidateProfilePaths();

        return {
            ...testimonialInitialState,
            success: true,
            message: "Testimoni berhasil disimpan.",
        };
    } catch (error) {
        if (error instanceof PublicActionError) {
            return {
                ...testimonialInitialState,
                formError: error.message,
                values,
            };
        }

        logServerError({ action: "teams.submitTestimonial" }, error);
        return {
            ...testimonialInitialState,
            formError: "Testimoni belum dapat disimpan saat ini.",
            values,
        };
    }
}
