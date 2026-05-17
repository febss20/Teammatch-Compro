import { NextResponse, type NextRequest } from "next/server";
import { isCampusEmail } from "@/lib/auth/email";
import { isOAuthEmailVerified, syncOAuthProfile } from "@/lib/auth/oauth";
import { sanitizeNextPath } from "@/lib/auth";
import { logServerError } from "@/lib/security/server-errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectToLogin(request: NextRequest, errorCode: string): NextResponse {
    return NextResponse.redirect(new URL(`/login?error=${errorCode}`, request.url));
}

async function signOutAndDeleteRejectedOAuthUser(
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
    userId: string,
    email: string | null | undefined,
): Promise<void> {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
        logServerError({ action: "auth.oauth.rejectNonCampus.signOut", userId }, signOutError);
    }

    const adminSupabase = createAdminSupabaseClient();
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteError) {
        logServerError(
            {
                action: "auth.oauth.rejectNonCampus.deleteUser",
                metadata: { emailDomain: email?.split("@").at(-1)?.toLowerCase() ?? null },
                userId,
            },
            deleteError,
        );
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

    if (!code) {
        return redirectToLogin(request, "oauth_failed");
    }

    try {
        const supabase = await createServerSupabaseClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            throw new Error(`OAuth callback exchange gagal: ${exchangeError.message}`);
        }

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error(`OAuth user tidak tersedia: ${userError?.message ?? "empty user"}`);
        }

        if (!user.email || !isCampusEmail(user.email)) {
            await signOutAndDeleteRejectedOAuthUser(supabase, user.id, user.email);
            return redirectToLogin(request, "campus_email_required");
        }

        if (!isOAuthEmailVerified(user)) {
            await supabase.auth.signOut();
            return redirectToLogin(request, "campus_email_required");
        }

        await syncOAuthProfile(user);
        return NextResponse.redirect(new URL(nextPath, request.url));
    } catch (error) {
        logServerError({ action: "auth.oauth.callback" }, error);
        return redirectToLogin(request, "oauth_failed");
    }
}
