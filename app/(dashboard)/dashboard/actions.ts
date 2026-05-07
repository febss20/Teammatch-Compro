"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireCompletedProfile, requireUser } from "@/lib/auth";
import { safeParsePasswordChange } from "@/lib/auth/validation";
import {
    createCompetitionIdeaBoardPayload,
    safeParseCreateCompetitionIdeaBoard,
    safeParseDeleteCompetitionIdeaBoard,
    safeParseUpdateCompetitionIdeaBoard,
    updateCompetitionIdeaBoardPayload,
} from "@/lib/boards/validation";
import {
    boardApplicationInitialState,
    commitmentInitialState,
    competitionIdeaBoardInitialState,
    joinRequestInitialState,
    passwordChangeInitialState,
    profileInitialState,
    profileStepOneInitialState,
    profileStepThreeInitialState,
    profileStepTwoInitialState,
    settingsInitialState,
    teamRenameInitialState,
    teamResultInitialState,
    testimonialInitialState,
} from "@/lib/forms";
import { safeParseBoardApplication, safeParseJoinRequest } from "@/lib/matching/validation";
import {
    safeParseProfileStepOne,
    safeParseProfileStepThree,
    safeParseProfileStepTwo,
    safeParseUpdateProfile,
} from "@/lib/profile/validation";
import { safeParseSettings } from "@/lib/settings/validation";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeParseCommitment, safeParseTeamRename, safeParseTeamResult, safeParseTestimonial } from "@/lib/team/validation";
import type {
    BoardApplicationFieldName,
    CommitmentFieldName,
    CompetitionIdeaBoardFieldName,
    FormActionState,
    JoinRequestFieldName,
    PasswordChangeFieldName,
    ProfileFieldName,
    ProfileStepOneFieldName,
    ProfileStepThreeFieldName,
    ProfileStepTwoFieldName,
    SettingsFieldName,
    TeamRenameFieldName,
    TeamResultFieldName,
    TestimonialFieldName,
} from "@/lib/types";

interface DeleteCompetitionIdeaBoardResult {
    formError: string | null;
    success: boolean;
}

async function upsertNotificationPreference(userId: string) {
    const supabase = await createServerSupabaseClient();
    await supabase.from("notification_preferences").upsert({
        user_id: userId,
        updated_at: new Date().toISOString(),
    });
}

async function insertNotification(userId: string, category: string, title: string, body: string, linkPath?: string) {
    const supabase = await createServerSupabaseClient();
    await supabase.from("user_notifications").insert({
        user_id: userId,
        category,
        title,
        body,
        link_path: linkPath ?? null,
    });
}

async function refreshProfileSummary(profileId: string) {
    const supabase = await createServerSupabaseClient();
    const [{ count: historyCount, error: historyError }, { data: bestResultRow, error: historyBestError }, { data: testimonialRows, error: testimonialError }] =
        await Promise.all([
            supabase.from("competition_history").select("*", { count: "exact", head: true }).eq("profile_id", profileId),
            supabase
                .from("competition_history")
                .select("best_result")
                .eq("profile_id", profileId)
                .not("best_result", "is", null)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase.from("testimonials").select("rating").eq("target_profile_id", profileId),
        ]);

    if (historyError || historyBestError || testimonialError) {
        return;
    }

    const ratings = (testimonialRows ?? []).map((row) => row.rating);
    const averageRating = ratings.length > 0 ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2)) : 0;

    await supabase.from("profile_testimonial_summaries").upsert({
        profile_id: profileId,
        average_rating: averageRating,
        testimonial_count: ratings.length,
        best_result: bestResultRow?.best_result ?? null,
        competitions_count: historyCount ?? 0,
        updated_at: new Date().toISOString(),
    });
}

async function persistProfileStepOne(
    userId: string,
    payload: { full_name: string; campus_name: string; username: string; bio: string },
) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: payload.full_name,
            campus_name: payload.campus_name,
            username: payload.username,
            bio: payload.bio,
            updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (error) {
        throw new Error(`Gagal menyimpan identitas profil: ${error.message}`);
    }
}

