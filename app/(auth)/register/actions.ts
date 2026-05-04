"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ZodError } from "zod";
import { getFieldErrors } from "@/lib/action-utils";
import { registerInitialState } from "@/lib/forms";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FormActionState, RegisterFieldName } from "@/lib/types";
import { registerSchema } from "@/lib/validation/auth";

export async function registerAction(
    _previousState: FormActionState<RegisterFieldName>,
    formData: FormData,
): Promise<FormActionState<RegisterFieldName>> {
    try {
        const parsedData = registerSchema.parse({
            email: formData.get("email"),
            password: formData.get("password"),
            confirm_password: formData.get("confirm_password"),
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
            };
        }

        redirect("/dashboard");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        if (error instanceof ZodError) {
            return {
                ...registerInitialState,
                formError: "Periksa kembali data registrasi Anda.",
                fieldErrors: getFieldErrors<RegisterFieldName>(error),
            };
        }

        return {
            ...registerInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat register.",
        };
    }
}
