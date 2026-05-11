import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCandidateDiscovery } from "@/lib/matching/data";
import { sendServerNotification } from "@/lib/notifications/service";

interface PersistBoardWithSlotsInput {
    userId: string;
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

export async function persistBoardWithSlots(input: PersistBoardWithSlotsInput): Promise<string> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("competition_idea_boards")
        .insert({
            user_id: input.userId,
            title: input.title,
            summary: input.summary,
            competition_type: input.competitionType,
            description: input.description,
            deadline: input.deadline,
            required_skills: input.requiredSkills,
            status: "open",
            visibility: input.visibility,
            is_draft: false,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(`Gagal menyimpan board ide lomba: ${error.message}`);
    }

    const slotsResult = await supabase.from("board_slots").insert(
        input.slots.map((slot) => ({
            board_id: data.id,
            role_name: slot.roleName,
            slot_count: slot.slotCount,
            required_skills: slot.requiredSkills,
        })),
    );

    if (slotsResult.error) {
        throw new Error(`Board tersimpan tetapi slot tim gagal dibuat: ${slotsResult.error.message}`);
    }

    return data.id;
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
