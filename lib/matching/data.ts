import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CandidateRecord, CompetitionTypeRecord, DashboardMonth, JoinRequestRecord, SkillOption } from "@/lib/types";
import { getProfileNameMap, getProfileRecord } from "@/lib/profile/data";
import { mapCompetitionType, mapProfileRecord, mapSkill } from "@/lib/profile/mappers";

interface SkillDiscoveryRow {
    profile_id: string;
    skill_taxonomy: { id: string; slug: string; label: string; category: string } | null;
}

interface CompetitionDiscoveryRow {
    profile_id: string;
    competition_type_taxonomy: { id: string; slug: string; label: string; recommended_skills: string[] } | null;
}

interface AvailabilityRow {
    profile_id: string;
    available_months: string[];
    hours_per_week: number;
}

interface SummaryRow {
    profile_id: string;
    average_rating: number;
    testimonial_count: number;
    best_result: string | null;
    competitions_count: number;
}

export async function getCandidateDiscovery(viewerId: string): Promise<{
    candidates: CandidateRecord[];
    viewerProfile: Awaited<ReturnType<typeof getProfileRecord>>;
}> {
    const supabase = await createServerSupabaseClient();
    const [profilesResult, savedResult, skillLinksResult, preferenceLinksResult, availabilityResult, summaryResult] =
        await Promise.all([
            supabase
                .from("profiles")
                .select(
                    "id, full_name, campus_name, username, bio, public_visibility, show_competition_history, profile_completed_at, verification_status, verified_at",
                )
                .eq("public_visibility", true)
                .neq("id", viewerId),
            supabase.from("candidate_saved_profiles").select("target_profile_id").eq("user_id", viewerId),
            supabase.from("profile_skills").select("profile_id, skill_taxonomy(id, slug, label, category)"),
            supabase
                .from("profile_competition_preferences")
                .select("profile_id, competition_type_taxonomy(id, slug, label, recommended_skills)"),
            supabase.from("profile_availability").select("profile_id, available_months, hours_per_week"),
            supabase
                .from("profile_testimonial_summaries")
                .select("profile_id, average_rating, testimonial_count, best_result, competitions_count"),
        ]);

    if (profilesResult.error) {
        throw new Error(`Gagal memuat profil kandidat: ${profilesResult.error.message}`);
    }
    if (savedResult.error) {
        throw new Error(`Gagal memuat kandidat tersimpan: ${savedResult.error.message}`);
    }
    if (skillLinksResult.error) {
        throw new Error(`Gagal memuat skill kandidat: ${skillLinksResult.error.message}`);
    }
    if (preferenceLinksResult.error) {
        throw new Error(`Gagal memuat minat kompetisi kandidat: ${preferenceLinksResult.error.message}`);
    }
    if (availabilityResult.error) {
        throw new Error(`Gagal memuat availability kandidat: ${availabilityResult.error.message}`);
    }
    if (summaryResult.error) {
        throw new Error(`Gagal memuat ringkasan testimonial kandidat: ${summaryResult.error.message}`);
    }

    const savedSet = new Set((savedResult.data ?? []).map((item) => item.target_profile_id));
    const skillsByProfile = new Map<string, SkillOption[]>();
    const competitionsByProfile = new Map<string, CompetitionTypeRecord[]>();
    const availabilityByProfile = new Map<string, { months: DashboardMonth[]; hours: number }>();
    const summaryByProfile = new Map<string, { avg: number; count: number; bestResult: string | null; competitions: number }>();

    const skillRows = (skillLinksResult.data ?? []) as unknown as SkillDiscoveryRow[];
    const competitionRows = (preferenceLinksResult.data ?? []) as unknown as CompetitionDiscoveryRow[];
    const availabilityRows = (availabilityResult.data ?? []) as unknown as AvailabilityRow[];
    const summaryRows = (summaryResult.data ?? []) as unknown as SummaryRow[];

    skillRows.forEach((item) => {
        const current = skillsByProfile.get(item.profile_id) ?? [];
        if (item.skill_taxonomy) {
            current.push(mapSkill(item.skill_taxonomy));
        }
        skillsByProfile.set(item.profile_id, current);
    });

    competitionRows.forEach((item) => {
        const current = competitionsByProfile.get(item.profile_id) ?? [];
        if (item.competition_type_taxonomy) {
            current.push(mapCompetitionType(item.competition_type_taxonomy));
        }
        competitionsByProfile.set(item.profile_id, current);
    });

    availabilityRows.forEach((item) => {
        availabilityByProfile.set(item.profile_id, {
            months: item.available_months as DashboardMonth[],
            hours: item.hours_per_week,
        });
    });

    summaryRows.forEach((item) => {
        summaryByProfile.set(item.profile_id, {
            avg: item.average_rating,
            count: item.testimonial_count,
            bestResult: item.best_result,
            competitions: item.competitions_count,
        });
    });

    const viewerProfile = await getProfileRecord(viewerId);
    const viewerSkillSet = new Set(viewerProfile?.skills.map((skill) => skill.id) ?? []);
    const viewerCompetitionSet = new Set(viewerProfile?.competitionTypes.map((type) => type.id) ?? []);
    const viewerMonthSet = new Set(viewerProfile?.availableMonths ?? []);
    const viewerHours = viewerProfile?.hoursPerWeek ?? 0;

    const candidates: CandidateRecord[] = (profilesResult.data ?? []).map((profileRow) => {
        const skills = skillsByProfile.get(profileRow.id) ?? [];
        const competitionTypes = competitionsByProfile.get(profileRow.id) ?? [];
        const availability = availabilityByProfile.get(profileRow.id);
        const summary = summaryByProfile.get(profileRow.id);

        const profile = mapProfileRecord({
            ...profileRow,
            skills,
            competitionTypes,
            availableMonths: availability?.months ?? [],
            hoursPerWeek: availability?.hours ?? null,
            completionScore: 100,
        });

        const skillOverlap = skills.filter((skill) => viewerSkillSet.has(skill.id)).length;
        const skillScore = viewerSkillSet.size === 0 ? 40 : Math.round((skillOverlap / viewerSkillSet.size) * 60);
        const competitionOverlap = competitionTypes.filter((type) => viewerCompetitionSet.has(type.id)).length;
        const competitionScore =
            viewerCompetitionSet.size === 0 ? 10 : Math.round((competitionOverlap / viewerCompetitionSet.size) * 20);
        const availabilityOverlap = (availability?.months ?? []).filter((month) => viewerMonthSet.has(month)).length;
        const availabilityScore =
            viewerMonthSet.size === 0
                ? 10
                : Math.round((availabilityOverlap / viewerMonthSet.size) * 10) +
                  Math.round(
                      (Math.min(viewerHours, availability?.hours ?? 0) / Math.max(viewerHours, availability?.hours ?? 1)) * 10,
                  );

        return {
            profile,
            compatibilityScore: Math.min(100, skillScore + competitionScore + availabilityScore),
            savedByViewer: savedSet.has(profile.id),
            testimonialAverage: summary?.avg ?? 0,
            testimonialCount: summary?.count ?? 0,
            competitionsCount: profile.showCompetitionHistory ? (summary?.competitions ?? 0) : 0,
            bestResult: profile.showCompetitionHistory ? (summary?.bestResult ?? null) : null,
        };
    });

    return { candidates, viewerProfile };
}

