import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
    createNotificationPayload,
    notificationPreferenceFieldMap,
    type NotificationEvent,
} from "@/lib/notifications/contracts";

type NotificationSupabaseClient = {
    from: ReturnType<typeof createAdminSupabaseClient>["from"];
};

async function shouldDeliverNotification(
    client: NotificationSupabaseClient,
    userId: string,
    category: ReturnType<typeof createNotificationPayload>["category"],
): Promise<boolean> {
    if (category === "system") {
        return true;
    }

    const preferenceField = notificationPreferenceFieldMap[category];
    const { data, error } = await client
        .from("notification_preferences")
        .select(preferenceField)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw new Error(`Gagal memuat preferensi notifikasi untuk ${userId}: ${error.message}`);
    }

    const resolvedData = data as Record<string, boolean | undefined> | null;
    if (!resolvedData) {
        return true;
    }

    return resolvedData[preferenceField] !== false;
}

async function insertNotificationFromEvent(client: NotificationSupabaseClient, event: NotificationEvent): Promise<void> {
    const payload = createNotificationPayload(event);
    const shouldDeliver = await shouldDeliverNotification(client, payload.userId, payload.category);

    if (!shouldDeliver) {
        return;
    }

    const { error } = await client.from("user_notifications").insert({
        user_id: payload.userId,
        category: payload.category,
        title: payload.title,
        body: payload.body,
        link_path: payload.linkPath,
    });

    if (error) {
        throw new Error(`Gagal menyimpan notifikasi ${event.type} untuk ${payload.userId}: ${error.message}`);
    }
}

function createNotificationLogContext(event: NotificationEvent): {
    category: ReturnType<typeof createNotificationPayload>["category"];
    eventType: NotificationEvent["type"];
    userId: string;
} {
    const payload = createNotificationPayload(event);
    return {
        category: payload.category,
        eventType: event.type,
        userId: payload.userId,
    };
}

function warnNotificationFailure(error: unknown, event: NotificationEvent, channel: "server" | "admin"): void {
    console.warn("Dashboard notification delivery failed", {
        channel,
        ...createNotificationLogContext(event),
        error: error instanceof Error ? error.message : String(error),
    });
}

export async function ensureNotificationPreferences(userId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("notification_preferences").upsert({
        user_id: userId,
        updated_at: new Date().toISOString(),
    });

    if (error) {
        throw new Error(`Gagal memastikan preferensi notifikasi untuk ${userId}: ${error.message}`);
    }
}

export async function sendServerNotification(event: NotificationEvent): Promise<void> {
    try {
        const supabase = createAdminSupabaseClient();
        await insertNotificationFromEvent(supabase, event);
    } catch (error) {
        warnNotificationFailure(error, event, "server");
    }
}

export async function sendAdminNotification(event: NotificationEvent): Promise<void> {
    const supabase = createAdminSupabaseClient();
    await insertNotificationFromEvent(supabase, event);
}

export async function sendAdminNotificationSafely(event: NotificationEvent): Promise<void> {
    try {
        await sendAdminNotification(event);
    } catch (error) {
        warnNotificationFailure(error, event, "admin");
    }
}

export async function updateNotificationPreferences(
    userId: string,
    values: Database["public"]["Tables"]["notification_preferences"]["Update"],
): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("notification_preferences").upsert({
        user_id: userId,
        ...values,
        updated_at: new Date().toISOString(),
    });

    if (error) {
        throw new Error(`Gagal memperbarui preferensi notifikasi untuk ${userId}: ${error.message}`);
    }
}

export async function markNotificationReadForUser(userId: string, notificationId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
        .from("user_notifications")
        .update({
            is_read: true,
        })
        .eq("id", notificationId)
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Gagal menandai notifikasi ${notificationId} sebagai dibaca: ${error.message}`);
    }
}
