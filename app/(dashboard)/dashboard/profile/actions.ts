"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireUser } from "@/lib/auth";
import {
    profileInitialState,
    profileStepOneInitialState,
    profileStepThreeInitialState,
    profileStepTwoInitialState,
} from "@/lib/forms";
import { ensureNotificationPreferences } from "@/lib/notifications/service";
import {
    safeParseProfileStepOne,
    safeParseProfileStepThree,
    safeParseProfileStepTwo,
    safeParseUpdateProfile,
} from "@/lib/profile/validation";
import { getFieldErrors } from "@/lib/shared/action-utils";
import type {
    FormActionState,
    ProfileFieldName,
    ProfileStepOneFieldName,
    ProfileStepThreeFieldName,
    ProfileStepTwoFieldName,
} from "@/lib/types";
import {
    persistProfileStepOne,
    persistProfileStepThree,
    persistProfileStepTwo,
} from "@/app/(dashboard)/dashboard/_lib/profile-writes";
import { revalidateProfilePaths } from "@/app/(dashboard)/dashboard/_lib/revalidation";

export async function completeProfileStepOne(
    _previousState: FormActionState<ProfileStepOneFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepOneFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParseProfileStepOne(formData);

        if (!validationResult.success) {
            return {
                ...profileStepOneInitialState,
                formError: "Periksa kembali data identitas Anda.",
                fieldErrors: getFieldErrors<ProfileStepOneFieldName>(validationResult.error),
            };
        }

        await persistProfileStepOne(user.id, validationResult.data);
        revalidateProfilePaths();

        return {
            ...profileStepOneInitialState,
            success: true,
            message: "Identitas dasar berhasil disimpan.",
        };
    } catch (error) {
        return {
            ...profileStepOneInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan identitas profil.",
        };
    }
}

export async function completeProfileStepTwo(
    _previousState: FormActionState<ProfileStepTwoFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepTwoFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParseProfileStepTwo(formData);

        if (!validationResult.success) {
            return {
                ...profileStepTwoInitialState,
                formError: "Pilih skill dan minat lomba yang masih valid.",
                fieldErrors: getFieldErrors<ProfileStepTwoFieldName>(validationResult.error),
            };
        }

        await persistProfileStepTwo(user.id, validationResult.data);
        revalidateProfilePaths();

        return {
            ...profileStepTwoInitialState,
            success: true,
            message: "Skill dan minat lomba berhasil disimpan.",
        };
    } catch (error) {
        return {
            ...profileStepTwoInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan skill profil.",
        };
    }
}

export async function completeProfileStepThree(
    _previousState: FormActionState<ProfileStepThreeFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepThreeFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParseProfileStepThree(formData);

        if (!validationResult.success) {
            return {
                ...profileStepThreeInitialState,
                formError: "Periksa kembali availability dan pengaturan privasi Anda.",
                fieldErrors: getFieldErrors<ProfileStepThreeFieldName>(validationResult.error),
            };
        }

        await persistProfileStepThree(user.id, validationResult.data, true);
        await ensureNotificationPreferences(user.id);
        revalidateProfilePaths();
        redirect("/dashboard?profile=completed");
    } catch (error) {
        if (isRedirectError(error)) {
            throw error;
        }

        return {
            ...profileStepThreeInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menyelesaikan profil.",
        };
    }
}

export async function updateProfile(
    _previousState: FormActionState<ProfileFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileFieldName>> {
    try {
        const user = await requireUser();
        const validationResult = safeParseUpdateProfile(formData);

        if (!validationResult.success) {
            return {
                ...profileInitialState,
                formError: "Periksa kembali field profil yang belum valid.",
                fieldErrors: getFieldErrors<ProfileFieldName>(validationResult.error),
            };
        }

        await persistProfileStepOne(user.id, validationResult.data);
        await persistProfileStepTwo(user.id, validationResult.data);
        await persistProfileStepThree(user.id, validationResult.data, true);
        revalidateProfilePaths();

        return {
            ...profileInitialState,
            success: true,
            message: "Profil berhasil diperbarui.",
        };
    } catch (error) {
        return {
            ...profileInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui profil.",
        };
    }
}
