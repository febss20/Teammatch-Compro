import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
    TeamActivityEventRecord,
    TeamListItemRecord,
    TeamMemberRecord,
    TeamRecord,
    TeamResourceRecord,
    TeamResultRecord,
    TestimonialRecord,
} from "@/lib/types";
import { getProfileNameMap } from "@/lib/profile/data";

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
