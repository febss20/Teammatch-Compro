import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getNotificationFeed } from "@/lib/notifications/data";
import type {
    BoardDraftRecord,
    BoardApplicationRecord,
    BoardSlotRecord,
    CandidateRecord,
    CompetitionIdeaBoardRecord,
    CompetitionTypeRecord,
    DashboardMonth,
    JoinRequestRecord,
    ProfileRecord,
    SkillOption,
    TeamRecord,
    TeamListItemRecord,
    TeamMemberRecord,
    TeamActivityEventRecord,
    TeamResourceRecord,
    TeamResultRecord,
    TestimonialRecord,
} from "@/lib/types";

function mapSkill(row: { id: string; slug: string; label: string; category: string }): SkillOption {
    return {
        id: row.id,
        slug: row.slug,
        label: row.label,
        category: row.category,
    };
}

function mapCompetitionType(row: {
    id: string;
    slug: string;
    label: string;
    recommended_skills: string[];
}): CompetitionTypeRecord {
    return {
        id: row.id,
        slug: row.slug as CompetitionTypeRecord["slug"],
        label: row.label,
        recommendedSkills: row.recommended_skills,
    };
}

export function mapProfileRecord(input: {
    id: string;
    full_name: string | null;
    campus_name: string | null;
    username: string | null;
    bio: string | null;
    public_visibility: boolean;
    show_competition_history: boolean;
    profile_completed_at: string | null;
    verification_status: string;
    verified_at: string | null;
    created_at?: string;
    updated_at?: string;
    email?: string | null;
    skills?: SkillOption[];
    competitionTypes?: CompetitionTypeRecord[];
    availableMonths?: DashboardMonth[];
    hoursPerWeek?: number | null;
    completionScore?: number;
}): ProfileRecord {
    return {
        id: input.id,
        email: input.email,
        fullName: input.full_name,
        campusName: input.campus_name,
        username: input.username,
        bio: input.bio,
        visibility: input.public_visibility ? "public" : "private",
        showCompetitionHistory: input.show_competition_history,
        profileCompletedAt: input.profile_completed_at,
        verificationStatus: input.verification_status === "verified" ? "verified" : "unverified",
        verifiedAt: input.verified_at,
        skills: input.skills ?? [],
        competitionTypes: input.competitionTypes ?? [],
        availableMonths: input.availableMonths ?? [],
        hoursPerWeek: input.hoursPerWeek ?? null,
        completionScore: input.completionScore ?? 0,
    };
}

