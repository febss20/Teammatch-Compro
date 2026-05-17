import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PROFILE_MAX_COMPETITION_TYPES, PROFILE_MAX_SKILLS } from "@/lib/profile/constants";

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
    payload: {
        skills: string[];
        custom_skills: string[];
        competition_types: string[];
        custom_competition_types: string[];
        idempotency_key: string;
    },
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
    const { error } = await supabase.rpc("replace_profile_step_two_idempotent", {
        p_user_id: userId,
        p_skills: payload.skills,
        p_custom_skills: payload.custom_skills,
        p_competition_types: payload.competition_types,
        p_custom_competition_types: payload.custom_competition_types,
        p_idempotency_key: payload.idempotency_key,
    });

    if (error) {
        throw new Error(`Gagal menyimpan step dua profil secara atomik: ${error.message}`);
    }
}

export async function persistProfileStepThree(
    userId: string,
    payload: {
        available_months: string[];
        hours_per_week: number;
        idempotency_key: string;
        public_visibility: "public" | "private";
        show_competition_history: boolean;
    },
    completeProfile: boolean,
): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("save_profile_step_three_atomic_idempotent", {
        p_user_id: userId,
        p_available_months: payload.available_months,
        p_hours_per_week: payload.hours_per_week,
        p_idempotency_key: payload.idempotency_key,
        p_public_visibility: payload.public_visibility === "public",
        p_show_competition_history: payload.show_competition_history,
        p_complete_profile: completeProfile,
    });

    if (error) {
        throw new Error(`Gagal menyimpan step tiga profil secara atomik: ${error.message}`);
    }
}

export async function persistFullProfileUpdate(
    userId: string,
    payload: {
        full_name: string;
        campus_name: string;
        username: string;
        bio: string;
        skills: string[];
        custom_skills: string[];
        competition_types: string[];
        custom_competition_types: string[];
        available_months: string[];
        hours_per_week: number;
        idempotency_key: string;
        public_visibility: "public" | "private";
        show_competition_history: boolean;
    },
    completeProfile: boolean,
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
    const { error } = await supabase.rpc("update_profile_atomic_idempotent", {
        p_user_id: userId,
        p_full_name: payload.full_name,
        p_campus_name: payload.campus_name,
        p_username: payload.username,
        p_bio: payload.bio,
        p_skills: payload.skills,
        p_custom_skills: payload.custom_skills,
        p_competition_types: payload.competition_types,
        p_custom_competition_types: payload.custom_competition_types,
        p_available_months: payload.available_months,
        p_hours_per_week: payload.hours_per_week,
        p_idempotency_key: payload.idempotency_key,
        p_public_visibility: payload.public_visibility === "public",
        p_show_competition_history: payload.show_competition_history,
        p_complete_profile: completeProfile,
    });

    if (error) {
        throw new Error(`Gagal memperbarui profil secara atomik: ${error.message}`);
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
