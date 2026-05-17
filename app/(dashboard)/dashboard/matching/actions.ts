"use server";

import { requireCompletedProfile } from "@/lib/auth";
import { boardApplicationInitialState, joinRequestInitialState } from "@/lib/forms";
import { safeParseBoardApplication, safeParseJoinRequest } from "@/lib/matching/validation";
import { sendServerNotification } from "@/lib/notifications/service";
import { RateLimitError, throwIfRateLimited } from "@/lib/security/rate-limit";
import { logServerError, PublicActionError } from "@/lib/security/server-errors";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BoardApplicationFieldName, FormActionState, JoinRequestFieldName } from "@/lib/types";
import {
    revalidateBoardPaths,
    revalidateMatchingPaths,
    revalidateTeamPaths,
} from "@/app/(dashboard)/dashboard/_lib/revalidation";

function getStringValue(formData: FormData, fieldName: string): string {
    const value = formData.get(fieldName);
    return typeof value === "string" ? value : "";
}

function getJoinRequestValues(formData: FormData) {
    return {
        board_id: getStringValue(formData, "board_id"),
        message: getStringValue(formData, "message"),
        selected_role: getStringValue(formData, "selected_role"),
        target_profile_id: getStringValue(formData, "target_profile_id"),
    };
}

function getBoardApplicationValues(formData: FormData) {
    return {
        board_id: getStringValue(formData, "board_id"),
        board_slot_id: getStringValue(formData, "board_slot_id"),
        message: getStringValue(formData, "message"),
        selected_role: getStringValue(formData, "selected_role"),
    };
}

export async function saveCandidate(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const targetProfileId = formData.get("target_profile_id");
    if (typeof targetProfileId !== "string" || targetProfileId.length === 0) {
        throw new Error("Kandidat tidak valid.");
    }

    try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.from("candidate_saved_profiles").upsert({
            user_id: user.id,
            target_profile_id: targetProfileId,
        });

        if (error) {
            throw new Error(`Gagal menyimpan kandidat: ${error.message}`);
        }

        revalidateMatchingPaths();
    } catch (error) {
        logServerError({ action: "matching.saveCandidate", userId: user.id }, error);
        throw new Error("Kandidat belum dapat disimpan saat ini.");
    }
}

export async function unsaveCandidate(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const targetProfileId = formData.get("target_profile_id");
    if (typeof targetProfileId !== "string" || targetProfileId.length === 0) {
        throw new Error("Kandidat tidak valid.");
    }

    try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase
            .from("candidate_saved_profiles")
            .delete()
            .eq("user_id", user.id)
            .eq("target_profile_id", targetProfileId);

        if (error) {
            throw new Error(`Gagal membatalkan simpan kandidat: ${error.message}`);
        }

        revalidateMatchingPaths();
    } catch (error) {
        logServerError({ action: "matching.unsaveCandidate", userId: user.id }, error);
        throw new Error("Kandidat belum dapat dihapus dari simpanan saat ini.");
    }
}

export async function sendJoinRequest(
    _previousState: FormActionState<JoinRequestFieldName>,
    formData: FormData,
): Promise<FormActionState<JoinRequestFieldName>> {
    const values = getJoinRequestValues(formData);

    try {
        const { user, profile } = await requireCompletedProfile();
        const validationResult = safeParseJoinRequest(formData);

        if (!validationResult.success) {
            return {
                ...joinRequestInitialState,
                formError: "Periksa kembali request yang akan dikirim.",
                fieldErrors: getFieldErrors<JoinRequestFieldName>(validationResult.error),
                values,
            };
        }

        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.rpc("create_join_request", {
            p_actor_name: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
            p_board_id: validationResult.data.board_id ?? null,
            p_message: validationResult.data.message,
            p_selected_role: validationResult.data.selected_role,
            p_target_profile_id: validationResult.data.target_profile_id,
        });

        if (error) {
            throwIfRateLimited(error);
            throw new Error(`Gagal mengirim request: ${error.message}`);
        }

        await sendServerNotification({
            type: "join_request_received",
            actorName: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
            targetUserId: validationResult.data.target_profile_id,
        });

        revalidateMatchingPaths();
        return {
            ...joinRequestInitialState,
            success: true,
            message: "Request berhasil dikirim.",
        };
    } catch (error) {
        if (error instanceof PublicActionError || error instanceof RateLimitError) {
            return {
                ...joinRequestInitialState,
                formError: error.message,
                values,
            };
        }

        logServerError({ action: "matching.sendJoinRequest" }, error);
        return {
            ...joinRequestInitialState,
            formError: "Request belum dapat dikirim saat ini.",
            values,
        };
    }
}