export async function getTaxonomies() {
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

    const skillLinkRows = (skillLinks ?? []) as unknown as {
        skill_taxonomy: { id: string; slug: string; label: string; category: string } | null;
    }[];
    const competitionLinkRows = (competitionLinks ?? []) as unknown as {
        competition_type_taxonomy: { id: string; slug: string; label: string; recommended_skills: string[] } | null;
    }[];

    const skills = skillLinkRows
        .map((item) => item.skill_taxonomy)
        .filter(Boolean)
        .map((item) => mapSkill(item as unknown as { id: string; slug: string; label: string; category: string }));
    const competitionTypes = competitionLinkRows
        .map((item) => item.competition_type_taxonomy)
        .filter(Boolean)
        .map((item) =>
            mapCompetitionType(item as unknown as { id: string; slug: string; label: string; recommended_skills: string[] }),
        );

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

export async function getDashboardSnapshot(userId: string) {
    const supabase = await createServerSupabaseClient();
    const [
        { count: boardsCount, error: boardsError },
        { count: outgoingRequestCount, error: requestsError },
        { count: incomingApplicationCount, error: applicationsError },
        notificationFeed,
    ] = await Promise.all([
        supabase.from("competition_idea_boards").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("join_requests").select("*", { count: "exact", head: true }).eq("requester_id", userId),
        supabase
            .from("board_applications")
            .select("id, competition_idea_boards!inner(user_id)", { count: "exact", head: true })
            .eq("competition_idea_boards.user_id", userId),
        getNotificationFeed(userId, 5),
    ]);

    if (boardsError) {
        throw new Error(`Gagal memuat jumlah board: ${boardsError.message}`);
    }
    if (requestsError) {
        throw new Error(`Gagal memuat request keluar: ${requestsError.message}`);
    }
    if (applicationsError) {
        throw new Error(`Gagal memuat request masuk: ${applicationsError.message}`);
    }
    return {
        boardsCount: boardsCount ?? 0,
        outgoingRequestCount: outgoingRequestCount ?? 0,
        incomingApplicationCount: incomingApplicationCount ?? 0,
        notifications: notificationFeed.notifications,
        unreadNotificationsCount: notificationFeed.unreadCount,
    };
}

export function mapBoardSlot(row: {
    id: string;
    board_id: string;
    role_name: string;
    slot_count: number;
    required_skills: string[];
}): BoardSlotRecord {
    return {
        id: row.id,
        boardId: row.board_id,
        roleName: row.role_name,
        slotCount: row.slot_count,
        requiredSkills: row.required_skills,
    };
}

export function mapBoardRecord(row: {
    id: string;
    user_id: string;
    title: string;
    competition_type: string;
    summary: string | null;
    description: string;
    deadline: string;
    required_skills: string[];
    status: string;
    visibility: string;
    is_draft: boolean;
    published_at: string | null;
    closed_at: string | null;
    last_applicant_at: string | null;
    created_at: string;
    updated_at: string;
    profiles?: { full_name: string | null } | null;
    board_slots?: {
        id: string;
        board_id: string;
        role_name: string;
        slot_count: number;
        required_skills: string[];
    }[];
}): CompetitionIdeaBoardRecord {
    return {
        id: row.id,
        userId: row.user_id,
        creatorName: row.profiles?.full_name ?? null,
        title: row.title,
        competitionType: row.competition_type,
        summary: row.summary,
        description: row.description,
        deadline: row.deadline,
        requiredSkills: row.required_skills,
        status: row.status === "closed" ? "closed" : "open",
        visibility: row.visibility === "private" ? "private" : "public",
        isDraft: row.is_draft,
        publishedAt: row.published_at,
        closedAt: row.closed_at,
        lastApplicantAt: row.last_applicant_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        slots: (row.board_slots ?? []).map(mapBoardSlot),
    };
}

type BoardRecordRow = {
    id: string;
    user_id: string;
    title: string;
    competition_type: string;
    summary: string | null;
    description: string;
    deadline: string;
    required_skills: string[];
    status: string;
    visibility: string;
    is_draft: boolean;
    published_at: string | null;
    closed_at: string | null;
    last_applicant_at: string | null;
    created_at: string;
    updated_at: string;
    board_slots?: {
        id: string;
        board_id: string;
        role_name: string;
        slot_count: number;
        required_skills: string[];
    }[];
};

function mapBoardDraftRecord(row: {
    id: string;
    user_id: string;
    title: string | null;
    summary: string | null;
    competition_type: string | null;
    description: string | null;
    deadline: string | null;
    required_skills: string[];
    visibility: string;
    slots: unknown;
    updated_at: string;
}): BoardDraftRecord {
    const rawSlots = Array.isArray(row.slots) ? row.slots : [];
    const slots = rawSlots
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item, index) => ({
            id: `draft-slot-${index + 1}`,
            boardId: row.id,
            roleName: typeof item.roleName === "string" ? item.roleName : "",
            slotCount: typeof item.slotCount === "number" ? item.slotCount : 1,
            requiredSkills: Array.isArray(item.requiredSkills)
                ? item.requiredSkills.filter((skill): skill is string => typeof skill === "string")
                : [],
        }))
        .filter((slot) => slot.roleName.trim().length > 0);

    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        summary: row.summary,
        competitionType: row.competition_type,
        description: row.description,
        deadline: row.deadline,
        requiredSkills: row.required_skills,
        visibility: row.visibility === "private" ? "private" : "public",
        slots,
        updatedAt: row.updated_at,
    };
}

