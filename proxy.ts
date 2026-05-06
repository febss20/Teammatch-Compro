import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet, headers) {
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) => {
                    supabaseResponse.cookies.set(name, value, options);
                });
                Object.entries(headers).forEach(([key, value]) => {
                    supabaseResponse.headers.set(key, value);
                });
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
