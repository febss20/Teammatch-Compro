"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { sanitizeNextPath } from "@/lib/auth";
import { getProfileRecord } from "@/lib/dashboard/data";
import { loginInitialState } from "@/lib/forms";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FormActionState, LoginFieldName } from "@/lib/types";
import { loginSchema } from "@/lib/auth/validation";

export async function loginAction(
    _previousState: FormActionState<LoginFieldName>,
    formData: FormData,
): Promise<FormActionState<LoginFieldName>> {
    try {
        const validationResult = loginSchema.safeParse({
            email: formData.get("email"),
            password: formData.get("password"),
            next: formData.get("next") ?? "/dashboard",
        });

        if (!validationResult.success) {
            return {
                ...loginInitialState,
                formError: "Periksa kembali email dan password Anda.",
                fieldErrors: getFieldErrors<LoginFieldName>(validationResult.error),
            };
        }

        const parsedData = validationResult.data;

        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({
            email: parsedData.email,
            password: parsedData.password,
        });

        if (error) {
            throw new Error(`Login gagal: ${error.message}`);
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const profile = user ? await getProfileRecord(user.id, user.email) : null;
        redirect(profile?.profileCompletedAt ? sanitizeNextPath(parsedData.next) : "/dashboard/profile/setup");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        return {
            ...loginInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat login.",
        };
    }
}
