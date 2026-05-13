"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireCompletedProfile } from "@/lib/auth";
import {
    createCompetitionIdeaBoardPayload,
    normalizeRequiredSkills,
    parseBoardSlotsJsonValue,
    safeParseCreateCompetitionIdeaBoard,
    safeParseDeleteCompetitionIdeaBoard,
    safeParseUpdateCompetitionIdeaBoard,
    updateCompetitionIdeaBoardPayload,
} from "@/lib/boards/validation";
import { competitionIdeaBoardInitialState } from "@/lib/forms";
import { logServerError } from "@/lib/security/server-errors";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CompetitionIdeaBoardFieldName, FormActionState } from "@/lib/types";
import { notifyMatchingCandidates, persistBoardWithSlots } from "@/app/(dashboard)/dashboard/_lib/board-writes";
import { revalidateBoardPaths } from "@/app/(dashboard)/dashboard/_lib/revalidation";

export interface DeleteCompetitionIdeaBoardResult {
    formError: string | null;
    success: boolean;
}

function getStringValue(formData: FormData, fieldName: string): string {
    const value = formData.get(fieldName);
    return typeof value === "string" ? value : "";
}

function getBoardFormValues(formData: FormData) {
    return {
        competition_type_other: getStringValue(formData, "competition_type_other"),
        competition_type_select: getStringValue(formData, "competition_type_select"),
        deadline: getStringValue(formData, "deadline"),
        description: getStringValue(formData, "description"),
        id: getStringValue(formData, "id"),
        required_skills: getStringValue(formData, "required_skills"),
        slots_json: getStringValue(formData, "slots_json"),
        status: getStringValue(formData, "status"),
        summary: getStringValue(formData, "summary"),
        title: getStringValue(formData, "title"),
        visibility: getStringValue(formData, "visibility"),
    };
}

export async function saveBoardDraft(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const title = typeof formData.get("title") === "string" ? String(formData.get("title")).trim() : "";
    const summary = typeof formData.get("summary") === "string" ? String(formData.get("summary")).trim() : "";
    const competitionTypeSelect =
        typeof formData.get("competition_type_select") === "string"
            ? String(formData.get("competition_type_select")).trim()
            : "";
    const competitionTypeOther =
        typeof formData.get("competition_type_other") === "string" ? String(formData.get("competition_type_other")).trim() : "";
    const description = typeof formData.get("description") === "string" ? String(formData.get("description")).trim() : "";
    const deadline = typeof formData.get("deadline") === "string" ? String(formData.get("deadline")).trim() : "";
    const requiredSkillsValue =
        typeof formData.get("required_skills") === "string" ? String(formData.get("required_skills")).trim() : "";
    const visibility = formData.get("visibility") === "private" ? "private" : "public";
    const slotsJson = typeof formData.get("slots_json") === "string" ? String(formData.get("slots_json")).trim() : "[]";
    const requiredSkills = normalizeRequiredSkills(requiredSkillsValue);
    const parsedSlots = (() => {
        try {
            return parseBoardSlotsJsonValue(slotsJson);
        } catch {
            return [];
        }
    })();
    const slots = parsedSlots.map((slot) => ({
        roleName: slot.roleName,
        slotCount: slot.slotCount,
        requiredSkills,
    }));

    const competitionType =
        competitionTypeSelect === "others" && competitionTypeOther.length > 0
            ? competitionTypeOther
            : competitionTypeSelect || null;

    try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.from("board_drafts").upsert(
            {
                user_id: user.id,
                title: title.length > 0 ? title : null,
                summary: summary.length > 0 ? summary : null,
                competition_type: competitionType,
                description: description.length > 0 ? description : null,
                deadline: deadline.length > 0 ? deadline : null,
                required_skills: requiredSkills,
                visibility,
                slots,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "user_id",
            },
        );

        if (error) {
            throw new Error(`Gagal menyimpan draft board: ${error.message}`);
        }
    } catch (error) {
        logServerError({ action: "boards.saveDraft", userId: user.id }, error);
        throw new Error("Draft board belum dapat disimpan saat ini.");
    }
}

export async function discardBoardDraft(): Promise<void> {
    const { user } = await requireCompletedProfile();
    try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.from("board_drafts").delete().eq("user_id", user.id);

        if (error) {
            throw new Error(`Gagal menghapus draft board: ${error.message}`);
        }

        revalidateBoardPaths({ boardId: null });
    } catch (error) {
        logServerError({ action: "boards.discardDraft", userId: user.id }, error);
        throw new Error("Draft board belum dapat dihapus saat ini.");
    }
}

export async function publishBoardFromDraft(
    previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    return createCompetitionIdeaBoard(previousState, formData);
}

