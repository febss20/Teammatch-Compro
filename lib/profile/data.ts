import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
    CompetitionTypeRecord,
    DashboardMonth,
    ProfileCompetitionHistoryItem,
    ProfileRecord,
    SkillOption,
} from "@/lib/types";
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

interface CustomSkillRow {
    id: string;
    label: string;
}

interface CustomCompetitionTypeRow {
    id: string;
    label: string;
}

interface ProfileSummaryRow {
    average_rating: number;
    testimonial_count: number;
    best_result: string | null;
    competitions_count: number;
}

interface CompetitionHistoryRow {
    id: string;
    competition_name: string;
    role_name: string;
    best_result: string | null;
    created_at: string;
    team_id: string | null;
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
        { data: customSkills, error: customSkillsError },
        { data: customCompetitions, error: customCompetitionsError },
        { data: profileSummaryRow, error: profileSummaryError },
        { data: competitionHistoryRows, error: competitionHistoryError },
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select(
                "id, full_name, campus_name, username, bio, email_domain, oauth_avatar_url, manual_avatar_path, avatar_source, avatar_updated_at, public_visibility, show_competition_history, profile_completed_at, verification_status, verified_at",
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
        supabase.from("profile_custom_skills").select("id, label").eq("profile_id", profileId),
        supabase.from("profile_custom_competition_type").select("id, label").eq("profile_id", profileId),
        supabase
            .from("profile_testimonial_summaries")
            .select("average_rating, testimonial_count, best_result, competitions_count")
            .eq("profile_id", profileId)
            .maybeSingle(),
        supabase
            .from("competition_history")
            .select("id, competition_name, role_name, best_result, created_at, team_id")
            .eq("profile_id", profileId)
            .order("created_at", { ascending: false })
            .limit(6),
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

    if (customSkillsError) {
        throw new Error(`Gagal memuat skill custom: ${customSkillsError.message}`);
    }

    if (customCompetitionsError) {
        throw new Error(`Gagal memuat jenis lomba custom: ${customCompetitionsError.message}`);
    }
    if (profileSummaryError) {
        throw new Error(`Gagal memuat trust snapshot profil: ${profileSummaryError.message}`);
    }
    if (competitionHistoryError) {
        throw new Error(`Gagal memuat riwayat lomba profil: ${competitionHistoryError.message}`);
    }

    const skillLinkRows = (skillLinks ?? []) as unknown as SkillLinkRow[];
    const competitionLinkRows = (competitionLinks ?? []) as unknown as CompetitionLinkRow[];
    const customSkillRows = (customSkills ?? []) as unknown as CustomSkillRow[];
    const customCompetitionRows = (customCompetitions ?? []) as unknown as CustomCompetitionTypeRow[];
    const profileSummary = (profileSummaryRow ?? null) as ProfileSummaryRow | null;
    const competitionHistory = ((competitionHistoryRows ?? []) as CompetitionHistoryRow[]).map(
        (item): ProfileCompetitionHistoryItem => ({
            id: item.id,
            competitionName: item.competition_name,
            roleName: item.role_name,
            bestResult: item.best_result,
            recordedAt: item.created_at,
            teamId: item.team_id,
        }),
    );

    const taxonomySkills = skillLinkRows
        .map((item) => item.skill_taxonomy)
        .filter(Boolean)
        .map((item) => mapSkill(item as { id: string; slug: string; label: string; category: string }));

    const customSkillsFormatted = customSkillRows.map((item) => ({
        id: item.id,
        slug: `custom-${item.id}`,
        label: item.label,
        category: "Custom",
    }));

    const competitionTypesFormatted = competitionLinkRows
        .map((item) => item.competition_type_taxonomy)
        .filter(Boolean)
        .map((item) => mapCompetitionType(item as { id: string; slug: string; label: string; recommended_skills: string[] }));

    const customCompetitionsFormatted = customCompetitionRows.map((item) => ({
        id: item.id,
        slug: `custom-${item.id}`,
        label: item.label,
        recommendedSkills: [],
    }));

    const allSkills = [...taxonomySkills, ...customSkillsFormatted];
    const allCompetitionTypes = [...competitionTypesFormatted, ...customCompetitionsFormatted];

    const completionScore = [
        profileRow.full_name,
        profileRow.campus_name,
        profileRow.username,
        profileRow.bio,
        allSkills.length > 0 ? "skills" : "",
        allCompetitionTypes.length > 0 ? "competitionTypes" : "",
        availabilityRow?.available_months?.length ? "availability" : "",
    ].filter(Boolean).length;

    return mapProfileRecord({
        ...profileRow,
        email,
        skills: allSkills,
        competitionTypes: allCompetitionTypes,
        availableMonths: (availabilityRow?.available_months ?? []) as DashboardMonth[],
        hoursPerWeek: availabilityRow?.hours_per_week ?? null,
        completionScore: Math.round((completionScore / 7) * 100),
        competitionsCount: profileSummary?.competitions_count ?? 0,
        bestResult: profileSummary?.best_result ?? null,
        testimonialCount: profileSummary?.testimonial_count ?? 0,
        testimonialAverage: profileSummary?.average_rating ?? 0,
        competitionHistory,
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