async function persistProfileStepTwo(userId: string, payload: { skills: string[]; competition_types: string[] }) {
    const supabase = await createServerSupabaseClient();
    const [deleteSkillsResult, deleteCompetitionsResult] = await Promise.all([
        supabase.from("profile_skills").delete().eq("profile_id", userId),
        supabase.from("profile_competition_preferences").delete().eq("profile_id", userId),
    ]);

    if (deleteSkillsResult.error) {
        throw new Error(`Gagal merapikan skill profil: ${deleteSkillsResult.error.message}`);
    }
    if (deleteCompetitionsResult.error) {
        throw new Error(`Gagal merapikan minat lomba: ${deleteCompetitionsResult.error.message}`);
    }

    if (payload.skills.length > 0) {
        const { error } = await supabase.from("profile_skills").insert(
            payload.skills.map((skillId) => ({
                profile_id: userId,
                skill_id: skillId,
            })),
        );

        if (error) {
            throw new Error(`Gagal menyimpan skill profil: ${error.message}`);
        }
    }

    if (payload.competition_types.length > 0) {
        const { error } = await supabase.from("profile_competition_preferences").insert(
            payload.competition_types.map((competitionTypeId) => ({
                profile_id: userId,
                competition_type_id: competitionTypeId,
            })),
        );

        if (error) {
            throw new Error(`Gagal menyimpan minat lomba: ${error.message}`);
        }
    }
}

async function persistProfileStepThree(
    userId: string,
    payload: {
        available_months: string[];
        hours_per_week: number;
        public_visibility: "public" | "private";
        show_competition_history: boolean;
    },
    completeProfile: boolean,
) {
    const supabase = await createServerSupabaseClient();

    const [availabilityResult, profileResult] = await Promise.all([
        supabase.from("profile_availability").upsert({
            profile_id: userId,
            available_months: payload.available_months,
            hours_per_week: payload.hours_per_week,
            updated_at: new Date().toISOString(),
        }),
        supabase
            .from("profiles")
            .update({
                public_visibility: payload.public_visibility === "public",
                show_competition_history: payload.show_competition_history,
                profile_completed_at: completeProfile ? new Date().toISOString() : undefined,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId),
    ]);

    if (availabilityResult.error) {
        throw new Error(`Gagal menyimpan availability profil: ${availabilityResult.error.message}`);
    }
    if (profileResult.error) {
        throw new Error(`Gagal menyimpan pengaturan profil: ${profileResult.error.message}`);
    }
}

export async function logoutAction(): Promise<void> {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/login");
}

export async function completeProfileStepOne(
    _previousState: FormActionState<ProfileStepOneFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepOneFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParseProfileStepOne(formData);

        if (!validationResult.success) {
            return {
                ...profileStepOneInitialState,
                formError: "Periksa kembali data identitas Anda.",
                fieldErrors: getFieldErrors<ProfileStepOneFieldName>(validationResult.error),
            };
        }

        await persistProfileStepOne(user.id, validationResult.data);
        revalidatePath("/dashboard/profile/setup");
        revalidatePath("/dashboard/profile");

        return {
            ...profileStepOneInitialState,
            success: true,
            message: "Identitas dasar berhasil disimpan.",
        };
    } catch (error) {
        return {
            ...profileStepOneInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan identitas profil.",
        };
    }
}

export async function completeProfileStepTwo(
    _previousState: FormActionState<ProfileStepTwoFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepTwoFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParseProfileStepTwo(formData);

        if (!validationResult.success) {
            return {
                ...profileStepTwoInitialState,
                formError: "Pilih skill dan minat lomba yang masih valid.",
                fieldErrors: getFieldErrors<ProfileStepTwoFieldName>(validationResult.error),
            };
        }

        await persistProfileStepTwo(user.id, validationResult.data);
        revalidatePath("/dashboard/profile/setup");
        revalidatePath("/dashboard/profile");

        return {
            ...profileStepTwoInitialState,
            success: true,
            message: "Skill dan minat lomba berhasil disimpan.",
        };
    } catch (error) {
        return {
            ...profileStepTwoInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan skill profil.",
        };
    }
}

export async function completeProfileStepThree(
    _previousState: FormActionState<ProfileStepThreeFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepThreeFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParseProfileStepThree(formData);

        if (!validationResult.success) {
            return {
                ...profileStepThreeInitialState,
                formError: "Periksa kembali availability dan pengaturan privasi Anda.",
                fieldErrors: getFieldErrors<ProfileStepThreeFieldName>(validationResult.error),
            };
        }

        await persistProfileStepThree(user.id, validationResult.data, true);
        await upsertNotificationPreference(user.id);
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/profile/setup");
        revalidatePath("/dashboard/profile");
        redirect("/dashboard?profile=completed");
    } catch (error) {
        if (isRedirectError(error)) {
            throw error;
        }

        return {
            ...profileStepThreeInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menyelesaikan profil.",
        };
    }
}