export async function createCompetitionIdeaBoard(
    _previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    const values = getBoardFormValues(formData);

    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseCreateCompetitionIdeaBoard(formData);

        if (!validationResult.success) {
            return {
                ...competitionIdeaBoardInitialState,
                formError: "Periksa kembali field board yang masih belum valid.",
                fieldErrors: getFieldErrors<CompetitionIdeaBoardFieldName>(validationResult.error),
                values,
            };
        }

        const payload = createCompetitionIdeaBoardPayload(validationResult.data);
        const boardId = await persistBoardWithSlots({
            userId: user.id,
            title: payload.title,
            summary: payload.summary,
            competitionType: payload.competitionType,
            description: payload.description,
            deadline: payload.deadline,
            requiredSkills: payload.requiredSkills,
            visibility: payload.visibility,
            slots: payload.slots,
        });
        const supabase = await createServerSupabaseClient();
        const draftDeleteResult = await supabase.from("board_drafts").delete().eq("user_id", user.id);

        if (draftDeleteResult.error) {
            throw new Error(`Board terpublikasi tetapi draft gagal dibersihkan: ${draftDeleteResult.error.message}`);
        }

        await notifyMatchingCandidates({
            boardId,
            competitionType: payload.competitionType,
            creatorId: user.id,
            title: payload.title,
        });

        revalidateBoardPaths({ boardId });
        redirect("/dashboard/boards?created=1");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        logServerError({ action: "boards.createCompetitionIdeaBoard" }, error);
        return {
            ...competitionIdeaBoardInitialState,
            formError: "Ide lomba belum dapat disimpan saat ini.",
            values,
        };
    }
}

export async function updateCompetitionIdeaBoard(
    _previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    const values = getBoardFormValues(formData);

    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseUpdateCompetitionIdeaBoard(formData);

        if (!validationResult.success) {
            return {
                ...competitionIdeaBoardInitialState,
                formError: "Periksa kembali field board yang masih belum valid.",
                fieldErrors: getFieldErrors<CompetitionIdeaBoardFieldName>(validationResult.error),
                values,
            };
        }

        const payload = updateCompetitionIdeaBoardPayload(validationResult.data);
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from("competition_idea_boards")
            .update({
                title: payload.title,
                summary: payload.summary,
                competition_type: payload.competitionType,
                description: payload.description,
                deadline: payload.deadline,
                required_skills: payload.requiredSkills,
                visibility: payload.visibility,
                status: payload.status,
                closed_at: payload.status === "closed" ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", payload.id)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

        if (error) {
            throw new Error(`Gagal memperbarui board ide lomba: ${error.message}`);
        }
        if (!data) {
            throw new Error("Board ide tidak ditemukan atau Anda tidak memiliki akses.");
        }

        const deleteSlotsResult = await supabase.from("board_slots").delete().eq("board_id", payload.id);
        if (deleteSlotsResult.error) {
            throw new Error(`Gagal memperbarui slot board: ${deleteSlotsResult.error.message}`);
        }

        const insertSlotsResult = await supabase.from("board_slots").insert(
            payload.slots.map((slot) => ({
                board_id: payload.id,
                role_name: slot.roleName,
                slot_count: slot.slotCount,
                required_skills: slot.requiredSkills,
            })),
        );

        if (insertSlotsResult.error) {
            throw new Error(`Gagal memperbarui slot board: ${insertSlotsResult.error.message}`);
        }

        revalidateBoardPaths({ boardId: payload.id });
        redirect("/dashboard/boards?updated=1");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        logServerError({ action: "boards.updateCompetitionIdeaBoard" }, error);
        return {
            ...competitionIdeaBoardInitialState,
            formError: "Ide lomba belum dapat diperbarui saat ini.",
            values,
        };
    }
}

export async function deleteCompetitionIdeaBoard(formData: FormData): Promise<DeleteCompetitionIdeaBoardResult> {
    try {
        const { user } = await requireCompletedProfile();
        const validationResult = safeParseDeleteCompetitionIdeaBoard(formData);

        if (!validationResult.success) {
            return {
                success: false,
                formError: validationResult.error.issues[0]?.message ?? "ID board ide tidak valid.",
            };
        }

        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from("competition_idea_boards")
            .delete()
            .eq("id", validationResult.data.id)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

        if (error) {
            throw new Error(`Gagal menghapus board ide lomba: ${error.message}`);
        }
        if (!data) {
            throw new Error("Board ide tidak ditemukan atau Anda tidak memiliki akses.");
        }

        revalidateBoardPaths({ boardId: validationResult.data.id });

        return {
            success: true,
            formError: null,
        };
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        logServerError({ action: "boards.deleteCompetitionIdeaBoard" }, error);
        return {
            success: false,
            formError: "Ide lomba belum dapat dihapus saat ini.",
        };
    }
}

export async function closeBoardRecruitment(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const validationResult = safeParseDeleteCompetitionIdeaBoard(formData);

    if (!validationResult.success) {
        throw new Error(validationResult.error.issues[0]?.message ?? "ID board ide tidak valid.");
    }

    try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from("competition_idea_boards")
            .update({
                status: "closed",
                closed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", validationResult.data.id)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

        if (error) {
            throw new Error(`Gagal menutup rekrutmen board: ${error.message}`);
        }
        if (!data) {
            throw new Error("Board ide tidak ditemukan atau Anda tidak memiliki akses.");
        }

        revalidateBoardPaths({ boardId: validationResult.data.id });
    } catch (error) {
        logServerError({ action: "boards.closeRecruitment", userId: user.id }, error);
        throw new Error("Rekrutmen board belum dapat ditutup saat ini.");
    }
}
