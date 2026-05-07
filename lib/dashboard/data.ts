import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
    BoardApplicationRecord,
    BoardSlotRecord,
    CandidateRecord,
    CompetitionIdeaBoardRecord,
    CompetitionTypeRecord,
    DashboardMonth,
    JoinRequestRecord,
    NotificationRecord,
    ProfileRecord,
    SkillOption,
    TeamRecord,
    TeamMemberRecord,
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

    const skillLinkRows = (skillLinks ?? []) as {
        skill_taxonomy: { id: string; slug: string; label: string; category: string } | null;
    }[];
    const competitionLinkRows = (competitionLinks ?? []) as {
        competition_type_taxonomy: { id: string; slug: string; label: string; recommended_skills: string[] } | null;
    }[];

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

export async function getDashboardSnapshot(userId: string) {
    const supabase = await createServerSupabaseClient();
    const [
        { count: boardsCount, error: boardsError },
        { count: outgoingRequestCount, error: requestsError },
        { count: incomingApplicationCount, error: applicationsError },
        { data: notifications, error: notificationsError },
    ] = await Promise.all([
        supabase.from("competition_idea_boards").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("join_requests").select("*", { count: "exact", head: true }).eq("requester_id", userId),
        supabase
            .from("board_applications")
            .select("id, competition_idea_boards!inner(user_id)", { count: "exact", head: true })
            .eq("competition_idea_boards.user_id", userId),
        supabase
            .from("user_notifications")
            .select("id, category, title, body, link_path, is_read, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
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
    if (notificationsError) {
        throw new Error(`Gagal memuat notifikasi: ${notificationsError.message}`);
    }

    return {
        boardsCount: boardsCount ?? 0,
        outgoingRequestCount: outgoingRequestCount ?? 0,
        incomingApplicationCount: incomingApplicationCount ?? 0,
        notifications: (notifications ?? []).map(
            (item): NotificationRecord => ({
                id: item.id,
                category: item.category as NotificationRecord["category"],
                title: item.title,
                body: item.body,
                linkPath: item.link_path,
                isRead: item.is_read,
                createdAt: item.created_at,
            }),
        ),
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

    return (data ?? []).map(mapBoardRecord);
}

export async function getPublicBoards(filters: { competitionType?: string | null; viewerId: string }) {
    const supabase = await createServerSupabaseClient();
    let query = supabase
        .from("competition_idea_boards")
        .select(
            "id, user_id, title, competition_type, summary, description, deadline, required_skills, status, visibility, is_draft, published_at, closed_at, last_applicant_at, created_at, updated_at, profiles(full_name), board_slots(id, board_id, role_name, slot_count, required_skills)",
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
    return (data ?? []).map(mapBoardRecord);
}

export async function getBoardById(boardId: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("competition_idea_boards")
        .select(
            "id, user_id, title, competition_type, summary, description, deadline, required_skills, status, visibility, is_draft, published_at, closed_at, last_applicant_at, created_at, updated_at, profiles(full_name), board_slots(id, board_id, role_name, slot_count, required_skills)",
        )
        .eq("id", boardId)
        .maybeSingle();

    if (error) {
        throw new Error(`Gagal memuat board: ${error.message}`);
    }
    return data ? mapBoardRecord(data) : null;
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

    const skillLinkDiscoveryRows = (skillLinksResult.data ?? []) as {
        profile_id: string;
        skill_taxonomy: { id: string; slug: string; label: string; category: string } | null;
    }[];
    const competitionDiscoveryRows = (preferenceLinksResult.data ?? []) as {
        profile_id: string;
        competition_type_taxonomy: { id: string; slug: string; label: string; recommended_skills: string[] } | null;
    }[];
    const availabilityRows = (availabilityResult.data ?? []) as {
        profile_id: string;
        available_months: string[];
        hours_per_week: number;
    }[];
    const summaryRows = (summaryResult.data ?? []) as {
        profile_id: string;
        average_rating: number;
        testimonial_count: number;
        best_result: string | null;
        competitions_count: number;
    }[];

    skillLinkDiscoveryRows.forEach((item) => {
        const current = skillsByProfile.get(item.profile_id) ?? [];
        if (item.skill_taxonomy) {
            current.push(mapSkill(item.skill_taxonomy as { id: string; slug: string; label: string; category: string }));
        }
        skillsByProfile.set(item.profile_id, current);
    });

    competitionDiscoveryRows.forEach((item) => {
        const current = competitionsByProfile.get(item.profile_id) ?? [];
        if (item.competition_type_taxonomy) {
            current.push(
                mapCompetitionType(
                    item.competition_type_taxonomy as {
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
            competitionsCount: summary?.competitions ?? 0,
            bestResult: summary?.bestResult ?? null,
        };
    });

    return { candidates, viewerProfile };
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

    return (data ?? []).map(
        (row): JoinRequestRecord => ({
            id: row.id,
            requesterId: row.requester_id,
            targetProfileId: row.target_profile_id,
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

export async function getBoardApplicationsForBoard(boardId: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("board_applications")
        .select(
            "id, board_id, applicant_id, board_slot_id, selected_role, message, status, skill_match_score, created_at, updated_at, responded_at",
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

    const rows = (data ?? []) as {
        id: string;
        profile_id: string;
        role_name: string;
        confirmation_status: string;
        profiles: { full_name: string | null } | null;
        team_commitments:
            | { id: string; deadline_at: string; confirmed_at: string | null; last_reminded_at: string | null; hours_per_week: number }[]
            | null;
    }[];

    return rows.map((row) => {
        const commitment = row.team_commitments?.[0] ?? null;
        return {
            id: row.id,
            profileId: row.profile_id,
            fullName: row.profiles?.full_name ?? null,
            roleName: row.role_name,
            confirmationStatus: row.confirmation_status === "confirmed" ? "confirmed" : row.confirmation_status === "expired" ? "expired" : "pending",
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

export async function getNotificationCenter(userId: string): Promise<NotificationRecord[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("user_notifications")
        .select("id, category, title, body, link_path, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        throw new Error(`Gagal memuat pusat notifikasi: ${error.message}`);
    }

    return (data ?? []).map((item) => ({
        id: item.id,
        category: item.category as NotificationRecord["category"],
        title: item.title,
        body: item.body,
        linkPath: item.link_path,
        isRead: item.is_read,
        createdAt: item.created_at,
    }));
}