export async function getCandidateById(viewerId: string, candidateId: string): Promise<CandidateRecord | null> {
    const candidateData = await getCandidateDiscovery(viewerId);
    return candidateData.candidates.find((candidate) => candidate.profile.id === candidateId) ?? null;
}

export async function getJoinRequestsForUser(userId: string): Promise<JoinRequestRecord[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("join_requests")
        .select(
            "id, requester_id, target_profile_id, board_id, selected_role, message, status, rejection_locked, created_at, updated_at, responded_at",
        )
        .or(`requester_id.eq.${userId},target_profile_id.eq.${userId}`)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Gagal memuat join requests: ${error.message}`);
    }

    const rows = data ?? [];
    const profileMap = await getProfileNameMap([...new Set(rows.flatMap((row) => [row.requester_id, row.target_profile_id]))]);

    return rows.map(
        (row): JoinRequestRecord => ({
            id: row.id,
            requesterId: row.requester_id,
            targetProfileId: row.target_profile_id,
            requesterName: profileMap.get(row.requester_id)?.fullName ?? profileMap.get(row.requester_id)?.username ?? null,
            targetProfileName:
                profileMap.get(row.target_profile_id)?.fullName ?? profileMap.get(row.target_profile_id)?.username ?? null,
            boardId: row.board_id,
            selectedRole: row.selected_role,
            message: row.message,
            status: row.status as JoinRequestRecord["status"],
            rejectionLocked: row.rejection_locked,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            respondedAt: row.responded_at,
        }),
    );
}