export async function withdrawJoinRequest(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const requestId = formData.get("request_id");
    if (typeof requestId !== "string" || requestId.length === 0) {
        throw new Error("Request tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("withdraw_join_request", {
        p_request_id: requestId,
    });

    if (error) {
        logServerError({ action: "matching.withdrawJoinRequest", userId: user.id }, error);
        throw new Error("Request belum dapat ditarik saat ini.");
    }

    revalidateMatchingPaths();
}

export async function acceptJoinRequest(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const requestId = formData.get("request_id");
    if (typeof requestId !== "string" || requestId.length === 0) {
        throw new Error("Request tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("respond_join_request", {
        p_request_id: requestId,
        p_status: "accepted",
    });

    if (error) {
        logServerError({ action: "matching.acceptJoinRequest", userId: user.id }, error);
        throw new Error("Request belum dapat diterima saat ini.");
    }

    const requestRow = data?.[0];
    if (!requestRow) {
        throw new Error("Request tidak ditemukan atau Anda tidak memiliki akses.");
    }
    await sendServerNotification({
        type: "join_request_accepted",
        requesterUserId: requestRow.requester_user_id,
    });

    revalidateMatchingPaths();
}

export async function rejectJoinRequest(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const requestId = formData.get("request_id");
    if (typeof requestId !== "string" || requestId.length === 0) {
        throw new Error("Request tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("respond_join_request", {
        p_request_id: requestId,
        p_status: "rejected",
    });

    if (error) {
        logServerError({ action: "matching.rejectJoinRequest", userId: user.id }, error);
        throw new Error("Request belum dapat ditolak saat ini.");
    }

    const requestRow = data?.[0];
    if (!requestRow) {
        throw new Error("Request tidak ditemukan atau Anda tidak memiliki akses.");
    }
    await sendServerNotification({
        type: "join_request_rejected",
        requesterUserId: requestRow.requester_user_id,
    });

    revalidateMatchingPaths();
}

export async function applyToBoard(
    _previousState: FormActionState<BoardApplicationFieldName>,
    formData: FormData,
): Promise<FormActionState<BoardApplicationFieldName>> {
    const values = getBoardApplicationValues(formData);

    try {
        const { user, profile } = await requireCompletedProfile();
        const validationResult = safeParseBoardApplication(formData);

        if (!validationResult.success) {
            return {
                ...boardApplicationInitialState,
                formError: "Periksa kembali lamaran Anda.",
                fieldErrors: getFieldErrors<BoardApplicationFieldName>(validationResult.error),
                values,
            };
        }

        const supabase = await createServerSupabaseClient();
        const [boardQueryResult, slotQueryResult] = await Promise.all([
            supabase
                .from("competition_idea_boards")
                .select("id, user_id, required_skills")
                .eq("id", validationResult.data.board_id)
                .maybeSingle(),
            validationResult.data.board_slot_id
                ? supabase
                      .from("board_slots")
                      .select("id, board_id, role_name, required_skills")
                      .eq("id", validationResult.data.board_slot_id)
                      .maybeSingle()
                : Promise.resolve({ data: null, error: null }),
        ]);

        const { data: boardData, error: boardError } = boardQueryResult;
        const { data: slotData, error: slotError } = slotQueryResult;

        if (boardError) {
            throw new Error(`Gagal memeriksa board tujuan: ${boardError.message}`);
        }
        if (slotError) {
            throw new Error(`Gagal memeriksa role board: ${slotError.message}`);
        }
        if (!boardData) {
            throw new PublicActionError("Board tidak ditemukan.");
        }
        if (boardData.user_id === user.id) {
            throw new PublicActionError("Anda tidak bisa melamar ke board milik sendiri.");
        }
        if (validationResult.data.board_slot_id && !slotData) {
            throw new PublicActionError("Role board yang dipilih tidak ditemukan.");
        }
        if (slotData && slotData.board_id !== validationResult.data.board_id) {
            throw new PublicActionError("Role board yang dipilih tidak sesuai dengan board tujuan.");
        }

        const { data: applicantSkillLinks, error: applicantSkillLinksError } = await supabase
            .from("profile_skills")
            .select("skill_id")
            .eq("profile_id", user.id);

        if (applicantSkillLinksError) {
            throw new Error(`Gagal memuat skill pelamar: ${applicantSkillLinksError.message}`);
        }

        const applicantSkillIds = (applicantSkillLinks ?? []).map((item) => item.skill_id);
        const applicantSkillLabels =
            applicantSkillIds.length > 0
                ? await (async () => {
                      const { data: skillRows, error: skillRowsError } = await supabase
                          .from("skill_taxonomy")
                          .select("label")
                          .in("id", applicantSkillIds);

                      if (skillRowsError) {
                          throw new Error(`Gagal memuat label skill pelamar: ${skillRowsError.message}`);
                      }

                      return new Set((skillRows ?? []).map((item) => item.label.toLowerCase()));
                  })()
                : new Set<string>();

        const slotRequiredSkills = slotData?.required_skills ?? [];
        const requiredSkillsForMatching =
            slotRequiredSkills.length > 0 ? slotRequiredSkills : (boardData.required_skills ?? []);

        const skillMatchCount = requiredSkillsForMatching.filter((skill) =>
            applicantSkillLabels.has(skill.toLowerCase()),
        ).length;
        const skillMatchScore =
            requiredSkillsForMatching.length === 0
                ? 0
                : Math.min(100, Math.round((skillMatchCount / requiredSkillsForMatching.length) * 100));

        const { data, error } = await supabase.rpc("create_board_application", {
            p_actor_name: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
            p_board_id: validationResult.data.board_id,
            p_board_slot_id: validationResult.data.board_slot_id ?? null,
            p_message: validationResult.data.message,
            p_selected_role: validationResult.data.selected_role,
            p_skill_match_score: skillMatchScore,
        });

        if (error) {
            throwIfRateLimited(error);
            throw new Error(`Gagal mengirim lamaran: ${error.message}`);
        }

        const applicationRow = data?.[0];
        if (!applicationRow) {
            throw new Error("Lamaran gagal diproses karena respons database tidak lengkap.");
        }

        await sendServerNotification({
            type: "board_application_received",
            actorName: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
            boardId: validationResult.data.board_id,
            ownerUserId: applicationRow.owner_user_id,
        });

        revalidateBoardPaths({ boardId: validationResult.data.board_id });

        return {
            ...boardApplicationInitialState,
            success: true,
            message: "Lamaran berhasil dikirim.",
        };
    } catch (error) {
        if (error instanceof PublicActionError || error instanceof RateLimitError) {
            return {
                ...boardApplicationInitialState,
                formError: error.message,
                values,
            };
        }

        logServerError({ action: "matching.applyToBoard" }, error);
        return {
            ...boardApplicationInitialState,
            formError: "Lamaran belum dapat dikirim saat ini.",
            values,
        };
    }
}

