"use server";

import { requireCompletedProfile } from "@/lib/auth";
import { boardApplicationInitialState, joinRequestInitialState } from "@/lib/forms";
import { safeParseBoardApplication, safeParseJoinRequest } from "@/lib/matching/validation";
import { sendServerNotification } from "@/lib/notifications/service";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BoardApplicationFieldName, FormActionState, JoinRequestFieldName } from "@/lib/types";
import {
    revalidateBoardPaths,
    revalidateMatchingPaths,
    revalidateTeamPaths,
} from "@/app/(dashboard)/dashboard/_lib/revalidation";
import { insertTeamActivityEvent } from "@/app/(dashboard)/dashboard/_lib/team-writes";

export async function saveCandidate(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const targetProfileId = formData.get("target_profile_id");
    if (typeof targetProfileId !== "string" || targetProfileId.length === 0) {
        throw new Error("Kandidat tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("candidate_saved_profiles").upsert({
        user_id: user.id,
        target_profile_id: targetProfileId,
    });

    if (error) {
        throw new Error(`Gagal menyimpan kandidat: ${error.message}`);
    }

    revalidateMatchingPaths();
}

export async function unsaveCandidate(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const targetProfileId = formData.get("target_profile_id");
    if (typeof targetProfileId !== "string" || targetProfileId.length === 0) {
        throw new Error("Kandidat tidak valid.");
    }

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
}

