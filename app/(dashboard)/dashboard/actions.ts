"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireCompletedProfile, requireUser } from "@/lib/auth";
import { safeParsePasswordChange } from "@/lib/auth/validation";
import {
    createCompetitionIdeaBoardPayload,
    normalizeRequiredSkills,
    parseBoardSlotsJsonValue,
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
    teamResourceInitialState,
    teamRenameInitialState,
    teamResultInitialState,
    testimonialInitialState,
} from "@/lib/forms";
import { safeParseBoardApplication, safeParseJoinRequest } from "@/lib/matching/validation";
import {
    ensureNotificationPreferences,
    markNotificationReadForUser,
    sendServerNotification,
    updateNotificationPreferences,
} from "@/lib/notifications/service";
import {
    safeParseProfileStepOne,
    safeParseProfileStepThree,
    safeParseProfileStepTwo,
    safeParseUpdateProfile,
} from "@/lib/profile/validation";
import { safeParseSettings } from "@/lib/settings/validation";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
    safeParseCommitment,
    safeParseTeamRename,
    safeParseTeamResource,
    safeParseTeamResult,
    safeParseTestimonial,
} from "@/lib/team/validation";
import { getCandidateDiscovery } from "@/lib/dashboard/data";
import { runDashboardMaintenance } from "@/lib/dashboard/runtime";
import type { Json } from "@/lib/supabase/database.types";
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
    TeamResourceFieldName,
    TeamRenameFieldName,
    TeamResultFieldName,
    TestimonialFieldName,
} from "@/lib/types";

interface DeleteCompetitionIdeaBoardResult {
    formError: string | null;
    success: boolean;
}

async function insertPrivacyAuditEvent(userId: string, eventType: string, payload: Record<string, unknown>) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("privacy_audit_events").insert({
        user_id: userId,
        event_type: eventType,
        payload: payload as Json,
    });

    if (error) {
        throw new Error(`Gagal menyimpan audit privasi: ${error.message}`);
    }
}

async function refreshProfileSummary(profileId: string) {
    const supabase = await createServerSupabaseClient();
    const [
        { count: historyCount, error: historyError },
        { data: bestResultRow, error: historyBestError },
        { data: testimonialRows, error: testimonialError },
    ] = await Promise.all([
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
    const averageRating =
        ratings.length > 0 ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2)) : 0;

    await supabase.from("profile_testimonial_summaries").upsert({
        profile_id: profileId,
        average_rating: averageRating,
        testimonial_count: ratings.length,
        best_result: bestResultRow?.best_result ?? null,
        competitions_count: historyCount ?? 0,
        updated_at: new Date().toISOString(),
    });
}

async function insertTeamActivityEvent(
    teamId: string,
    actorId: string | null,
    eventType: string,
    payload: Record<string, unknown>,
) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("team_activity_events").insert({
        team_id: teamId,
        actor_id: actorId,
        event_type: eventType,
        payload: payload as Json,
    });

    if (error) {
        throw new Error(`Gagal mencatat aktivitas tim: ${error.message}`);
    }
}

async function persistBoardWithSlots(input: {
    userId: string;
    title: string;
    summary: string;
    competitionType: string;
    description: string;
    deadline: string;
    requiredSkills: string[];
    visibility: "public" | "private";
    slots: { roleName: string; slotCount: number; requiredSkills: string[] }[];
}) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("competition_idea_boards")
        .insert({
            user_id: input.userId,
            title: input.title,
            summary: input.summary,
            competition_type: input.competitionType,
            description: input.description,
            deadline: input.deadline,
            required_skills: input.requiredSkills,
            status: "open",
            visibility: input.visibility,
            is_draft: false,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(`Gagal menyimpan board ide lomba: ${error.message}`);
    }

    const slotsResult = await supabase.from("board_slots").insert(
        input.slots.map((slot) => ({
            board_id: data.id,
            role_name: slot.roleName,
            slot_count: slot.slotCount,
            required_skills: slot.requiredSkills,
        })),
    );

    if (slotsResult.error) {
        throw new Error(`Board tersimpan tetapi slot tim gagal dibuat: ${slotsResult.error.message}`);
    }

    return data.id;
}