export async function saveBoardApplication(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const applicationId = formData.get("application_id");
    if (typeof applicationId !== "string" || applicationId.length === 0) {
        throw new Error("Lamaran tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("save_board_application_for_review", {
        p_application_id: applicationId,
    });

    if (error) {
        logServerError({ action: "matching.saveBoardApplication", userId: user.id }, error);
        throw new Error("Lamaran tidak ditemukan atau Anda tidak memiliki akses.");
    }

    revalidateBoardPaths({ boardId: null });
}

export async function acceptBoardApplication(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const applicationId = formData.get("application_id");
    if (typeof applicationId !== "string" || applicationId.length === 0) {
        throw new Error("Lamaran tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: acceptanceResult, error: acceptanceError } = await supabase.rpc("accept_board_application", {
        p_application_id: applicationId,
    });

    if (acceptanceError) {
        logServerError({ action: "matching.acceptBoardApplication", userId: user.id }, acceptanceError);
        throw new Error("Lamaran belum dapat diterima saat ini.");
    }

    const acceptanceRow = acceptanceResult?.[0] ?? null;
    if (!acceptanceRow) {
        throw new Error("Lamaran diterima tetapi team tidak berhasil dipetakan.");
    }

    await sendServerNotification({
        type: "board_application_accepted",
        applicantUserId: acceptanceRow.accepted_applicant_id,
        teamId: acceptanceRow.accepted_team_id,
    });

    revalidateBoardPaths({ boardId: acceptanceRow.accepted_board_id });
    revalidateTeamPaths({ teamId: acceptanceRow.accepted_team_id, boardId: acceptanceRow.accepted_board_id });
}

export async function rejectBoardApplication(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const applicationId = formData.get("application_id");
    if (typeof applicationId !== "string" || applicationId.length === 0) {
        throw new Error("Lamaran tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("reject_board_application", {
        p_application_id: applicationId,
    });

    if (error) {
        logServerError({ action: "matching.rejectBoardApplication", userId: user.id }, error);
        throw new Error("Lamaran belum dapat ditolak saat ini.");
    }

    const application = data?.[0];
    if (!application) {
        throw new Error("Lamaran tidak ditemukan atau Anda tidak memiliki akses.");
    }

    await sendServerNotification({
        type: "board_application_rejected",
        applicantUserId: application.applicant_id,
    });

    revalidateBoardPaths({ boardId: application.board_id });
}
