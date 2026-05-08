import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function insertTeamActivityEvent(
    teamId: string,
    actorId: string | null,
    eventType: string,
    payload: Record<string, unknown>,
): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("team_activity_events").insert({
        team_id: teamId,
        actor_id: actorId,
        event_type: eventType,
        payload: payload as Json,
    });

    if (error) {
        throw new Error(`Gagal mencatat aktivitas tim: ${error.message}`);
    }
}
