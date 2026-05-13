import { NextResponse, type NextRequest } from "next/server";
import { isCampusEmail } from "@/lib/auth/email";
import { isOAuthEmailVerified, syncOAuthProfile } from "@/lib/auth/oauth";
import { sanitizeNextPath } from "@/lib/auth";
import { logServerError } from "@/lib/security/server-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectToLogin(request: NextRequest, errorCode: string): NextResponse {
    return NextResponse.redirect(new URL(`/login?error=${errorCode}`, request.url));
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

        if (!user.email || !isCampusEmail(user.email) || !isOAuthEmailVerified(user)) {
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
