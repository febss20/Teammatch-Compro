"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { sanitizeNextPath } from "@/lib/auth";
import { logServerError } from "@/lib/security/server-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getRequestOrigin(): string {
    const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (configuredBaseUrl && configuredBaseUrl.length > 0) {
        return configuredBaseUrl;
    }

    throw new Error("NEXT_PUBLIC_BASE_URL belum dikonfigurasi.");
}

export async function loginWithGoogleAction(formData: FormData): Promise<void> {
    const nextPath = sanitizeNextPath(typeof formData.get("next") === "string" ? String(formData.get("next")) : "/dashboard");

    try {
        await headers();
        const supabase = await createServerSupabaseClient();
        const redirectTo = `${getRequestOrigin()}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo,
            },
        });

        if (error || !data.url) {
            throw new Error(`OAuth Google gagal: ${error?.message ?? "URL redirect tidak tersedia."}`);
        }

        redirect(data.url);
    } catch (error) {
        if (isRedirectError(error)) {
            throw error;
        }

        logServerError({ action: "auth.oauth.google" }, error);
        redirect("/login?error=oauth_failed");
    }
}