async function notifyMatchingCandidates(input: { boardId: string; competitionType: string; creatorId: string; title: string }) {
    const candidateData = await getCandidateDiscovery(input.creatorId);
    const matchingCandidates = candidateData.candidates
        .filter(
            (candidate) =>
                candidate.compatibilityScore >= 60 &&
                candidate.profile.competitionTypes.some((type) => type.slug === input.competitionType),
        )
        .slice(0, 12);

    await Promise.all(
        matchingCandidates.map((candidate) =>
            sendServerNotification({
                type: "board_match_found",
                boardId: input.boardId,
                boardTitle: input.title,
                candidateUserId: candidate.profile.id,
            }),
        ),
    );
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
    const { data: currentProfile, error: currentProfileError } = await supabase
        .from("profiles")
        .select("public_visibility, show_competition_history")
        .eq("id", userId)
        .single();

    if (currentProfileError) {
        throw new Error(`Gagal memuat pengaturan privasi saat ini: ${currentProfileError.message}`);
    }

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

    if (
        currentProfile.public_visibility !== (payload.public_visibility === "public") ||
        currentProfile.show_competition_history !== payload.show_competition_history
    ) {
        await insertPrivacyAuditEvent(userId, "profile_privacy_updated", {
            public_visibility: payload.public_visibility,
            show_competition_history: payload.show_competition_history,
            completed_profile: completeProfile,
        });
    }
}

export async function logoutAction(): Promise<void> {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/login");
}

