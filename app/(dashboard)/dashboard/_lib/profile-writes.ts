import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PROFILE_MAX_COMPETITION_TYPES, PROFILE_MAX_SKILLS } from "@/lib/profile/constants";
import { insertPrivacyAuditEvent } from "@/app/(dashboard)/dashboard/_lib/privacy";

export async function persistProfileStepOne(
    userId: string,
    payload: { full_name: string; campus_name: string; username: string; bio: string },
): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: payload.full_name,
        campus_name: payload.campus_name,
        username: payload.username,
        bio: payload.bio,
        updated_at: new Date().toISOString(),
    });

    if (error) {
        throw new Error(`Gagal menyimpan identitas profil: ${error.message}`);
    }
}

export async function persistProfileStepTwo(
    userId: string,
    payload: { skills: string[]; custom_skills: string[]; competition_types: string[]; custom_competition_types: string[] },
): Promise<void> {
    const skillTotal = payload.skills.length + payload.custom_skills.length;
    const competitionTotal = payload.competition_types.length + payload.custom_competition_types.length;

    if (skillTotal < 1 || skillTotal > PROFILE_MAX_SKILLS) {
        throw new Error(`Total skill profil harus 1 sampai ${PROFILE_MAX_SKILLS}.`);
    }

    if (competitionTotal < 1 || competitionTotal > PROFILE_MAX_COMPETITION_TYPES) {
        throw new Error(`Total jenis lomba profil harus 1 sampai ${PROFILE_MAX_COMPETITION_TYPES}.`);
    }

    const supabase = await createServerSupabaseClient();
    const [deleteSkillsResult, deleteCompetitionsResult, deleteCustomSkillsResult, deleteCustomCompetitionsResult] =
        await Promise.all([
            supabase.from("profile_skills").delete().eq("profile_id", userId),
            supabase.from("profile_competition_preferences").delete().eq("profile_id", userId),
            supabase.from("profile_custom_skills").delete().eq("profile_id", userId),
            supabase.from("profile_custom_competition_type").delete().eq("profile_id", userId),
        ]);

    if (deleteSkillsResult.error) {
        throw new Error(`Gagal merapikan skill profil: ${deleteSkillsResult.error.message}`);
    }

    if (deleteCompetitionsResult.error) {
        throw new Error(`Gagal merapikan minat lomba: ${deleteCompetitionsResult.error.message}`);
    }

    if (deleteCustomSkillsResult.error) {
        throw new Error(`Gagal merapikan skill custom: ${deleteCustomSkillsResult.error.message}`);
    }

    if (deleteCustomCompetitionsResult.error) {
        throw new Error(`Gagal merapikan lomba custom: ${deleteCustomCompetitionsResult.error.message}`);
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

    if (payload.custom_skills.length > 0) {
        const { error } = await supabase.from("profile_custom_skills").insert(
            payload.custom_skills.map((label) => ({
                profile_id: userId,
                label,
                normalized_label: label.trim().toLowerCase().replace(/\s+/g, " "),
            })),
        );

        if (error) {
            throw new Error(`Gagal menyimpan skill custom: ${error.message}`);
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

    if (payload.custom_competition_types.length > 0) {
        const { error } = await supabase.from("profile_custom_competition_type").insert(
            payload.custom_competition_types.map((label) => ({
                profile_id: userId,
                label,
                normalized_label: label.trim().toLowerCase().replace(/\s+/g, " "),
            })),
        );

        if (error) {
            throw new Error(`Gagal menyimpan jenis lomba custom: ${error.message}`);
        }
    }
}

export async function persistProfileStepThree(
    userId: string,
    payload: {
        available_months: string[];
        hours_per_week: number;
        public_visibility: "public" | "private";
        show_competition_history: boolean;
    },
    completeProfile: boolean,
): Promise<void> {
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

export async function refreshProfileSummary(profileId: string): Promise<void> {
    const supabase = createAdminSupabaseClient();
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

    if (historyError) {
        throw new Error(`Gagal menghitung competition history untuk ${profileId}: ${historyError.message}`);
    }
    if (historyBestError) {
        throw new Error(`Gagal memuat best result untuk ${profileId}: ${historyBestError.message}`);
    }
    if (testimonialError) {
        throw new Error(`Gagal memuat testimonial untuk ${profileId}: ${testimonialError.message}`);
    }

    const ratings = (testimonialRows ?? []).map((row) => row.rating);
    const averageRating =
        ratings.length > 0 ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2)) : 0;

    const { error: upsertError } = await supabase.from("profile_testimonial_summaries").upsert({
        profile_id: profileId,
        average_rating: averageRating,
        testimonial_count: ratings.length,
        best_result: bestResultRow?.best_result ?? null,
        competitions_count: historyCount ?? 0,
        updated_at: new Date().toISOString(),
    });

    if (upsertError) {
        throw new Error(`Gagal menyimpan trust snapshot untuk ${profileId}: ${upsertError.message}`);
    }
}

export async function refreshProfileSummaries(profileIds: string[]): Promise<void> {
    const uniqueProfileIds = [...new Set(profileIds.filter((profileId) => profileId.length > 0))];
    const failures: string[] = [];

    for (const profileId of uniqueProfileIds) {
        try {
            await refreshProfileSummary(profileId);
        } catch (error) {
            failures.push(error instanceof Error ? error.message : `Gagal merefresh snapshot untuk ${profileId}.`);
        }
    }

    if (failures.length > 0) {
        throw new Error(failures.join(" | "));
    }
}