async function getProfileNameMap(profileIds: string[]) {
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

export async function getOwnBoards(userId: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("competition_idea_boards")
        .select(
            "id, user_id, title, competition_type, summary, description, deadline, required_skills, status, visibility, is_draft, published_at, closed_at, last_applicant_at, created_at, updated_at, board_slots(id, board_id, role_name, slot_count, required_skills)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Gagal memuat board milik Anda: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as BoardRecordRow[];
    return rows.map(mapBoardRecord);
}

export async function getPublicBoards(filters: { competitionType?: string | null; viewerId: string }) {
    const supabase = await createServerSupabaseClient();
    let query = supabase
        .from("competition_idea_boards")
        .select(
            "id, user_id, title, competition_type, summary, description, deadline, required_skills, status, visibility, is_draft, published_at, closed_at, last_applicant_at, created_at, updated_at, board_slots(id, board_id, role_name, slot_count, required_skills)",
        )
        .eq("visibility", "public")
        .eq("is_draft", false)
        .neq("user_id", filters.viewerId)
        .order("published_at", { ascending: false, nullsFirst: false });

    if (filters.competitionType && filters.competitionType !== "all") {
        query = query.eq("competition_type", filters.competitionType);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(`Gagal memuat board publik: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as BoardRecordRow[];
    const boards = rows.map(mapBoardRecord);
    const creatorMap = await getProfileNameMap([...new Set(boards.map((board) => board.userId))]);

    return boards.map((board) => ({
        ...board,
        creatorName: creatorMap.get(board.userId)?.fullName ?? creatorMap.get(board.userId)?.username ?? null,
    }));
}

export async function getBoardById(boardId: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("competition_idea_boards")
        .select(
            "id, user_id, title, competition_type, summary, description, deadline, required_skills, status, visibility, is_draft, published_at, closed_at, last_applicant_at, created_at, updated_at, board_slots(id, board_id, role_name, slot_count, required_skills)",
        )
        .eq("id", boardId)
        .maybeSingle();

    if (error) {
        throw new Error(`Gagal memuat board: ${error.message}`);
    }
    if (!data) {
        return null;
    }

    const board = mapBoardRecord(data as unknown as BoardRecordRow);
    const creatorMap = await getProfileNameMap([board.userId]);
    return {
        ...board,
        creatorName: creatorMap.get(board.userId)?.fullName ?? creatorMap.get(board.userId)?.username ?? null,
    };
}

export async function getCandidateDiscovery(viewerId: string) {
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

    if (profilesResult.error) throw new Error(`Gagal memuat profil kandidat: ${profilesResult.error.message}`);
    if (savedResult.error) throw new Error(`Gagal memuat kandidat tersimpan: ${savedResult.error.message}`);
    if (skillLinksResult.error) throw new Error(`Gagal memuat skill kandidat: ${skillLinksResult.error.message}`);
    if (preferenceLinksResult.error)
        throw new Error(`Gagal memuat minat kompetisi kandidat: ${preferenceLinksResult.error.message}`);
    if (availabilityResult.error) throw new Error(`Gagal memuat availability kandidat: ${availabilityResult.error.message}`);
    if (summaryResult.error) throw new Error(`Gagal memuat ringkasan testimonial kandidat: ${summaryResult.error.message}`);

    const savedSet = new Set((savedResult.data ?? []).map((item) => item.target_profile_id));
    const skillsByProfile = new Map<string, SkillOption[]>();
    const competitionsByProfile = new Map<string, CompetitionTypeRecord[]>();
    const availabilityByProfile = new Map<string, { months: DashboardMonth[]; hours: number }>();
    const summaryByProfile = new Map<string, { avg: number; count: number; bestResult: string | null; competitions: number }>();

    const skillLinkDiscoveryRows = (skillLinksResult.data ?? []) as unknown as {
        profile_id: string;
        skill_taxonomy: { id: string; slug: string; label: string; category: string } | null;
    }[];
    const competitionDiscoveryRows = (preferenceLinksResult.data ?? []) as unknown as {
        profile_id: string;
        competition_type_taxonomy: { id: string; slug: string; label: string; recommended_skills: string[] } | null;
    }[];
    const availabilityRows = (availabilityResult.data ?? []) as unknown as {
        profile_id: string;
        available_months: string[];
        hours_per_week: number;
    }[];
    const summaryRows = (summaryResult.data ?? []) as unknown as {
        profile_id: string;
        average_rating: number;
        testimonial_count: number;
        best_result: string | null;
        competitions_count: number;
    }[];

    skillLinkDiscoveryRows.forEach((item) => {
        const current = skillsByProfile.get(item.profile_id) ?? [];
        if (item.skill_taxonomy) {
            current.push(
                mapSkill(item.skill_taxonomy as unknown as { id: string; slug: string; label: string; category: string }),
            );
        }
        skillsByProfile.set(item.profile_id, current);
    });

    competitionDiscoveryRows.forEach((item) => {
        const current = competitionsByProfile.get(item.profile_id) ?? [];
        if (item.competition_type_taxonomy) {
            current.push(
                mapCompetitionType(
                    item.competition_type_taxonomy as unknown as {
                        id: string;
                        slug: string;
                        label: string;
                        recommended_skills: string[];
                    },
                ),
            );
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

export async function getJoinRequestsForUser(userId: string) {
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

    return (data ?? []).map(
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

export async function getBoardDraft(userId: string): Promise<BoardDraftRecord | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("board_drafts")
        .select(
            "id, user_id, title, summary, competition_type, description, deadline, required_skills, visibility, slots, updated_at",
        )
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw new Error(`Gagal memuat draft board: ${error.message}`);
    }

    return data ? mapBoardDraftRecord(data) : null;
}

export async function getBoardApplicationsForBoard(boardId: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("board_applications")
        .select(
            "id, board_id, applicant_id, board_slot_id, team_id, selected_role, message, status, skill_match_score, created_at, updated_at, responded_at",
        )
        .eq("board_id", boardId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Gagal memuat lamaran board: ${error.message}`);
    }

    return (data ?? []).map(
        (row): BoardApplicationRecord => ({
            id: row.id,
            boardId: row.board_id,
            applicantId: row.applicant_id,
            boardSlotId: row.board_slot_id,
            teamId: row.team_id,
            selectedRole: row.selected_role,
            message: row.message,
            status: row.status as BoardApplicationRecord["status"],
            skillMatchScore: row.skill_match_score,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            respondedAt: row.responded_at,
        }),
    );
}

export async function getTeamById(teamId: string): Promise<TeamRecord | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("teams")
        .select("id, board_id, creator_id, name, competition_name, deadline")
        .eq("id", teamId)
        .maybeSingle();

    if (error) {
        throw new Error(`Gagal memuat tim: ${error.message}`);
    }

    return data
        ? {
              id: data.id,
              boardId: data.board_id,
              creatorId: data.creator_id,
              name: data.name,
              competitionName: data.competition_name,
              deadline: data.deadline,
          }
        : null;
}

export async function getTeamsForUser(userId: string): Promise<TeamListItemRecord[]> {
    const supabase = await createServerSupabaseClient();
    const [{ data: createdTeams, error: createdTeamsError }, { data: memberRows, error: memberRowsError }] = await Promise.all([
        supabase.from("teams").select("id, board_id, creator_id, name, competition_name, deadline").eq("creator_id", userId),
        supabase.from("team_members").select("team_id, confirmation_status").eq("profile_id", userId),
    ]);

    if (createdTeamsError) {
        throw new Error(`Gagal memuat tim milik creator: ${createdTeamsError.message}`);
    }
    if (memberRowsError) {
        throw new Error(`Gagal memuat keanggotaan tim: ${memberRowsError.message}`);
    }

    const membershipTeamIds = (memberRows ?? []).map((member) => member.team_id);
    const createdTeamIds = (createdTeams ?? []).map((team) => team.id);
    const teamIds = [...new Set([...membershipTeamIds, ...createdTeamIds])];

    if (teamIds.length === 0) {
        return [];
    }

    const [{ data: teams, error: teamsError }, { data: allMembers, error: allMembersError }] = await Promise.all([
        supabase
            .from("teams")
            .select("id, board_id, creator_id, name, competition_name, deadline")
            .in("id", teamIds)
            .order("created_at", { ascending: false }),
        supabase.from("team_members").select("team_id, profile_id, confirmation_status").in("team_id", teamIds),
    ]);

    if (teamsError) {
        throw new Error(`Gagal memuat daftar tim: ${teamsError.message}`);
    }
    if (allMembersError) {
        throw new Error(`Gagal memuat anggota untuk daftar tim: ${allMembersError.message}`);
    }

    const membersByTeamId = new Map<string, { confirmation_status: string; profile_id: string }[]>();
    (allMembers ?? []).forEach((member) => {
        const current = membersByTeamId.get(member.team_id) ?? [];
        current.push({
            confirmation_status: member.confirmation_status,
            profile_id: member.profile_id,
        });
        membersByTeamId.set(member.team_id, current);
    });

    return (teams ?? []).map((team) => {
        const members = membersByTeamId.get(team.id) ?? [];
        const selfMember = members.find((member) => member.profile_id === userId) ?? null;
        const confirmedMembersCount = members.filter((member) => member.confirmation_status === "confirmed").length;

        return {
            id: team.id,
            boardId: team.board_id,
            creatorId: team.creator_id,
            name: team.name,
            competitionName: team.competition_name,
            deadline: team.deadline,
            membersCount: members.length,
            confirmedMembersCount,
            selfCommitmentStatus: selfMember
                ? selfMember.confirmation_status === "confirmed"
                    ? "confirmed"
                    : selfMember.confirmation_status === "expired"
                      ? "expired"
                      : "pending"
                : null,
        };
    });
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberRecord[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("team_members")
        .select(
            "id, profile_id, role_name, confirmation_status, profiles(full_name), team_commitments(id, deadline_at, confirmed_at, last_reminded_at, hours_per_week)",
        )
        .eq("team_id", teamId);

    if (error) {
        throw new Error(`Gagal memuat anggota tim: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as {
        id: string;
        profile_id: string;
        role_name: string;
        confirmation_status: string;
        profiles: { full_name: string | null } | null;
        team_commitments: {
            id: string;
            deadline_at: string;
            confirmed_at: string | null;
            last_reminded_at: string | null;
            hours_per_week: number;
        } | null;
    }[];

    return rows.map((row) => {
        const commitment = row.team_commitments ?? null;
        return {
            id: row.id,
            profileId: row.profile_id,
            fullName: row.profiles?.full_name ?? null,
            roleName: row.role_name,
            confirmationStatus:
                row.confirmation_status === "confirmed"
                    ? "confirmed"
                    : row.confirmation_status === "expired"
                      ? "expired"
                      : "pending",
            commitmentId: commitment?.id ?? null,
            commitmentDeadlineAt: commitment?.deadline_at ?? null,
            commitmentConfirmedAt: commitment?.confirmed_at ?? null,
            commitmentLastRemindedAt: commitment?.last_reminded_at ?? null,
            commitmentHoursPerWeek: commitment?.hours_per_week ?? null,
        };
    });
}

export async function getTeamResult(teamId: string): Promise<TeamResultRecord | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("team_results")
        .select("id, team_id, result_summary, competition_ended_at, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw new Error(`Gagal memuat hasil tim: ${error.message}`);
    }

    return data
        ? {
              id: data.id,
              teamId: data.team_id,
              resultSummary: data.result_summary,
              competitionEndedAt: data.competition_ended_at,
              createdAt: data.created_at,
          }
        : null;
}

export async function getTeamResources(teamId: string): Promise<TeamResourceRecord[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("team_resources")
        .select("id, team_id, resource_type, label, url, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true });

    if (error) {
        throw new Error(`Gagal memuat resource tim: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        teamId: row.team_id,
        resourceType: row.resource_type,
        label: row.label,
        url: row.url,
        createdAt: row.created_at,
    }));
}

export async function getTeamActivityEvents(teamId: string): Promise<TeamActivityEventRecord[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("team_activity_events")
        .select("id, team_id, actor_id, event_type, payload, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(12);

    if (error) {
        throw new Error(`Gagal memuat aktivitas tim: ${error.message}`);
    }

    const rows = data ?? [];
    const actorMap = await getProfileNameMap(
        rows
            .map((row) => row.actor_id)
            .filter((actorId): actorId is string => typeof actorId === "string" && actorId.length > 0),
    );

    return rows.map((row) => ({
        id: row.id,
        teamId: row.team_id,
        actorId: row.actor_id,
        actorName: row.actor_id ? (actorMap.get(row.actor_id)?.fullName ?? actorMap.get(row.actor_id)?.username ?? null) : null,
        eventType: row.event_type,
        payload: typeof row.payload === "object" && row.payload !== null ? (row.payload as Record<string, unknown>) : {},
        createdAt: row.created_at,
    }));
}

export async function getTeamTestimonials(teamId: string): Promise<TestimonialRecord[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("testimonials")
        .select("id, team_id, author_id, target_profile_id, rating, body, locked_at, created_at, updated_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Gagal memuat testimoni tim: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        teamId: row.team_id,
        authorId: row.author_id,
        targetProfileId: row.target_profile_id,
        rating: row.rating,
        body: row.body,
        lockedAt: row.locked_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}
