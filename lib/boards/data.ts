import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BoardApplicationRecord, BoardDraftRecord, BoardSlotRecord, CompetitionIdeaBoardRecord } from "@/lib/types";
import { getProfileNameMap } from "@/lib/profile/data";

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

export async function getOwnBoards(userId: string): Promise<CompetitionIdeaBoardRecord[]> {
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

    const rows = (data ?? []) as BoardRecordRow[];
    return rows.map(mapBoardRecord);
}

export async function getPublicBoards(filters: {
    competitionType?: string | null;
    viewerId: string;
}): Promise<CompetitionIdeaBoardRecord[]> {
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

    const rows = (data ?? []) as BoardRecordRow[];
    const boards = rows.map(mapBoardRecord);
    const creatorMap = await getProfileNameMap([...new Set(boards.map((board) => board.userId))]);

    return boards.map((board) => ({
        ...board,
        creatorName: creatorMap.get(board.userId)?.fullName ?? creatorMap.get(board.userId)?.username ?? null,
    }));
}

export async function getBoardById(boardId: string): Promise<CompetitionIdeaBoardRecord | null> {
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

    const board = mapBoardRecord(data as BoardRecordRow);
    const creatorMap = await getProfileNameMap([board.userId]);

    return {
        ...board,
        creatorName: creatorMap.get(board.userId)?.fullName ?? creatorMap.get(board.userId)?.username ?? null,
    };
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

export async function getBoardApplicationsForBoard(boardId: string): Promise<BoardApplicationRecord[]> {
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
