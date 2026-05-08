import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CompetitionTypeRecord, DashboardMonth, ProfileRecord, SkillOption } from "@/lib/types";
import { mapCompetitionType, mapProfileRecord, mapSkill } from "@/lib/profile/mappers";

interface SkillLinkRow {
    skill_taxonomy: {
        id: string;
        slug: string;
        label: string;
        category: string;
    } | null;
}

interface CompetitionLinkRow {
    competition_type_taxonomy: {
        id: string;
        slug: string;
        label: string;
        recommended_skills: string[];
    } | null;
}

export async function getTaxonomies(): Promise<{
    skills: SkillOption[];
    competitionTypes: CompetitionTypeRecord[];
}> {
    const supabase = await createServerSupabaseClient();
    const [skillsResult, competitionTypesResult] = await Promise.all([
        supabase.from("skill_taxonomy").select("id, slug, label, category").eq("is_active", true).order("sort_order"),
        supabase
            .from("competition_type_taxonomy")
            .select("id, slug, label, recommended_skills")
            .eq("is_active", true)
            .order("sort_order"),
    ]);

    if (skillsResult.error) {
        throw new Error(`Gagal memuat skill taxonomy: ${skillsResult.error.message}`);
    }

    if (competitionTypesResult.error) {
        throw new Error(`Gagal memuat taxonomy jenis lomba: ${competitionTypesResult.error.message}`);
    }

    return {
        skills: (skillsResult.data ?? []).map(mapSkill),
        competitionTypes: (competitionTypesResult.data ?? []).map(mapCompetitionType),
    };
}

export async function getProfileRecord(profileId: string, email?: string | null): Promise<ProfileRecord | null> {
    const supabase = await createServerSupabaseClient();
    const [
        { data: profileRow, error: profileError },
        { data: skillLinks, error: skillsError },
        { data: competitionLinks, error: competitionError },
        { data: availabilityRow, error: availabilityError },
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select(
                "id, full_name, campus_name, username, bio, public_visibility, show_competition_history, profile_completed_at, verification_status, verified_at",
            )
            .eq("id", profileId)
            .maybeSingle(),
        supabase.from("profile_skills").select("skill_taxonomy(id, slug, label, category)").eq("profile_id", profileId),
        supabase
            .from("profile_competition_preferences")
            .select("competition_type_taxonomy(id, slug, label, recommended_skills)")
            .eq("profile_id", profileId),
        supabase
            .from("profile_availability")
            .select("available_months, hours_per_week")
            .eq("profile_id", profileId)
            .maybeSingle(),
    ]);

    if (profileError) {
        throw new Error(`Gagal memuat profil: ${profileError.message}`);
    }

    if (!profileRow) {
        return null;
    }

    if (skillsError) {
        throw new Error(`Gagal memuat skill profil: ${skillsError.message}`);
    }

    if (competitionError) {
        throw new Error(`Gagal memuat preferensi lomba: ${competitionError.message}`);
    }

    if (availabilityError) {
        throw new Error(`Gagal memuat availability profil: ${availabilityError.message}`);
    }

    const skillLinkRows = (skillLinks ?? []) as unknown as SkillLinkRow[];
    const competitionLinkRows = (competitionLinks ?? []) as unknown as CompetitionLinkRow[];

    const skills = skillLinkRows
        .map((item) => item.skill_taxonomy)
        .filter(Boolean)
        .map((item) => mapSkill(item as { id: string; slug: string; label: string; category: string }));
    const competitionTypes = competitionLinkRows
        .map((item) => item.competition_type_taxonomy)
        .filter(Boolean)
        .map((item) => mapCompetitionType(item as { id: string; slug: string; label: string; recommended_skills: string[] }));

    const completionScore = [
        profileRow.full_name,
        profileRow.campus_name,
        profileRow.username,
        profileRow.bio,
        skills.length > 0 ? "skills" : "",
        competitionTypes.length > 0 ? "competitionTypes" : "",
        availabilityRow?.available_months?.length ? "availability" : "",
    ].filter(Boolean).length;

    return mapProfileRecord({
        ...profileRow,
        email,
        skills,
        competitionTypes,
        availableMonths: (availabilityRow?.available_months ?? []) as DashboardMonth[],
        hoursPerWeek: availabilityRow?.hours_per_week ?? null,
        completionScore: Math.round((completionScore / 7) * 100),
    });
}

export async function getProfileNameMap(
    profileIds: string[],
): Promise<Map<string, { fullName: string | null; username: string | null }>> {
    if (profileIds.length === 0) {
        return new Map<string, { fullName: string | null; username: string | null }>();
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("profiles").select("id, full_name, username").in("id", profileIds);

    if (error) {
        throw new Error(`Gagal memuat nama profil: ${error.message}`);
    }

    return new Map(
        (data ?? []).map((profile) => [
            profile.id,
            {
                fullName: profile.full_name,
                username: profile.username,
            },
        ]),
    );
}