export async function sendJoinRequest(
    _previousState: FormActionState<JoinRequestFieldName>,
    formData: FormData,
): Promise<FormActionState<JoinRequestFieldName>> {
    try {
        const { user, profile } = await requireCompletedProfile();
        const validationResult = safeParseJoinRequest(formData);

        if (!validationResult.success) {
            return {
                ...joinRequestInitialState,
                formError: "Periksa kembali request yang akan dikirim.",
                fieldErrors: getFieldErrors<JoinRequestFieldName>(validationResult.error),
            };
        }

        const supabase = await createServerSupabaseClient();
        const { data: existingRejected, error: rejectionError } = await supabase
            .from("join_requests")
            .select("id, rejection_locked")
            .eq("requester_id", user.id)
            .eq("target_profile_id", validationResult.data.target_profile_id)
            .eq("status", "rejected")
            .eq("rejection_locked", true)
            .maybeSingle();

        if (rejectionError) {
            throw new Error(`Gagal memeriksa riwayat request: ${rejectionError.message}`);
        }
        if (existingRejected) {
            throw new Error("Anda tidak bisa mengirim ulang request ke kandidat yang pernah menolak.");
        }

        const { data, error } = await supabase
            .from("join_requests")
            .insert({
                requester_id: user.id,
                target_profile_id: validationResult.data.target_profile_id,
                board_id: validationResult.data.board_id ?? null,
                selected_role: validationResult.data.selected_role,
                message: validationResult.data.message,
            })
            .select("id")
            .single();

        if (error) {
            throw new Error(`Gagal mengirim request: ${error.message}`);
        }

        await supabase.from("join_request_events").insert({
            join_request_id: data.id,
            actor_id: user.id,
            event_type: "created",
            note: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
        });

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
        return {
            ...joinRequestInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim request.",
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
    const { error } = await supabase
        .from("join_requests")
        .update({
            status: "withdrawn",
            updated_at: new Date().toISOString(),
            responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("requester_id", user.id);

    if (error) {
        throw new Error(`Gagal menarik request: ${error.message}`);
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
    const { data: requestRow, error: requestError } = await supabase
        .from("join_requests")
        .select("id, requester_id, target_profile_id, status")
        .eq("id", requestId)
        .eq("target_profile_id", user.id)
        .maybeSingle();

    if (requestError) {
        throw new Error(`Gagal memuat request masuk: ${requestError.message}`);
    }
    if (!requestRow) {
        throw new Error("Request tidak ditemukan atau Anda tidak memiliki akses.");
    }
    if (requestRow.status !== "pending") {
        throw new Error("Hanya request dengan status pending yang dapat diterima.");
    }

    const now = new Date().toISOString();
    const [updateResult, eventResult] = await Promise.all([
        supabase
            .from("join_requests")
            .update({
                status: "accepted",
                updated_at: now,
                responded_at: now,
            })
            .eq("id", requestId),
        supabase.from("join_request_events").insert({
            join_request_id: requestId,
            actor_id: user.id,
            event_type: "accepted",
        }),
    ]);

    if (updateResult.error) {
        throw new Error(`Gagal menerima request: ${updateResult.error.message}`);
    }
    if (eventResult.error) {
        throw new Error(`Request diterima tetapi event tidak tercatat: ${eventResult.error.message}`);
    }

    await sendServerNotification({
        type: "join_request_accepted",
        requesterUserId: requestRow.requester_id,
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
    const { data: requestRow, error: requestError } = await supabase
        .from("join_requests")
        .select("id, requester_id, target_profile_id, status")
        .eq("id", requestId)
        .eq("target_profile_id", user.id)
        .maybeSingle();

    if (requestError) {
        throw new Error(`Gagal memuat request masuk: ${requestError.message}`);
    }
    if (!requestRow) {
        throw new Error("Request tidak ditemukan atau Anda tidak memiliki akses.");
    }
    if (requestRow.status !== "pending") {
        throw new Error("Hanya request dengan status pending yang dapat ditolak.");
    }

    const now = new Date().toISOString();
    const [updateResult, eventResult] = await Promise.all([
        supabase
            .from("join_requests")
            .update({
                status: "rejected",
                rejection_locked: true,
                updated_at: now,
                responded_at: now,
            })
            .eq("id", requestId),
        supabase.from("join_request_events").insert({
            join_request_id: requestId,
            actor_id: user.id,
            event_type: "rejected",
        }),
    ]);

    if (updateResult.error) {
        throw new Error(`Gagal menolak request: ${updateResult.error.message}`);
    }
    if (eventResult.error) {
        throw new Error(`Request ditolak tetapi event tidak tercatat: ${eventResult.error.message}`);
    }

    await sendServerNotification({
        type: "join_request_rejected",
        requesterUserId: requestRow.requester_id,
    });

    revalidateMatchingPaths();
}

export async function applyToBoard(
    _previousState: FormActionState<BoardApplicationFieldName>,
    formData: FormData,
): Promise<FormActionState<BoardApplicationFieldName>> {
    try {
        const { user, profile } = await requireCompletedProfile();
        const validationResult = safeParseBoardApplication(formData);

        if (!validationResult.success) {
            return {
                ...boardApplicationInitialState,
                formError: "Periksa kembali lamaran Anda.",
                fieldErrors: getFieldErrors<BoardApplicationFieldName>(validationResult.error),
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
            throw new Error("Board tidak ditemukan.");
        }
        if (boardData.user_id === user.id) {
            throw new Error("Anda tidak bisa melamar ke board milik sendiri.");
        }
        if (validationResult.data.board_slot_id && !slotData) {
            throw new Error("Role board yang dipilih tidak ditemukan.");
        }
        if (slotData && slotData.board_id !== validationResult.data.board_id) {
            throw new Error("Role board yang dipilih tidak sesuai dengan board tujuan.");
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

        const { data, error } = await supabase
            .from("board_applications")
            .insert({
                board_id: validationResult.data.board_id,
                applicant_id: user.id,
                board_slot_id: validationResult.data.board_slot_id ?? null,
                selected_role: validationResult.data.selected_role,
                message: validationResult.data.message,
                skill_match_score: skillMatchScore,
            })
            .select("id")
            .single();

        if (error) {
            throw new Error(`Gagal mengirim lamaran: ${error.message}`);
        }

        await supabase.from("board_application_events").insert({
            board_application_id: data.id,
            actor_id: user.id,
            event_type: "created",
            note: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
        });

        await supabase
            .from("competition_idea_boards")
            .update({
                last_applicant_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", validationResult.data.board_id);

        await sendServerNotification({
            type: "board_application_received",
            actorName: profile.fullName ?? user.email ?? "Pengguna TeamMatch",
            boardId: validationResult.data.board_id,
            ownerUserId: boardData.user_id,
        });

        revalidateBoardPaths({ boardId: validationResult.data.board_id });

        return {
            ...boardApplicationInitialState,
            success: true,
            message: "Lamaran berhasil dikirim.",
        };
    } catch (error) {
        return {
            ...boardApplicationInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim lamaran.",
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
    const { error } = await supabase
        .from("board_applications")
        .update({
            status: "saved",
            updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

    if (error) {
        throw new Error(`Gagal menyimpan lamaran untuk ditinjau: ${error.message}`);
    }

    await supabase.from("board_application_events").insert({
        board_application_id: applicationId,
        actor_id: user.id,
        event_type: "saved",
    });

    revalidateBoardPaths({ boardId: null });
}

export async function acceptBoardApplication(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const applicationId = formData.get("application_id");
    if (typeof applicationId !== "string" || applicationId.length === 0) {
        throw new Error("Lamaran tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: applicationContext, error: applicationError } = await supabase
        .from("board_applications")
        .select("id, board_id, applicant_id, selected_role, competition_idea_boards!inner(user_id)")
        .eq("id", applicationId)
        .eq("competition_idea_boards.user_id", user.id)
        .single();

    if (applicationError) {
        throw new Error(`Gagal memuat lamaran: ${applicationError.message}`);
    }

    const application = applicationContext as unknown as {
        id: string;
        applicant_id: string;
        board_id: string;
        selected_role: string;
    };

    const { data: acceptanceResult, error: acceptanceError } = await supabase.rpc("accept_board_application", {
        p_application_id: applicationId,
    });

    if (acceptanceError) {
        throw new Error(`Gagal menerima lamaran: ${acceptanceError.message}`);
    }

    const acceptanceRow = acceptanceResult?.[0] ?? null;
    if (!acceptanceRow) {
        throw new Error("Lamaran diterima tetapi team tidak berhasil dipetakan.");
    }

    const { error: eventError } = await supabase.from("board_application_events").insert({
        board_application_id: applicationId,
        actor_id: user.id,
        event_type: "accepted",
        note: acceptanceRow.accepted_team_created ? "team_created" : "team_reused",
    });

    if (eventError) {
        throw new Error(`Lamaran diterima tetapi event lamaran gagal dicatat: ${eventError.message}`);
    }

    await sendServerNotification({
        type: "board_application_accepted",
        applicantUserId: application.applicant_id,
        teamId: acceptanceRow.accepted_team_id,
    });
    await insertTeamActivityEvent(acceptanceRow.accepted_team_id, user.id, "application_accepted", {
        application_id: application.id,
        applicant_id: application.applicant_id,
        role_name: application.selected_role,
        team_created: acceptanceRow.accepted_team_created,
    });

    revalidateBoardPaths({ boardId: application.board_id });
    revalidateTeamPaths({ teamId: acceptanceRow.accepted_team_id, boardId: application.board_id });
}

export async function rejectBoardApplication(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const applicationId = formData.get("application_id");
    if (typeof applicationId !== "string" || applicationId.length === 0) {
        throw new Error("Lamaran tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: rawApplication, error: applicationError } = await supabase
        .from("board_applications")
        .select("id, board_id, applicant_id, competition_idea_boards!inner(user_id)")
        .eq("id", applicationId)
        .eq("competition_idea_boards.user_id", user.id)
        .single();

    if (applicationError) {
        throw new Error(`Gagal memuat lamaran: ${applicationError.message}`);
    }

    const application = rawApplication as unknown as { id: string; board_id: string; applicant_id: string };

    const { error } = await supabase
        .from("board_applications")
        .update({
            status: "rejected",
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

    if (error) {
        throw new Error(`Gagal menolak lamaran: ${error.message}`);
    }

    await sendServerNotification({
        type: "board_application_rejected",
        applicantUserId: application.applicant_id,
    });

    revalidateBoardPaths({ boardId: application.board_id });
}
