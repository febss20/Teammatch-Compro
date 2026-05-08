import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NotificationRecord } from "@/lib/types";

export interface NotificationFeed {
    notifications: NotificationRecord[];
    unreadCount: number;
}

function mapNotificationRecord(row: {
    id: string;
    category: string;
    title: string;
    body: string;
    link_path: string | null;
    is_read: boolean;
    created_at: string;
}): NotificationRecord {
    return {
        id: row.id,
        category: row.category as NotificationRecord["category"],
        title: row.title,
        body: row.body,
        linkPath: row.link_path,
        isRead: row.is_read,
        createdAt: row.created_at,
    };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
    const supabase = await createServerSupabaseClient();
    const { count, error } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

    if (error) {
        throw new Error(`Gagal memuat jumlah notifikasi belum dibaca: ${error.message}`);
    }

    return count ?? 0;
}

export async function getNotificationFeed(userId: string, limit: number): Promise<NotificationFeed> {
    const supabase = await createServerSupabaseClient();
    const [{ data, error }, unreadCount] = await Promise.all([
        supabase
            .from("user_notifications")
            .select("id, category, title, body, link_path, is_read, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit),
        getUnreadNotificationCount(userId),
    ]);

    if (error) {
        throw new Error(`Gagal memuat feed notifikasi: ${error.message}`);
    }

    return {
        notifications: (data ?? []).map(mapNotificationRecord),
        unreadCount,
    };
}
