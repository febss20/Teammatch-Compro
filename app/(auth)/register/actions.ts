"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { extractEmailDomain } from "@/lib/auth/email";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { getProfileRecord } from "@/lib/dashboard/data";
import { registerInitialState } from "@/lib/forms";
import { assertRateLimit, getClientIpFromHeaders, RateLimitError } from "@/lib/security/rate-limit";
import { logServerError } from "@/lib/security/server-errors";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FormActionState, RegisterFieldName } from "@/lib/types";
import { registerSchema } from "@/lib/auth/validation";

export async function registerAction(
    _previousState: FormActionState<RegisterFieldName>,
    formData: FormData,
): Promise<FormActionState<RegisterFieldName>> {
    const values = {
        email: typeof formData.get("email") === "string" ? String(formData.get("email")).trim().toLowerCase() : "",
    };

    try {
        const validationResult = registerSchema.safeParse({
            email: values.email,
            password: formData.get("password"),
            confirm_password: formData.get("confirm_password"),
        });

        if (!validationResult.success) {
            return {
                ...registerInitialState,
                formError: "Periksa kembali data registrasi Anda.",
                fieldErrors: getFieldErrors<RegisterFieldName>(validationResult.error),
                values,
            };
        }

        const parsedData = validationResult.data;
        const clientIp = await getClientIpFromHeaders();

        await assertRateLimit({
            limitCount: 3,
            scope: "auth.register",
            subject: `ip:${clientIp}:email:${parsedData.email}`,
            windowSeconds: 3600,
        });

        const turnstileToken = formData.get("cf-turnstile-response");
        await verifyTurnstileToken({
            remoteIp: clientIp,
            token: typeof turnstileToken === "string" ? turnstileToken : null,
        });

        const supabase = await createServerSupabaseClient();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: parsedData.email,
            password: parsedData.password,
        });

        if (signUpError) {
            throw new Error(`Registrasi gagal: ${signUpError.message}`);
        }

        if (!signUpData.user) {
            throw new Error("Registrasi gagal: user tidak berhasil dibuat.");
        }

        const adminSupabase = createAdminSupabaseClient();
        const { error: profileError } = await adminSupabase.from("profiles").upsert({
            email_domain: extractEmailDomain(parsedData.email),
            id: signUpData.user.id,
            updated_at: new Date().toISOString(),
        });

        if (profileError) {
            throw new Error(`Registrasi gagal saat menyiapkan profil: ${profileError.message}`);
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: parsedData.email,
            password: parsedData.password,
        });

        if (signInError) {
            return {
                ...registerInitialState,
                success: true,
                message: "Akun berhasil dibuat. Silakan cek email Anda atau login manual bila sesi belum aktif.",
                formError: null,
                values,
            };
        }

        const profile = await getProfileRecord(signUpData.user.id, signUpData.user.email);
        redirect(profile?.profileCompletedAt ? "/dashboard" : "/dashboard/profile/setup");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        if (error instanceof RateLimitError) {
            return {
                ...registerInitialState,
                formError: error.message,
                values,
            };
        }

        logServerError({ action: "auth.register" }, error);
        return {
            ...registerInitialState,
            formError: "Registrasi belum dapat diproses saat ini.",
            values,
        };
    }
}
