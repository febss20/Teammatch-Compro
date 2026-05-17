import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { logServerWarning } from "@/lib/security/server-errors";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

export async function createServerSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch (error) {
                    logServerWarning(
                        {
                            action: "supabase.cookies.setAll",
                            metadata: { cookieCount: cookiesToSet.length },
                        },
                        error,
                    );
                }
            },
        },
    });
}
