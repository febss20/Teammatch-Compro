import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function insertPrivacyAuditEvent(
    userId: string,
    eventType: string,
    payload: Record<string, unknown>,
): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("privacy_audit_events").insert({
        user_id: userId,
        event_type: eventType,
        payload: payload as Json,
    });

    if (error) {
        throw new Error(`Gagal menyimpan audit privasi: ${error.message}`);
    }
}
