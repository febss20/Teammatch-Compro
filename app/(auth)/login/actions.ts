"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ZodError } from "zod";
import { getFieldErrors } from "@/lib/action-utils";
import { sanitizeNextPath } from "@/lib/auth";
import { loginInitialState } from "@/lib/forms";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FormActionState, LoginFieldName } from "@/lib/types";
import { loginSchema } from "@/lib/validation/auth";

export async function loginAction(
    _previousState: FormActionState<LoginFieldName>,
    formData: FormData,
): Promise<FormActionState<LoginFieldName>> {
    try {
        const parsedData = loginSchema.parse({
            email: formData.get("email"),
            password: formData.get("password"),
            next: formData.get("next") ?? "/dashboard",
        });

        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({
            email: parsedData.email,
            password: parsedData.password,
        });

        if (error) {
            throw new Error(`Login gagal: ${error.message}`);
        }

        redirect(sanitizeNextPath(parsedData.next));
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        if (error instanceof ZodError) {
            return {
                ...loginInitialState,
                formError: "Periksa kembali email dan password Anda.",
                fieldErrors: getFieldErrors<LoginFieldName>(error),
            };
        }

        return {
            ...loginInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat login.",
        };
    }
}
