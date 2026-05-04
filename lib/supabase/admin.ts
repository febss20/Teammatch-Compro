import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/config";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminSupabaseClient() {
    if (adminClient) {
        return adminClient;
    }

    adminClient = createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return adminClient;
}
