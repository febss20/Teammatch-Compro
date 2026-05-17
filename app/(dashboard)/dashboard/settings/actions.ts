"use server";

import { redirect } from "next/navigation";
import { requireCompletedProfile, requireUser } from "@/lib/auth";
import { safeParsePasswordChange } from "@/lib/auth/validation";
import { passwordChangeInitialState, settingsInitialState } from "@/lib/forms";
import { markNotificationReadForUser } from "@/lib/notifications/service";
import { logServerError } from "@/lib/security/server-errors";
import { safeParseSettings } from "@/lib/settings/validation";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { requireIdempotencyKey } from "@/lib/shared/idempotency";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FormActionState, PasswordChangeFieldName, SettingsFieldName } from "@/lib/types";
import { revalidateNotificationPaths, revalidateProfilePaths } from "@/app/(dashboard)/dashboard/_lib/revalidation";

function getStringValue(formData: FormData, fieldName: string): string {
    const value = formData.get(fieldName);
    return typeof value === "string" ? value : "";
}

function getSettingsValues(formData: FormData) {
    return {
        board_updates: getStringValue(formData, "board_updates"),
        commitment_updates: getStringValue(formData, "commitment_updates"),
        public_visibility: getStringValue(formData, "public_visibility"),
        reminder_updates: getStringValue(formData, "reminder_updates"),
        request_updates: getStringValue(formData, "request_updates"),
        show_competition_history: getStringValue(formData, "show_competition_history"),
    };
}

interface UpdateSettingsAtomicInput {
    boardUpdates: boolean;
    commitmentUpdates: boolean;
    idempotencyKey: string;
    publicVisibility: boolean;
    reminderUpdates: boolean;
    requestUpdates: boolean;
    showCompetitionHistory: boolean;
    userId: string;
}

async function updateSettingsAtomic(input: UpdateSettingsAtomicInput): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("update_settings_atomic_idempotent", {
        p_user_id: input.userId,
        p_public_visibility: input.publicVisibility,
        p_show_competition_history: input.showCompetitionHistory,
        p_request_updates: input.requestUpdates,
        p_board_updates: input.boardUpdates,
        p_commitment_updates: input.commitmentUpdates,
        p_reminder_updates: input.reminderUpdates,
        p_idempotency_key: input.idempotencyKey,
    });

    if (error) {
        throw new Error(`Gagal memperbarui pengaturan secara atomik: ${error.message}`);
    }
}

export async function logoutAction(): Promise<void> {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/login");
}

export async function updatePassword(
    _previousState: FormActionState<PasswordChangeFieldName>,
    formData: FormData,
): Promise<FormActionState<PasswordChangeFieldName>> {
    try {
        await requireUser();
        const validationResult = safeParsePasswordChange(formData);

        if (!validationResult.success) {
            return {
                ...passwordChangeInitialState,
                formError: "Periksa kembali password yang Anda isi.",
                fieldErrors: getFieldErrors<PasswordChangeFieldName>(validationResult.error),
            };
        }

        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.updateUser({
            password: validationResult.data.new_password,
            current_password: validationResult.data.current_password,
        });

        if (error) {
            throw new Error(`Gagal memperbarui password akun: ${error.message}`);
        }

        return {
            ...passwordChangeInitialState,
            success: true,
            message: "Password berhasil diperbarui.",
        };
    } catch (error) {
        logServerError({ action: "settings.updatePassword" }, error);
        return {
            ...passwordChangeInitialState,
            formError: "Password belum dapat diperbarui saat ini.",
        };
    }
}

export async function markNotificationRead(formData: FormData): Promise<void> {
    const { user } = await requireCompletedProfile();
    const notificationId = formData.get("notification_id");
    if (typeof notificationId !== "string" || notificationId.length === 0) {
        throw new Error("Notifikasi tidak valid.");
    }

    await markNotificationReadForUser(user.id, notificationId);
    revalidateNotificationPaths();
}

export async function updateSettings(
    _previousState: FormActionState<SettingsFieldName>,
    formData: FormData,
): Promise<FormActionState<SettingsFieldName>> {
    const values = getSettingsValues(formData);

    try {
        const user = await requireUser();
        const validationResult = safeParseSettings(formData);
        const idempotencyKey = requireIdempotencyKey(formData, "pembaruan pengaturan");

        if (!validationResult.success) {
            return {
                ...settingsInitialState,
                formError: "Periksa kembali pengaturan yang Anda ubah.",
                fieldErrors: getFieldErrors<SettingsFieldName>(validationResult.error),
                values,
            };
        }

        const publicVisibility = validationResult.data.public_visibility === "public";
        const showCompetitionHistory = validationResult.data.show_competition_history === "true";
        const requestUpdates = validationResult.data.request_updates === "true";
        const boardUpdates = validationResult.data.board_updates === "true";
        const commitmentUpdates = validationResult.data.commitment_updates === "true";
        const reminderUpdates = validationResult.data.reminder_updates === "true";

        await updateSettingsAtomic({
            userId: user.id,
            idempotencyKey,
            publicVisibility: publicVisibility,
            showCompetitionHistory: showCompetitionHistory,
            requestUpdates,
            boardUpdates,
            commitmentUpdates,
            reminderUpdates,
        });

        revalidateNotificationPaths();
        revalidateProfilePaths();

        return {
            ...settingsInitialState,
            success: true,
            message: "Pengaturan berhasil diperbarui.",
        };
    } catch (error) {
        logServerError({ action: "settings.updateSettings" }, error);
        return {
            ...settingsInitialState,
            formError: "Pengaturan belum dapat diperbarui saat ini.",
            values,
        };
    }
}