export async function updateProfile(
    _previousState: FormActionState<ProfileFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParseUpdateProfile(formData);

        if (!validationResult.success) {
            return {
                ...profileInitialState,
                formError: "Periksa kembali field profil yang belum valid.",
                fieldErrors: getFieldErrors<ProfileFieldName>(validationResult.error),
            };
        }

        await persistProfileStepOne(user.id, validationResult.data);
        await persistProfileStepTwo(user.id, validationResult.data);
        await persistProfileStepThree(user.id, validationResult.data, true);
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/profile");

        return {
            ...profileInitialState,
            success: true,
            message: "Profil berhasil diperbarui.",
        };
    } catch (error) {
        return {
            ...profileInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui profil.",
        };
    }
}

export async function createCompetitionIdeaBoard(
    _previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseCreateCompetitionIdeaBoard(formData);

        if (!validationResult.success) {
            return {
                ...competitionIdeaBoardInitialState,
                formError: "Periksa kembali field board yang masih belum valid.",
                fieldErrors: getFieldErrors<CompetitionIdeaBoardFieldName>(validationResult.error),
            };
        }

        const payload = createCompetitionIdeaBoardPayload(validationResult.data);
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from("competition_idea_boards")
            .insert({
                user_id: user.id,
                title: payload.title,
                summary: payload.summary,
                competition_type: payload.competitionType,
                description: payload.description,
                deadline: payload.deadline,
                required_skills: payload.requiredSkills,
                status: "open",
                visibility: payload.visibility,
                is_draft: false,
                published_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (error) {
            throw new Error(`Gagal menyimpan board ide lomba: ${error.message}`);
        }

        const boardId = data.id;
        const slotsResult = await supabase.from("board_slots").insert(
            payload.slots.map((slot) => ({
                board_id: boardId,
                role_name: slot.roleName,
                slot_count: slot.slotCount,
                required_skills: slot.requiredSkills,
            })),
        );

        if (slotsResult.error) {
            throw new Error(`Board tersimpan tetapi slot tim gagal dibuat: ${slotsResult.error.message}`);
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/boards");
        revalidatePath("/dashboard/boards/new");
        redirect("/dashboard/boards?created=1");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }
        return {
            ...competitionIdeaBoardInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan ide lomba.",
        };
    }
}

export async function updateCompetitionIdeaBoard(
    _previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseUpdateCompetitionIdeaBoard(formData);

        if (!validationResult.success) {
            return {
                ...competitionIdeaBoardInitialState,
                formError: "Periksa kembali field board yang masih belum valid.",
                fieldErrors: getFieldErrors<CompetitionIdeaBoardFieldName>(validationResult.error),
            };
        }

        const payload = updateCompetitionIdeaBoardPayload(validationResult.data);
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from("competition_idea_boards")
            .update({
                title: payload.title,
                summary: payload.summary,
                competition_type: payload.competitionType,
                description: payload.description,
                deadline: payload.deadline,
                required_skills: payload.requiredSkills,
                visibility: payload.visibility,
                status: payload.status,
                closed_at: payload.status === "closed" ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", payload.id)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

        if (error) {
            throw new Error(`Gagal memperbarui board ide lomba: ${error.message}`);
        }
        if (!data) {
            throw new Error("Board ide tidak ditemukan atau Anda tidak memiliki akses.");
        }

        const deleteSlotsResult = await supabase.from("board_slots").delete().eq("board_id", payload.id);
        if (deleteSlotsResult.error) {
            throw new Error(`Gagal memperbarui slot board: ${deleteSlotsResult.error.message}`);
        }

        const insertSlotsResult = await supabase.from("board_slots").insert(
            payload.slots.map((slot) => ({
                board_id: payload.id,
                role_name: slot.roleName,
                slot_count: slot.slotCount,
                required_skills: slot.requiredSkills,
            })),
        );

        if (insertSlotsResult.error) {
            throw new Error(`Gagal memperbarui slot board: ${insertSlotsResult.error.message}`);
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/boards");
        revalidatePath(`/dashboard/boards/${payload.id}`);
        revalidatePath(`/dashboard/boards/${payload.id}/edit`);
        redirect("/dashboard/boards?updated=1");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }
        return {
            ...competitionIdeaBoardInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui ide lomba.",
        };
    }
}

export async function deleteCompetitionIdeaBoard(formData: FormData): Promise<DeleteCompetitionIdeaBoardResult> {
    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseDeleteCompetitionIdeaBoard(formData);

        if (!validationResult.success) {
            return {
                success: false,
                formError: validationResult.error.issues[0]?.message ?? "ID board ide tidak valid.",
            };
        }

        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from("competition_idea_boards")
            .delete()
            .eq("id", validationResult.data.id)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

        if (error) {
            throw new Error(`Gagal menghapus board ide lomba: ${error.message}`);
        }
        if (!data) {
            throw new Error("Board ide tidak ditemukan atau Anda tidak memiliki akses.");
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/boards");
        return {
            success: true,
            formError: null,
        };
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }
        return {
            success: false,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus ide lomba.",
        };
    }
}

export async function saveCandidate(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const targetProfileId = formData.get("target_profile_id");
    if (typeof targetProfileId !== "string" || targetProfileId.length === 0) {
        throw new Error("Kandidat tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("candidate_saved_profiles").upsert({
        user_id: user.id,
        target_profile_id: targetProfileId,
    });

    if (error) {
        throw new Error(`Gagal menyimpan kandidat: ${error.message}`);
    }

    revalidatePath("/dashboard/find-team");
}

export async function unsaveCandidate(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const targetProfileId = formData.get("target_profile_id");
    if (typeof targetProfileId !== "string" || targetProfileId.length === 0) {
        throw new Error("Kandidat tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
        .from("candidate_saved_profiles")
        .delete()
        .eq("user_id", user.id)
        .eq("target_profile_id", targetProfileId);

    if (error) {
        throw new Error(`Gagal membatalkan simpan kandidat: ${error.message}`);
    }

    revalidatePath("/dashboard/find-team");
}

export async function sendJoinRequest(
    _previousState: FormActionState<JoinRequestFieldName>,
    formData: FormData,
): Promise<FormActionState<JoinRequestFieldName>> {
    try {
        const { user, profile } = await requireCompletedProfile();
        const validationResult = safeParseJoinRequest(formData);

        if (!validationResult.success) {
            return {
                ...joinRequestInitialState,
                formError: "Periksa kembali request yang akan dikirim.",
                fieldErrors: getFieldErrors<JoinRequestFieldName>(validationResult.error),
            };
        }

        const supabase = await createServerSupabaseClient();
        const { data: existingRejected, error: rejectionError } = await supabase
            .from("join_requests")
            .select("id, rejection_locked")
            .eq("requester_id", user.id)
            .eq("target_profile_id", validationResult.data.target_profile_id)
            .eq("status", "rejected")
            .eq("rejection_locked", true)
            .maybeSingle();

        if (rejectionError) {
            throw new Error(`Gagal memeriksa riwayat request: ${rejectionError.message}`);
        }
        if (existingRejected) {
            throw new Error("Anda tidak bisa mengirim ulang request ke kandidat yang pernah menolak.");
        }

        const { data, error } = await supabase
            .from("join_requests")
            .insert({
                requester_id: user.id,
                target_profile_id: validationResult.data.target_profile_id,
                board_id: validationResult.data.board_id ?? null,
                selected_role: validationResult.data.selected_role,
                message: validationResult.data.message,
            })
            .select("id")
            .single();

        if (error) {
            throw new Error(`Gagal mengirim request: ${error.message}`);
        }

        await supabase.from("join_request_events").insert({
            join_request_id: data.id,
            actor_id: user.id,
            event_type: "created",
            note: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
        });

        await insertNotification(
            validationResult.data.target_profile_id,
            "request",
            "Request tim baru",
            `${profile.fullName ?? "Seseorang"} mengirim request untuk berkolaborasi.`,
            "/dashboard/requests",
        );

        revalidatePath("/dashboard/find-team");
        revalidatePath("/dashboard/requests");
        return {
            ...joinRequestInitialState,
            success: true,
            message: "Request berhasil dikirim.",
        };
    } catch (error) {
        return {
            ...joinRequestInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim request.",
        };
    }
}

export async function withdrawJoinRequest(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const requestId = formData.get("request_id");
    if (typeof requestId !== "string" || requestId.length === 0) {
        throw new Error("Request tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
        .from("join_requests")
        .update({
            status: "withdrawn",
            updated_at: new Date().toISOString(),
            responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("requester_id", user.id);

    if (error) {
        throw new Error(`Gagal menarik request: ${error.message}`);
    }

    revalidatePath("/dashboard/requests");
}

export async function applyToBoard(
    _previousState: FormActionState<BoardApplicationFieldName>,
    formData: FormData,
): Promise<FormActionState<BoardApplicationFieldName>> {
    try {
        const { user, profile } = await requireCompletedProfile();
        const validationResult = safeParseBoardApplication(formData);

        if (!validationResult.success) {
            return {
                ...boardApplicationInitialState,
                formError: "Periksa kembali lamaran Anda.",
                fieldErrors: getFieldErrors<BoardApplicationFieldName>(validationResult.error),
            };
        }

        const supabase = await createServerSupabaseClient();
        const { data: boardData, error: boardError } = await supabase
            .from("competition_idea_boards")
            .select("id, user_id, required_skills")
            .eq("id", validationResult.data.board_id)
            .maybeSingle();

        if (boardError) {
            throw new Error(`Gagal memeriksa board tujuan: ${boardError.message}`);
        }
        if (!boardData) {
            throw new Error("Board tidak ditemukan.");
        }
        if (boardData.user_id === user.id) {
            throw new Error("Anda tidak bisa melamar ke board milik sendiri.");
        }

        const { data: applicantSkills } = await supabase
            .from("profile_skills")
            .select("skill_taxonomy(label)")
            .eq("profile_id", user.id);

        const applicantSkillRows = (applicantSkills ?? []) as { skill_taxonomy: { label: string } | null }[];
        const applicantSkillLabels = new Set(
            applicantSkillRows
                .map((item) => item.skill_taxonomy)
                .filter(Boolean)
                .map((item) => (item as { label: string }).label.toLowerCase()),
        );
        const skillMatchCount = boardData.required_skills.filter((skill) =>
            applicantSkillLabels.has(skill.toLowerCase()),
        ).length;
        const skillMatchScore =
            boardData.required_skills.length === 0
                ? 0
                : Math.min(100, Math.round((skillMatchCount / boardData.required_skills.length) * 100));

        const { data, error } = await supabase
            .from("board_applications")
            .insert({
                board_id: validationResult.data.board_id,
                applicant_id: user.id,
                board_slot_id: validationResult.data.board_slot_id ?? null,
                selected_role: validationResult.data.selected_role,
                message: validationResult.data.message,
                skill_match_score: skillMatchScore,
            })
            .select("id")
            .single();

        if (error) {
            throw new Error(`Gagal mengirim lamaran: ${error.message}`);
        }

        await supabase.from("board_application_events").insert({
            board_application_id: data.id,
            actor_id: user.id,
            event_type: "created",
            note: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
        });

        await supabase
            .from("competition_idea_boards")
            .update({
                last_applicant_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", validationResult.data.board_id);

        await insertNotification(
            boardData.user_id,
            "application",
            "Pelamar baru masuk",
            `${profile.fullName ?? "Seseorang"} melamar ke board Anda.`,
            `/dashboard/boards/${validationResult.data.board_id}/review`,
        );

        revalidatePath("/dashboard/boards");
        revalidatePath(`/dashboard/boards/${validationResult.data.board_id}`);
        revalidatePath(`/dashboard/boards/${validationResult.data.board_id}/review`);

        return {
            ...boardApplicationInitialState,
            success: true,
            message: "Lamaran berhasil dikirim.",
        };
    } catch (error) {
        return {
            ...boardApplicationInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim lamaran.",
        };
    }
}

export async function saveBoardApplication(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const applicationId = formData.get("application_id");
    if (typeof applicationId !== "string" || applicationId.length === 0) {
        throw new Error("Lamaran tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
        .from("board_applications")
        .update({
            status: "saved",
            updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

    if (error) {
        throw new Error(`Gagal menyimpan lamaran untuk ditinjau: ${error.message}`);
    }

    await supabase.from("board_application_events").insert({
        board_application_id: applicationId,
        actor_id: user.id,
        event_type: "saved",
    });

    revalidatePath("/dashboard/boards");
}

async function createTeamFromApplication(boardId: string, creatorId: string, applicantId: string, roleName: string) {
    const supabase = await createServerSupabaseClient();
    const { data: board, error: boardError } = await supabase
        .from("competition_idea_boards")
        .select("title, deadline")
        .eq("id", boardId)
        .single();

    if (boardError) {
        throw new Error(`Gagal menyiapkan tim: ${boardError.message}`);
    }

    const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
            board_id: boardId,
            creator_id: creatorId,
            name: board.title,
            competition_name: board.title,
            deadline: board.deadline,
        })
        .select("id")
        .single();

    if (teamError) {
        throw new Error(`Gagal membuat tim: ${teamError.message}`);
    }

    const { data: creatorMember, error: creatorMemberError } = await supabase
        .from("team_members")
        .insert([
            {
                team_id: team.id,
                profile_id: creatorId,
                role_name: "Creator",
                confirmation_status: "confirmed",
            },
            {
                team_id: team.id,
                profile_id: applicantId,
                role_name: roleName,
                confirmation_status: "pending",
            },
        ])
        .select("id, profile_id");

    if (creatorMemberError || !creatorMember) {
        throw new Error(`Gagal membuat anggota tim: ${creatorMemberError?.message ?? "unknown error"}`);
    }

    const applicantMember = creatorMember.find((member) => member.profile_id === applicantId);
    if (!applicantMember) {
        throw new Error("Anggota tim untuk pelamar tidak berhasil dibuat.");
    }

    const reminderDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const { error: commitmentError } = await supabase.from("team_commitments").insert({
        team_member_id: applicantMember.id,
        hours_per_week: 5,
        deadline_at: reminderDeadline,
    });

    if (commitmentError) {
        throw new Error(`Gagal menyiapkan komitmen tim: ${commitmentError.message}`);
    }

    return team.id;
}

export async function acceptBoardApplication(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const applicationId = formData.get("application_id");
    if (typeof applicationId !== "string" || applicationId.length === 0) {
        throw new Error("Lamaran tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: rawApplication, error: applicationError } = await supabase
        .from("board_applications")
        .select("id, board_id, applicant_id, selected_role, competition_idea_boards!inner(user_id)")
        .eq("id", applicationId)
        .eq("competition_idea_boards.user_id", user.id)
        .single();

    if (applicationError) {
        throw new Error(`Gagal memuat lamaran: ${applicationError.message}`);
    }

    const application = rawApplication as { id: string; board_id: string; applicant_id: string; selected_role: string };
    const teamId = await createTeamFromApplication(
        application.board_id,
        user.id,
        application.applicant_id,
        application.selected_role,
    );

    const { error } = await supabase
        .from("board_applications")
        .update({
            status: "accepted",
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

    if (error) {
        throw new Error(`Gagal menerima lamaran: ${error.message}`);
    }

    await insertNotification(
        application.applicant_id,
        "application",
        "Lamaran Anda diterima",
        "Creator menerima lamaran Anda. Silakan konfirmasi komitmen tim.",
        `/dashboard/teams/${teamId}`,
    );

    revalidatePath(`/dashboard/boards/${application.board_id}/review`);
    revalidatePath(`/dashboard/teams/${teamId}`);
}

export async function rejectBoardApplication(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const applicationId = formData.get("application_id");
    if (typeof applicationId !== "string" || applicationId.length === 0) {
        throw new Error("Lamaran tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: rawApplication, error: applicationError } = await supabase
        .from("board_applications")
        .select("id, board_id, applicant_id, competition_idea_boards!inner(user_id)")
        .eq("id", applicationId)
        .eq("competition_idea_boards.user_id", user.id)
        .single();

    if (applicationError) {
        throw new Error(`Gagal memuat lamaran: ${applicationError.message}`);
    }

    const application = rawApplication as { id: string; board_id: string; applicant_id: string };

    const { error } = await supabase
        .from("board_applications")
        .update({
            status: "rejected",
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

    if (error) {
        throw new Error(`Gagal menolak lamaran: ${error.message}`);
    }

    await insertNotification(
        application.applicant_id,
        "application",
        "Lamaran Anda ditolak",
        "Creator memilih pelamar lain untuk board ini. Cari board lain yang lebih cocok untuk skill Anda.",
        "/dashboard/boards",
    );

    revalidatePath(`/dashboard/boards/${application.board_id}/review`);
}

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
                .eq("team_member_id", teamMember.id),
            supabase
                .from("team_members")
                .update({
                    confirmation_status: "confirmed",
                    updated_at: now,
                })
                .eq("id", teamMember.id),
        ]);

        if (commitmentResult.error) {
            throw new Error(`Gagal menyimpan komitmen: ${commitmentResult.error.message}`);
        }
        if (memberResult.error) {
            throw new Error(`Gagal memperbarui status anggota tim: ${memberResult.error.message}`);
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
            const { data: teamRow } = await supabase.from("teams").select("creator_id, name").eq("id", teamMember.team_id).single();
            if (teamRow) {
                await insertNotification(
                    teamRow.creator_id,
                    "commitment",
                    "Semua anggota telah konfirmasi",
                    `Tim ${teamRow.name} siap mulai bekerja.`,
                    `/dashboard/teams/${teamMember.team_id}`,
                );
            }
        }

        revalidatePath(`/dashboard/teams/${teamMember.team_id}`);

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

export async function sendCommitmentReminder(formData: FormData) {
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

    const memberRow = rawMemberRow as {
        id: string;
        profile_id: string;
        role_name: string;
        team_id: string;
        teams: { creator_id: string; name: string };
        team_commitments: { id: string; last_reminded_at: string | null }[] | null;
    };
    const commitment = (memberRow.team_commitments?.[0] ?? null) as { id: string; last_reminded_at: string | null } | null;
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

    await insertNotification(
        memberRow.profile_id,
        "reminder",
        "Reminder komitmen tim",
        `Creator mengingatkan Anda untuk segera mengonfirmasi komitmen pada tim ${memberRow.teams.name}.`,
        `/dashboard/teams/${memberRow.team_id}`,
    );

    revalidatePath(`/dashboard/teams/${memberRow.team_id}`);
}

export async function reopenExpiredSlot(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const teamMemberId = formData.get("team_member_id");
    if (typeof teamMemberId !== "string" || teamMemberId.length === 0) {
        throw new Error("Anggota tim tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: rawMemberRow, error: memberError } = await supabase
        .from("team_members")
        .select("id, team_id, profile_id, role_name, teams!inner(id, creator_id, board_id, name), team_commitments(id, deadline_at, confirmed_at)")
        .eq("id", teamMemberId)
        .eq("teams.creator_id", user.id)
        .maybeSingle();

    if (memberError) {
        throw new Error(`Gagal memuat anggota tim: ${memberError.message}`);
    }
    if (!rawMemberRow) {
        throw new Error("Anda tidak memiliki akses untuk membuka ulang slot ini.");
    }

    const memberRow = rawMemberRow as {
        id: string;
        profile_id: string;
        role_name: string;
        team_id: string;
        teams: { id: string; creator_id: string; board_id: string | null; name: string };
        team_commitments: { id: string; deadline_at: string; confirmed_at: string | null }[] | null;
    };
    const commitment = (memberRow.team_commitments?.[0] ?? null) as { id: string; deadline_at: string; confirmed_at: string | null } | null;
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

    await insertNotification(
        user.id,
        "commitment",
        "Slot tim terbuka kembali",
        `Slot ${memberRow.role_name} pada tim ${memberRow.teams.name} terbuka kembali karena komitmen tidak dikonfirmasi.`,
        `/dashboard/teams/${memberRow.team_id}`,
    );

    revalidatePath(`/dashboard/teams/${memberRow.team_id}`);
    if (memberRow.teams.board_id) {
        revalidatePath(`/dashboard/boards/${memberRow.teams.board_id}/review`);
    }
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

        revalidatePath(`/dashboard/teams/${validationResult.data.team_id}`);

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
        const { data: rawTeamRow, error: teamError } = await supabase
            .from("teams")
            .select("id, creator_id, name, competition_name, team_members(profile_id, role_name)")
            .eq("id", validationResult.data.team_id)
            .eq("creator_id", user.id)
            .single();

        if (teamError) {
            throw new Error(`Gagal memuat tim: ${teamError.message}`);
        }

        const teamRow = rawTeamRow as {
            id: string;
            creator_id: string;
            name: string;
            competition_name: string | null;
            team_members: { profile_id: string; role_name: string }[] | null;
        };

        const { error: resultError } = await supabase.from("team_results").insert({
            team_id: validationResult.data.team_id,
            result_summary: validationResult.data.result_summary,
            competition_ended_at: new Date(validationResult.data.competition_ended_at).toISOString(),
        });

        if (resultError) {
            throw new Error(`Gagal menyimpan hasil tim: ${resultError.message}`);
        }

        const historyMembers = (teamRow.team_members ?? []) as { profile_id: string; role_name: string }[];
        if (historyMembers.length > 0) {
            const historyInsert = await supabase.from("competition_history").insert(
                historyMembers.map((member) => ({
                    profile_id: member.profile_id,
                    competition_name: teamRow.competition_name ?? teamRow.name,
                    role_name: member.role_name,
                    best_result: validationResult.data.result_summary,
                    team_id: teamRow.id,
                })),
            );

            if (historyInsert.error) {
                throw new Error(`Hasil tim tersimpan tetapi portfolio anggota gagal dicatat: ${historyInsert.error.message}`);
            }
        }

        await Promise.all(historyMembers.map((member) => refreshProfileSummary(member.profile_id)));
        await insertNotification(
            user.id,
            "reminder",
            "Saatnya memberi testimoni",
            `Hasil untuk tim ${teamRow.name} sudah dicatat. Anda bisa mulai menulis testimoni untuk anggota lain.`,
            `/dashboard/teams/${teamRow.id}`,
        );

        revalidatePath(`/dashboard/teams/${validationResult.data.team_id}`);
        revalidatePath("/dashboard/find-team");

        return {
            ...teamResultInitialState,
            success: true,
            message: "Hasil lomba berhasil dicatat.",
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

        revalidatePath(`/dashboard/teams/${validationResult.data.team_id}`);
        revalidatePath("/dashboard/find-team");

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

export async function updatePassword(
    _previousState: FormActionState<PasswordChangeFieldName>,
    formData: FormData,
): Promise<FormActionState<PasswordChangeFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParsePasswordChange(formData);

        if (!validationResult.success) {
            return {
                ...passwordChangeInitialState,
                formError: "Periksa kembali password yang Anda isi.",
                fieldErrors: getFieldErrors<PasswordChangeFieldName>(validationResult.error),
            };
        }

        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.updateUser({
            password: validationResult.data.new_password,
            current_password: validationResult.data.current_password,
        });

        if (error) {
            throw new Error(`Gagal memperbarui password akun ${user.id}: ${error.message}`);
        }

        return {
            ...passwordChangeInitialState,
            success: true,
            message: "Password berhasil diperbarui.",
        };
    } catch (error) {
        return {
            ...passwordChangeInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui password.",
        };
    }
}

export async function markNotificationRead(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const notificationId = formData.get("notification_id");
    if (typeof notificationId !== "string" || notificationId.length === 0) {
        throw new Error("Notifikasi tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
        .from("user_notifications")
        .update({
            is_read: true,
        })
        .eq("id", notificationId)
        .eq("user_id", user.id);

    if (error) {
        throw new Error(`Gagal menandai notifikasi: ${error.message}`);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
}

export async function updateSettings(
    _previousState: FormActionState<SettingsFieldName>,
    formData: FormData,
): Promise<FormActionState<SettingsFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParseSettings(formData);

        if (!validationResult.success) {
            return {
                ...settingsInitialState,
                formError: "Periksa kembali pengaturan yang Anda ubah.",
                fieldErrors: getFieldErrors<SettingsFieldName>(validationResult.error),
            };
        }

        const publicVisibility = validationResult.data.public_visibility === "public";
        const showCompetitionHistory = validationResult.data.show_competition_history === "true";
        const requestUpdates = validationResult.data.request_updates === "true";
        const boardUpdates = validationResult.data.board_updates === "true";
        const commitmentUpdates = validationResult.data.commitment_updates === "true";
        const reminderUpdates = validationResult.data.reminder_updates === "true";

        const supabase = await createServerSupabaseClient();
        const [profileResult, preferencesResult] = await Promise.all([
            supabase
                .from("profiles")
                .update({
                    public_visibility: publicVisibility,
                    show_competition_history: showCompetitionHistory,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id),
            supabase.from("notification_preferences").upsert({
                user_id: user.id,
                request_updates: requestUpdates,
                board_updates: boardUpdates,
                commitment_updates: commitmentUpdates,
                reminder_updates: reminderUpdates,
                updated_at: new Date().toISOString(),
            }),
        ]);

        if (profileResult.error) {
            throw new Error(`Gagal menyimpan pengaturan profil: ${profileResult.error.message}`);
        }
        if (preferencesResult.error) {
            throw new Error(`Gagal menyimpan preferensi notifikasi: ${preferencesResult.error.message}`);
        }

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/profile");

        return {
            ...settingsInitialState,
            success: true,
            message: "Pengaturan berhasil diperbarui.",
        };
    } catch (error) {
        return {
            ...settingsInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui pengaturan.",
        };
    }
}
