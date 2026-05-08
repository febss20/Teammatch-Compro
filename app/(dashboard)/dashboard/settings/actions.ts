"use server";

import { redirect } from "next/navigation";
import { requireCompletedProfile, requireUser } from "@/lib/auth";
import { safeParsePasswordChange } from "@/lib/auth/validation";
import { passwordChangeInitialState, settingsInitialState } from "@/lib/forms";
import { markNotificationReadForUser, updateNotificationPreferences } from "@/lib/notifications/service";
import { safeParseSettings } from "@/lib/settings/validation";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FormActionState, PasswordChangeFieldName, SettingsFieldName } from "@/lib/types";
import { insertPrivacyAuditEvent } from "@/app/(dashboard)/dashboard/_lib/privacy";
import { revalidateNotificationPaths, revalidateProfilePaths } from "@/app/(dashboard)/dashboard/_lib/revalidation";

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
        const user = await requireUser();
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
            throw new Error(`Gagal memperbarui password akun ${user.id}: ${error.message}`);
        }

        return {
            ...passwordChangeInitialState,
            success: true,
            message: "Password berhasil diperbarui.",
        };
    } catch (error) {
        return {
            ...passwordChangeInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui password.",
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
    try {
        const user = await requireUser();
        const validationResult = safeParseSettings(formData);

        if (!validationResult.success) {
            return {
                ...settingsInitialState,
                formError: "Periksa kembali pengaturan yang Anda ubah.",
                fieldErrors: getFieldErrors<SettingsFieldName>(validationResult.error),
            };
        }

        const publicVisibility = validationResult.data.public_visibility === "public";
        const showCompetitionHistory = validationResult.data.show_competition_history === "true";
        const requestUpdates = validationResult.data.request_updates === "true";
        const boardUpdates = validationResult.data.board_updates === "true";
        const commitmentUpdates = validationResult.data.commitment_updates === "true";
        const reminderUpdates = validationResult.data.reminder_updates === "true";

        const supabase = await createServerSupabaseClient();
        const profileResult = await supabase
            .from("profiles")
            .update({
                public_visibility: publicVisibility,
                show_competition_history: showCompetitionHistory,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (profileResult.error) {
            throw new Error(`Gagal menyimpan pengaturan profil: ${profileResult.error.message}`);
        }

        await updateNotificationPreferences(user.id, {
            request_updates: requestUpdates,
            board_updates: boardUpdates,
            commitment_updates: commitmentUpdates,
            reminder_updates: reminderUpdates,
        });

        await insertPrivacyAuditEvent(user.id, "settings_updated", {
            public_visibility: validationResult.data.public_visibility,
            show_competition_history: validationResult.data.show_competition_history === "true",
            request_updates: requestUpdates,
            board_updates: boardUpdates,
            commitment_updates: commitmentUpdates,
            reminder_updates: reminderUpdates,
        });

        revalidateNotificationPaths();
        revalidateProfilePaths();

        return {
            ...settingsInitialState,
            success: true,
            message: "Pengaturan berhasil diperbarui.",
        };
    } catch (error) {
        return {
            ...settingsInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui pengaturan.",
        };
    }
}
