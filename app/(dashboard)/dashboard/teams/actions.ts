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
import { getFieldErrors } from "@/lib/shared/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
    safeParseCommitment,
    safeParseTeamRename,
    safeParseTeamResource,
    safeParseTeamResult,
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
import { refreshProfileSummary } from "@/app/(dashboard)/dashboard/_lib/profile-writes";
import { revalidateMatchingPaths, revalidateTeamPaths } from "@/app/(dashboard)/dashboard/_lib/revalidation";
import { insertTeamActivityEvent } from "@/app/(dashboard)/dashboard/_lib/team-writes";

export async function confirmTeamCommitment(
    _previousState: FormActionState<CommitmentFieldName>,
    formData: FormData,
): Promise<FormActionState<CommitmentFieldName>> {
    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseCommitment(formData);

        if (!validationResult.success) {
            return {
                ...commitmentInitialState,
                formError: "Periksa kembali konfirmasi komitmen Anda.",
                fieldErrors: getFieldErrors<CommitmentFieldName>(validationResult.error),
            };
        }

        const supabase = await createServerSupabaseClient();
        const { data: teamMember, error: memberError } = await supabase
            .from("team_members")
            .select("id, profile_id, team_id")
            .eq("id", validationResult.data.team_member_id)
            .eq("profile_id", user.id)
            .maybeSingle();

        if (memberError) {
            throw new Error(`Gagal memuat anggota tim: ${memberError.message}`);
        }
        if (!teamMember) {
            throw new Error("Anda tidak memiliki akses untuk mengonfirmasi komitmen ini.");
        }

        const now = new Date().toISOString();
        const [commitmentResult, memberResult] = await Promise.all([
            supabase
                .from("team_commitments")
                .update({
                    hours_per_week: validationResult.data.hours_per_week,
                    confirmed_at: now,
                    updated_at: now,
                })
                .eq("team_member_id", teamMember.id)
                .select("id")
                .maybeSingle(),
            supabase
                .from("team_members")
                .update({
                    confirmation_status: "confirmed",
                    updated_at: now,
                })
                .eq("id", teamMember.id)
                .eq("profile_id", user.id)
                .select("id, team_id, confirmation_status")
                .maybeSingle(),
        ]);

        if (commitmentResult.error) {
            throw new Error(`Gagal menyimpan komitmen: ${commitmentResult.error.message}`);
        }
        if (memberResult.error) {
            throw new Error(`Gagal memperbarui status anggota tim: ${memberResult.error.message}`);
        }
        if (!commitmentResult.data) {
            throw new Error("Row komitmen tidak ditemukan atau tidak bisa diperbarui.");
        }
        if (!memberResult.data) {
            throw new Error("Status anggota tim tidak berubah. Periksa policy RLS team_members.");
        }
        if (memberResult.data.confirmation_status !== "confirmed") {
            throw new Error("Status anggota tim gagal berubah ke confirmed.");
        }

        const { data: allMembers, error: membersError } = await supabase
            .from("team_members")
            .select("id, confirmation_status, profile_id")
            .eq("team_id", teamMember.team_id);

        if (membersError) {
            throw new Error(`Gagal memeriksa status tim: ${membersError.message}`);
        }

        const allConfirmed = (allMembers ?? []).every((member) => member.confirmation_status === "confirmed");

        if (allConfirmed) {
            const { data: teamRow } = await supabase
                .from("teams")
                .select("creator_id, name")
                .eq("id", teamMember.team_id)
                .single();
            if (teamRow) {
                await sendServerNotification({
                    type: "team_all_members_confirmed",
                    teamId: teamMember.team_id,
                    teamName: teamRow.name,
                    userId: teamRow.creator_id,
                });
            }
        }

        await insertTeamActivityEvent(teamMember.team_id, user.id, "commitment_confirmed", {
            team_member_id: teamMember.id,
            hours_per_week: validationResult.data.hours_per_week,
        });

        revalidateTeamPaths({ teamId: teamMember.team_id, boardId: null });

        return {
            ...commitmentInitialState,
            success: true,
            message: "Komitmen berhasil dikonfirmasi.",
        };
    } catch (error) {
        return {
            ...commitmentInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat mengonfirmasi komitmen.",
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
    const { data: rawMemberRow, error: memberError } = await supabase
        .from("team_members")
        .select("id, team_id, profile_id, role_name, teams!inner(creator_id, name), team_commitments(id, last_reminded_at)")
        .eq("id", teamMemberId)
        .eq("teams.creator_id", user.id)
        .maybeSingle();

    if (memberError) {
        throw new Error(`Gagal memuat anggota tim: ${memberError.message}`);
    }
    if (!rawMemberRow) {
        throw new Error("Anda tidak memiliki akses untuk mengirim reminder ini.");
    }

    const memberRow = rawMemberRow as unknown as {
        id: string;
        profile_id: string;
        role_name: string;
        team_id: string;
        teams: { creator_id: string; name: string };
        team_commitments: { id: string; last_reminded_at: string | null } | null;
    };
    const commitment = memberRow.team_commitments;
    if (!commitment) {
        throw new Error("Komitmen untuk anggota ini belum tersedia.");
    }

    if (commitment.last_reminded_at) {
        const lastRemindedAt = new Date(commitment.last_reminded_at).getTime();
        if (Date.now() - lastRemindedAt < 60 * 60 * 1000) {
            throw new Error("Reminder manual hanya dapat dikirim maksimal 1 kali per jam.");
        }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
        .from("team_commitments")
        .update({
            last_reminded_at: now,
            updated_at: now,
        })
        .eq("id", commitment.id);

    if (updateError) {
        throw new Error(`Gagal memperbarui timestamp reminder: ${updateError.message}`);
    }

    await sendServerNotification({
        type: "team_commitment_reminder",
        teamId: memberRow.team_id,
        teamName: memberRow.teams.name,
        userId: memberRow.profile_id,
    });
    await insertTeamActivityEvent(memberRow.team_id, user.id, "commitment_reminder_sent", {
        team_member_id: memberRow.id,
        role_name: memberRow.role_name,
    });

    revalidateTeamPaths({ teamId: memberRow.team_id, boardId: null });
}

export async function reopenExpiredSlot(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const teamMemberId = formData.get("team_member_id");
    if (typeof teamMemberId !== "string" || teamMemberId.length === 0) {
        throw new Error("Anggota tim tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: rawMemberRow, error: memberError } = await supabase
        .from("team_members")
        .select(
            "id, team_id, profile_id, role_name, teams!inner(id, creator_id, board_id, name), team_commitments(id, deadline_at, confirmed_at)",
        )
        .eq("id", teamMemberId)
        .eq("teams.creator_id", user.id)
        .maybeSingle();

    if (memberError) {
        throw new Error(`Gagal memuat anggota tim: ${memberError.message}`);
    }
    if (!rawMemberRow) {
        throw new Error("Anda tidak memiliki akses untuk membuka ulang slot ini.");
    }

    const memberRow = rawMemberRow as unknown as {
        id: string;
        profile_id: string;
        role_name: string;
        team_id: string;
        teams: { id: string; creator_id: string; board_id: string | null; name: string };
        team_commitments: { id: string; deadline_at: string; confirmed_at: string | null } | null;
    };
    const commitment = memberRow.team_commitments;
    if (!commitment) {
        throw new Error("Komitmen anggota ini tidak ditemukan.");
    }
    if (commitment.confirmed_at) {
        throw new Error("Anggota ini sudah mengonfirmasi komitmen.");
    }
    if (new Date(commitment.deadline_at).getTime() > Date.now()) {
        throw new Error("Slot belum melewati deadline 48 jam.");
    }

    const now = new Date().toISOString();
    const [memberUpdate, boardUpdate] = await Promise.all([
        supabase
            .from("team_members")
            .update({
                confirmation_status: "expired",
                updated_at: now,
            })
            .eq("id", memberRow.id),
        memberRow.teams.board_id
            ? supabase
                  .from("competition_idea_boards")
                  .update({
                      status: "open",
                      updated_at: now,
                  })
                  .eq("id", memberRow.teams.board_id)
            : Promise.resolve({ error: null }),
    ]);

    if (memberUpdate.error) {
        throw new Error(`Gagal menandai anggota sebagai expired: ${memberUpdate.error.message}`);
    }
    if (boardUpdate.error) {
        throw new Error(`Gagal membuka ulang status board: ${boardUpdate.error.message}`);
    }

    await sendServerNotification({
        type: "team_slot_reopened",
        roleName: memberRow.role_name,
        teamId: memberRow.team_id,
        teamName: memberRow.teams.name,
        userId: user.id,
    });
    await insertTeamActivityEvent(memberRow.team_id, user.id, "slot_reopened", {
        team_member_id: memberRow.id,
        role_name: memberRow.role_name,
    });

    revalidateTeamPaths({ teamId: memberRow.team_id, boardId: memberRow.teams.board_id });
}

export async function renameTeam(
    _previousState: FormActionState<TeamRenameFieldName>,
    formData: FormData,
): Promise<FormActionState<TeamRenameFieldName>> {
    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseTeamRename(formData);

        if (!validationResult.success) {
            return {
                ...teamRenameInitialState,
                formError: "Periksa kembali nama tim Anda.",
                fieldErrors: getFieldErrors<TeamRenameFieldName>(validationResult.error),
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
        return {
            ...teamRenameInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat mengganti nama tim.",
        };
    }
}

export async function saveTeamResource(
    _previousState: FormActionState<TeamResourceFieldName>,
    formData: FormData,
): Promise<FormActionState<TeamResourceFieldName>> {
    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseTeamResource(formData);

        if (!validationResult.success) {
            return {
                ...teamResourceInitialState,
                formError: "Periksa kembali resource tim yang Anda tambahkan.",
                fieldErrors: getFieldErrors<TeamResourceFieldName>(validationResult.error),
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

        const { error: resourceError } = await supabase.from("team_resources").insert({
            team_id: validationResult.data.team_id,
            resource_type: validationResult.data.resource_type,
            label: validationResult.data.label,
            url: validationResult.data.url.length > 0 ? validationResult.data.url : null,
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
        return {
            ...teamResourceInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan resource tim.",
        };
    }
}

export async function recordCompetitionResult(
    _previousState: FormActionState<TeamResultFieldName>,
    formData: FormData,
): Promise<FormActionState<TeamResultFieldName>> {
    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseTeamResult(formData);

        if (!validationResult.success) {
            return {
                ...teamResultInitialState,
                formError: "Periksa kembali hasil lomba yang Anda isi.",
                fieldErrors: getFieldErrors<TeamResultFieldName>(validationResult.error),
            };
        }

        const supabase = await createServerSupabaseClient();
        
        // Validasi tim dan creator
        const { data: teamRow, error: teamError } = await supabase
            .from("teams")
            .select("id, creator_id, name, team_members(profile_id, role_name)")
            .eq("id", validationResult.data.team_id)
            .eq("creator_id", user.id)
            .single();

        if (teamError) {
            throw new Error(`Gagal memuat tim: ${teamError.message}`);
        }

        if (!teamRow) {
            throw new Error("Tim tidak ditemukan atau Anda bukan creator tim ini.");
        }

        // Gunakan RPC untuk bypass RLS dan atomic operation
        const { error: rpcError } = await supabase.rpc("record_team_competition_result" as any, {
            p_team_id: validationResult.data.team_id,
            p_result_summary: validationResult.data.result_summary,
            p_competition_ended_at: new Date(validationResult.data.competition_ended_at).toISOString(),
            p_creator_id: user.id,
        });

        if (rpcError) {
            throw new Error(`Gagal mencatat hasil lomba: ${rpcError.message}`);
        }

        // Refresh profile summaries untuk semua anggota tim
        const teamMembers = teamRow.team_members ?? [];
        await Promise.all(teamMembers.map((member) => refreshProfileSummary(member.profile_id)));

        // Kirim notifikasi testimonial prompt
        await sendServerNotification({
            type: "testimonial_prompt",
            teamId: teamRow.id,
            teamName: teamRow.name,
            userId: user.id,
        });

        revalidateTeamPaths({ teamId: validationResult.data.team_id, boardId: null });
        revalidateMatchingPaths();

        return {
            ...teamResultInitialState,
            success: true,
            message: "Hasil lomba berhasil dicatat untuk semua anggota tim.",
        };
    } catch (error) {
        return {
            ...teamResultInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat mencatat hasil lomba.",
        };
    }
}

export async function submitTestimonial(
    _previousState: FormActionState<TestimonialFieldName>,
    formData: FormData,
): Promise<FormActionState<TestimonialFieldName>> {
    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseTestimonial(formData);

        if (!validationResult.success) {
            return {
                ...testimonialInitialState,
                formError: "Periksa kembali testimonial Anda.",
                fieldErrors: getFieldErrors<TestimonialFieldName>(validationResult.error),
            };
        }

        const supabase = await createServerSupabaseClient();
        
        // Validasi bahwa author adalah anggota tim
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
        
        // Validasi tidak boleh menulis testimoni untuk diri sendiri
        if (validationResult.data.target_profile_id === user.id) {
            throw new Error("Anda tidak bisa menulis testimoni untuk diri sendiri.");
        }

        // Validasi bahwa target adalah anggota tim yang sama
        const { data: targetMember, error: targetMemberError } = await supabase
            .from("team_members")
            .select("team_id, profile_id")
            .eq("team_id", validationResult.data.team_id)
            .eq("profile_id", validationResult.data.target_profile_id)
            .maybeSingle();

        if (targetMemberError) {
            throw new Error(`Gagal memverifikasi target testimoni: ${targetMemberError.message}`);
        }
        if (!targetMember) {
            throw new Error("Target testimoni bukan anggota tim yang sama.");
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
            if (existing.locked_at || now.getTime() - new Date(existing.created_at).getTime() > 7 * 24 * 60 * 60 * 1000) {
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

            await refreshProfileSummary(existing.target_profile_id);
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

            await refreshProfileSummary(validationResult.data.target_profile_id);
        }

        revalidateTeamPaths({ teamId: validationResult.data.team_id, boardId: null });
        revalidateMatchingPaths();

        return {
            ...testimonialInitialState,
            success: true,
            message: "Testimoni berhasil disimpan.",
        };
    } catch (error) {
        return {
            ...testimonialInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan testimonial.",
        };
    }
}
