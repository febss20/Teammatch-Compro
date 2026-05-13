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
import { logServerError } from "@/lib/security/server-errors";
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

function getStringValue(formData: FormData, fieldName: string): string {
    const value = formData.get(fieldName);
    return typeof value === "string" ? value : "";
}

function getStringArrayValues(formData: FormData, fieldName: string): string[] {
    return formData.getAll(fieldName).filter((value): value is string => typeof value === "string");
}

function getProfileStepOneValues(formData: FormData) {
    return {
        bio: getStringValue(formData, "bio"),
        campus_name: getStringValue(formData, "campus_name"),
        full_name: getStringValue(formData, "full_name"),
        username: getStringValue(formData, "username"),
    };
}

function getProfileStepTwoValues(formData: FormData) {
    return {
        competition_types: getStringArrayValues(formData, "competition_types"),
        custom_competition_types: getStringArrayValues(formData, "custom_competition_types"),
        custom_skills: getStringArrayValues(formData, "custom_skills"),
        skills: getStringArrayValues(formData, "skills"),
    };
}

function getProfileStepThreeValues(formData: FormData) {
    return {
        available_months: getStringArrayValues(formData, "available_months"),
        hours_per_week: getStringValue(formData, "hours_per_week"),
        public_visibility: getStringValue(formData, "public_visibility"),
        show_competition_history: getStringValue(formData, "show_competition_history") || "false",
    };
}

function getProfileValues(formData: FormData) {
    return {
        ...getProfileStepOneValues(formData),
        ...getProfileStepTwoValues(formData),
        ...getProfileStepThreeValues(formData),
    };
}

export async function completeProfileStepOne(
    _previousState: FormActionState<ProfileStepOneFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepOneFieldName>> {
    const values = getProfileStepOneValues(formData);

    try {
        const user = await requireUser();
        const validationResult = safeParseProfileStepOne(formData);

        if (!validationResult.success) {
            return {
                ...profileStepOneInitialState,
                formError: "Periksa kembali data identitas Anda.",
                fieldErrors: getFieldErrors<ProfileStepOneFieldName>(validationResult.error),
                values,
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
        logServerError({ action: "profile.completeStepOne" }, error);
        return {
            ...profileStepOneInitialState,
            formError: "Identitas profil belum dapat disimpan saat ini.",
            values,
        };
    }
}

export async function completeProfileStepTwo(
    _previousState: FormActionState<ProfileStepTwoFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepTwoFieldName>> {
    const values = getProfileStepTwoValues(formData);

    try {
        const user = await requireUser();
        const validationResult = safeParseProfileStepTwo(formData);

        if (!validationResult.success) {
            return {
                ...profileStepTwoInitialState,
                formError: "Pilih skill dan minat lomba yang masih valid.",
                fieldErrors: getFieldErrors<ProfileStepTwoFieldName>(validationResult.error),
                values,
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
        logServerError({ action: "profile.completeStepTwo" }, error);
        return {
            ...profileStepTwoInitialState,
            formError: "Skill profil belum dapat disimpan saat ini.",
            values,
        };
    }
}

export async function completeProfileStepThree(
    _previousState: FormActionState<ProfileStepThreeFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepThreeFieldName>> {
    const values = getProfileStepThreeValues(formData);

    try {
        const user = await requireUser();
        const validationResult = safeParseProfileStepThree(formData);

        if (!validationResult.success) {
            return {
                ...profileStepThreeInitialState,
                formError: "Periksa kembali availability dan pengaturan privasi Anda.",
                fieldErrors: getFieldErrors<ProfileStepThreeFieldName>(validationResult.error),
                values,
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

        logServerError({ action: "profile.completeStepThree" }, error);
        return {
            ...profileStepThreeInitialState,
            formError: "Profil belum dapat diselesaikan saat ini.",
            values,
        };
    }
}

export async function updateProfile(
    _previousState: FormActionState<ProfileFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileFieldName>> {
    const values = getProfileValues(formData);

    try {
        const user = await requireUser();
        const validationResult = safeParseUpdateProfile(formData);

        if (!validationResult.success) {
            return {
                ...profileInitialState,
                formError: "Periksa kembali field profil yang belum valid.",
                fieldErrors: getFieldErrors<ProfileFieldName>(validationResult.error),
                values,
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
        logServerError({ action: "profile.updateProfile" }, error);
        return {
            ...profileInitialState,
            formError: "Profil belum dapat diperbarui saat ini.",
            values,
        };
    }
}