export async function triggerDashboardMaintenance(): Promise<{ updated: boolean }> {
    await requireUser();
    const updated = await runDashboardMaintenance();
    return { updated };
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
        await ensureNotificationPreferences(user.id);
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

export async function saveBoardDraft(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const title = typeof formData.get("title") === "string" ? String(formData.get("title")).trim() : "";
    const summary = typeof formData.get("summary") === "string" ? String(formData.get("summary")).trim() : "";
    const competitionTypeSelect =
        typeof formData.get("competition_type_select") === "string"
            ? String(formData.get("competition_type_select")).trim()
            : "";
    const competitionTypeOther =
        typeof formData.get("competition_type_other") === "string" ? String(formData.get("competition_type_other")).trim() : "";
    const description = typeof formData.get("description") === "string" ? String(formData.get("description")).trim() : "";
    const deadline = typeof formData.get("deadline") === "string" ? String(formData.get("deadline")).trim() : "";
    const requiredSkillsValue =
        typeof formData.get("required_skills") === "string" ? String(formData.get("required_skills")).trim() : "";
    const visibility = formData.get("visibility") === "private" ? "private" : "public";
    const slotsJson = typeof formData.get("slots_json") === "string" ? String(formData.get("slots_json")).trim() : "[]";
    const requiredSkills = normalizeRequiredSkills(requiredSkillsValue);
    const parsedSlots = (() => {
        try {
            return parseBoardSlotsJsonValue(slotsJson);
        } catch {
            return [];
        }
    })();
    const slots = parsedSlots.map((slot) => ({
        roleName: slot.roleName,
        slotCount: slot.slotCount,
        requiredSkills,
    }));

    const competitionType =
        competitionTypeSelect === "others" && competitionTypeOther.length > 0
            ? competitionTypeOther
            : competitionTypeSelect || null;

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("board_drafts").upsert(
        {
            user_id: user.id,
            title: title.length > 0 ? title : null,
            summary: summary.length > 0 ? summary : null,
            competition_type: competitionType,
            description: description.length > 0 ? description : null,
            deadline: deadline.length > 0 ? deadline : null,
            required_skills: requiredSkills,
            visibility,
            slots,
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "user_id",
        },
    );

    if (error) {
        throw new Error(`Gagal menyimpan draft board: ${error.message}`);
    }
}

export async function discardBoardDraft() {
    const { user } = await requireCompletedProfile();
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("board_drafts").delete().eq("user_id", user.id);

    if (error) {
        throw new Error(`Gagal menghapus draft board: ${error.message}`);
    }

    revalidatePath("/dashboard/boards/new");
}

export async function publishBoardFromDraft(
    previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    return createCompetitionIdeaBoard(previousState, formData);
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
        const boardId = await persistBoardWithSlots({
            userId: user.id,
            title: payload.title,
            summary: payload.summary,
            competitionType: payload.competitionType,
            description: payload.description,
            deadline: payload.deadline,
            requiredSkills: payload.requiredSkills,
            visibility: payload.visibility,
            slots: payload.slots,
        });
        const supabase = await createServerSupabaseClient();
        const draftDeleteResult = await supabase.from("board_drafts").delete().eq("user_id", user.id);

        if (draftDeleteResult.error) {
            throw new Error(`Board terpublikasi tetapi draft gagal dibersihkan: ${draftDeleteResult.error.message}`);
        }

        await notifyMatchingCandidates({
            boardId,
            competitionType: payload.competitionType,
            creatorId: user.id,
            title: payload.title,
        });

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

export async function closeBoardRecruitment(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const validationResult = safeParseDeleteCompetitionIdeaBoard(formData);

    if (!validationResult.success) {
        throw new Error(validationResult.error.issues[0]?.message ?? "ID board ide tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("competition_idea_boards")
        .update({
            status: "closed",
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", validationResult.data.id)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

    if (error) {
        throw new Error(`Gagal menutup rekrutmen board: ${error.message}`);
    }
    if (!data) {
        throw new Error("Board ide tidak ditemukan atau Anda tidak memiliki akses.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/boards");
    revalidatePath(`/dashboard/boards/${validationResult.data.id}`);
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

        await sendServerNotification({
            type: "join_request_received",
            actorName: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
            targetUserId: validationResult.data.target_profile_id,
        });

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

export async function acceptJoinRequest(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const requestId = formData.get("request_id");
    if (typeof requestId !== "string" || requestId.length === 0) {
        throw new Error("Request tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: requestRow, error: requestError } = await supabase
        .from("join_requests")
        .select("id, requester_id, target_profile_id, status")
        .eq("id", requestId)
        .eq("target_profile_id", user.id)
        .maybeSingle();

    if (requestError) {
        throw new Error(`Gagal memuat request masuk: ${requestError.message}`);
    }
    if (!requestRow) {
        throw new Error("Request tidak ditemukan atau Anda tidak memiliki akses.");
    }
    if (requestRow.status !== "pending") {
        throw new Error("Hanya request dengan status pending yang dapat diterima.");
    }

    const now = new Date().toISOString();
    const [updateResult, eventResult] = await Promise.all([
        supabase
            .from("join_requests")
            .update({
                status: "accepted",
                updated_at: now,
                responded_at: now,
            })
            .eq("id", requestId),
        supabase.from("join_request_events").insert({
            join_request_id: requestId,
            actor_id: user.id,
            event_type: "accepted",
        }),
    ]);

    if (updateResult.error) {
        throw new Error(`Gagal menerima request: ${updateResult.error.message}`);
    }
    if (eventResult.error) {
        throw new Error(`Request diterima tetapi event tidak tercatat: ${eventResult.error.message}`);
    }

    await sendServerNotification({
        type: "join_request_accepted",
        requesterUserId: requestRow.requester_id,
    });

    revalidatePath("/dashboard/requests");
}

export async function rejectJoinRequest(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const requestId = formData.get("request_id");
    if (typeof requestId !== "string" || requestId.length === 0) {
        throw new Error("Request tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: requestRow, error: requestError } = await supabase
        .from("join_requests")
        .select("id, requester_id, target_profile_id, status")
        .eq("id", requestId)
        .eq("target_profile_id", user.id)
        .maybeSingle();

    if (requestError) {
        throw new Error(`Gagal memuat request masuk: ${requestError.message}`);
    }
    if (!requestRow) {
        throw new Error("Request tidak ditemukan atau Anda tidak memiliki akses.");
    }
    if (requestRow.status !== "pending") {
        throw new Error("Hanya request dengan status pending yang dapat ditolak.");
    }

    const now = new Date().toISOString();
    const [updateResult, eventResult] = await Promise.all([
        supabase
            .from("join_requests")
            .update({
                status: "rejected",
                rejection_locked: true,
                updated_at: now,
                responded_at: now,
            })
            .eq("id", requestId),
        supabase.from("join_request_events").insert({
            join_request_id: requestId,
            actor_id: user.id,
            event_type: "rejected",
        }),
    ]);

    if (updateResult.error) {
        throw new Error(`Gagal menolak request: ${updateResult.error.message}`);
    }
    if (eventResult.error) {
        throw new Error(`Request ditolak tetapi event tidak tercatat: ${eventResult.error.message}`);
    }

    await sendServerNotification({
        type: "join_request_rejected",
        requesterUserId: requestRow.requester_id,
    });

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

        const { data: applicantSkillLinks, error: applicantSkillLinksError } = await supabase
            .from("profile_skills")
            .select("skill_id")
            .eq("profile_id", user.id);

        if (applicantSkillLinksError) {
            throw new Error(`Gagal memuat skill pelamar: ${applicantSkillLinksError.message}`);
        }

        const applicantSkillIds = (applicantSkillLinks ?? []).map((item) => item.skill_id);
        const applicantSkillLabels =
            applicantSkillIds.length > 0
                ? await (async () => {
                      const { data: skillRows, error: skillRowsError } = await supabase
                          .from("skill_taxonomy")
                          .select("label")
                          .in("id", applicantSkillIds);

                      if (skillRowsError) {
                          throw new Error(`Gagal memuat label skill pelamar: ${skillRowsError.message}`);
                      }

                      return new Set((skillRows ?? []).map((item) => item.label.toLowerCase()));
                  })()
                : new Set<string>();

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

        await sendServerNotification({
            type: "board_application_received",
            actorName: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
            boardId: validationResult.data.board_id,
            ownerUserId: boardData.user_id,
        });

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

export async function acceptBoardApplication(formData: FormData) {
    const { user } = await requireCompletedProfile();
    const applicationId = formData.get("application_id");
    if (typeof applicationId !== "string" || applicationId.length === 0) {
        throw new Error("Lamaran tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: applicationContext, error: applicationError } = await supabase
        .from("board_applications")
        .select("id, board_id, applicant_id, selected_role, competition_idea_boards!inner(user_id)")
        .eq("id", applicationId)
        .eq("competition_idea_boards.user_id", user.id)
        .single();

    if (applicationError) {
        throw new Error(`Gagal memuat lamaran: ${applicationError.message}`);
    }

    const application = applicationContext as {
        id: string;
        applicant_id: string;
        board_id: string;
        selected_role: string;
    };

    const { data: acceptanceResult, error: acceptanceError } = await supabase.rpc("accept_board_application", {
        p_application_id: applicationId,
    });

    if (acceptanceError) {
        throw new Error(`Gagal menerima lamaran: ${acceptanceError.message}`);
    }

    const acceptanceRow = acceptanceResult?.[0] ?? null;
    if (!acceptanceRow) {
        throw new Error("Lamaran diterima tetapi team tidak berhasil dipetakan.");
    }

    const { error: eventError } = await supabase.from("board_application_events").insert({
        board_application_id: applicationId,
        actor_id: user.id,
        event_type: "accepted",
        note: acceptanceRow.accepted_team_created ? "team_created" : "team_reused",
    });

    if (eventError) {
        throw new Error(`Lamaran diterima tetapi event lamaran gagal dicatat: ${eventError.message}`);
    }

    await sendServerNotification({
        type: "board_application_accepted",
        applicantUserId: application.applicant_id,
        teamId: acceptanceRow.accepted_team_id,
    });
    await insertTeamActivityEvent(acceptanceRow.accepted_team_id, user.id, "application_accepted", {
        application_id: application.id,
        applicant_id: application.applicant_id,
        role_name: application.selected_role,
        team_created: acceptanceRow.accepted_team_created,
    });

    revalidatePath(`/dashboard/boards/${application.board_id}/review`);
    revalidatePath(`/dashboard/teams`);
    revalidatePath(`/dashboard/teams/${acceptanceRow.accepted_team_id}`);
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

    const application = rawApplication as unknown as { id: string; board_id: string; applicant_id: string };

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

    await sendServerNotification({
        type: "board_application_rejected",
        applicantUserId: application.applicant_id,
    });

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

    const memberRow = rawMemberRow as unknown as {
        id: string;
        profile_id: string;
        role_name: string;
        team_id: string;
        teams: { creator_id: string; name: string };
        team_commitments: { id: string; last_reminded_at: string | null } | null;
    };
    const commitment = memberRow.team_commitments as { id: string; last_reminded_at: string | null } | null;
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
    const commitment = memberRow.team_commitments as {
        id: string;
        deadline_at: string;
        confirmed_at: string | null;
    } | null;
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

        await insertTeamActivityEvent(validationResult.data.team_id, user.id, "team_renamed", {
            team_name: validationResult.data.team_name,
        });

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

        revalidatePath(`/dashboard/teams/${validationResult.data.team_id}`);

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
        const { data: rawTeamRow, error: teamError } = await supabase
            .from("teams")
            .select("id, creator_id, name, competition_name, team_members(profile_id, role_name)")
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
        await sendServerNotification({
            type: "testimonial_prompt",
            teamId: teamRow.id,
            teamName: teamRow.name,
            userId: user.id,
        });
        await insertTeamActivityEvent(teamRow.id, user.id, "competition_result_recorded", {
            result_summary: validationResult.data.result_summary,
            competition_ended_at: validationResult.data.competition_ended_at,
        });

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

    await markNotificationReadForUser(user.id, notificationId);

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
        const profileResult = await supabase
            .from("profiles")
            .update({
                public_visibility: publicVisibility,
                show_competition_history: showCompetitionHistory,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (profileResult.error) {
            throw new Error(`Gagal menyimpan pengaturan profil: ${profileResult.error.message}`);
        }

        await updateNotificationPreferences(user.id, {
            request_updates: requestUpdates,
            board_updates: boardUpdates,
            commitment_updates: commitmentUpdates,
            reminder_updates: reminderUpdates,
        });

        await insertPrivacyAuditEvent(user.id, "settings_updated", {
            public_visibility: validationResult.data.public_visibility,
            show_competition_history: validationResult.data.show_competition_history === "true",
            request_updates: requestUpdates,
            board_updates: boardUpdates,
            commitment_updates: commitmentUpdates,
            reminder_updates: reminderUpdates,
        });

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
