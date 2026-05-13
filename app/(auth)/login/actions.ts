"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { extractEmailDomain } from "@/lib/auth/email";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { sanitizeNextPath } from "@/lib/auth";
import { getProfileRecord } from "@/lib/dashboard/data";
import { loginInitialState } from "@/lib/forms";
import { assertRateLimit, getClientIpFromHeaders, RateLimitError } from "@/lib/security/rate-limit";
import { logServerError } from "@/lib/security/server-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FormActionState, LoginFieldName } from "@/lib/types";
import { loginSchema } from "@/lib/auth/validation";

export async function loginAction(
    _previousState: FormActionState<LoginFieldName>,
    formData: FormData,
): Promise<FormActionState<LoginFieldName>> {
    const values = {
        email: typeof formData.get("email") === "string" ? String(formData.get("email")).trim().toLowerCase() : "",
        next: typeof formData.get("next") === "string" ? String(formData.get("next")) : "/dashboard",
    };

    try {
        const validationResult = loginSchema.safeParse({
            email: values.email,
            password: formData.get("password"),
            next: values.next,
        });

        if (!validationResult.success) {
            return {
                ...loginInitialState,
                formError: "Periksa kembali email dan password Anda.",
                fieldErrors: getFieldErrors<LoginFieldName>(validationResult.error),
                values,
            };
        }

        const parsedData = validationResult.data;
        const clientIp = await getClientIpFromHeaders();

        await assertRateLimit({
            limitCount: 10,
            scope: "auth.login",
            subject: `ip:${clientIp}:email:${parsedData.email}`,
            windowSeconds: 600,
        });

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

        if (user?.email) {
            const { error: profileEmailError } = await supabase
                .from("profiles")
                .update({
                    email_domain: extractEmailDomain(user.email),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

            if (profileEmailError) {
                throw new Error(`Gagal menyimpan domain email profil: ${profileEmailError.message}`);
            }
        }

        const profile = user ? await getProfileRecord(user.id, user.email) : null;
        redirect(profile?.profileCompletedAt ? sanitizeNextPath(parsedData.next) : "/dashboard/profile/setup");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        if (error instanceof RateLimitError) {
            return {
                ...loginInitialState,
                formError: error.message,
                values,
            };
        }

        logServerError({ action: "auth.login" }, error);
        return {
            ...loginInitialState,
            formError: "Email atau password belum dapat diproses. Periksa kembali data Anda.",
            values,
        };
    }
}
