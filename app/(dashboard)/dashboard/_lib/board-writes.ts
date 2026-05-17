import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCandidateDiscovery } from "@/lib/matching/data";
import { sendServerNotification } from "@/lib/notifications/service";

interface PersistBoardWithSlotsInput {
    userId: string;
    idempotencyKey: string;
    title: string;
    summary: string;
    competitionType: string;
    description: string;
    deadline: string;
    requiredSkills: string[];
    visibility: "public" | "private";
    slots: { roleName: string; slotCount: number; requiredSkills: string[] }[];
}

interface NotifyMatchingCandidatesInput {
    boardId: string;
    competitionType: string;
    creatorId: string;
    title: string;
}

interface PersistBoardWithSlotsResult {
    boardId: string;
    wasReplayed: boolean;
}

interface BoardSlotRpcPayload {
    required_skills: string[];
    role_name: string;
    slot_count: number;
}

function mapBoardSlotForRpc(slot: PersistBoardWithSlotsInput["slots"][number]): BoardSlotRpcPayload {
    return {
        role_name: slot.roleName,
        slot_count: slot.slotCount,
        required_skills: slot.requiredSkills,
    };
}

function mapBoardSlotsJson(slots: PersistBoardWithSlotsInput["slots"]): Json {
    return slots.map(mapBoardSlotForRpc) as unknown as Json;
}

export async function persistBoardWithSlots(input: PersistBoardWithSlotsInput): Promise<PersistBoardWithSlotsResult> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .rpc("create_board_with_slots_idempotent", {
            p_user_id: input.userId,
            p_title: input.title,
            p_summary: input.summary,
            p_competition_type: input.competitionType,
            p_description: input.description,
            p_deadline: input.deadline,
            p_idempotency_key: input.idempotencyKey,
            p_required_skills: input.requiredSkills,
            p_visibility: input.visibility,
            p_slots: mapBoardSlotsJson(input.slots),
        })
        .single();

    if (error) {
        throw new Error(`Gagal menyimpan board ide lomba secara atomik: ${error.message}`);
    }

    if (!data) {
        throw new Error("Board ide tidak berhasil dibuat.");
    }

    return {
        boardId: data.board_id,
        wasReplayed: data.was_replayed,
    };
}

interface UpdateBoardWithSlotsInput extends PersistBoardWithSlotsInput {
    boardId: string;
    status: "open" | "closed";
}

export async function updateBoardWithSlots(input: UpdateBoardWithSlotsInput): Promise<string> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .rpc("update_board_with_slots_idempotent", {
            p_user_id: input.userId,
            p_board_id: input.boardId,
            p_title: input.title,
            p_summary: input.summary,
            p_competition_type: input.competitionType,
            p_description: input.description,
            p_deadline: input.deadline,
            p_idempotency_key: input.idempotencyKey,
            p_required_skills: input.requiredSkills,
            p_visibility: input.visibility,
            p_status: input.status,
            p_slots: mapBoardSlotsJson(input.slots),
        })
        .single();

    if (error) {
        throw new Error(`Gagal memperbarui board ide lomba secara atomik: ${error.message}`);
    }

    if (!data) {
        throw new Error("Board ide tidak berhasil diperbarui.");
    }

    return data.board_id;
}

export async function notifyMatchingCandidates(input: NotifyMatchingCandidatesInput): Promise<void> {
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
