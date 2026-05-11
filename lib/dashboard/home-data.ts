import "server-only";

import { getNotificationFeed } from "@/lib/notifications/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getDashboardSnapshot(userId: string): Promise<{
    boardsCount: number;
    outgoingRequestCount: number;
    incomingApplicationCount: number;
    notifications: Awaited<ReturnType<typeof getNotificationFeed>>["notifications"];
    unreadNotificationsCount: number;
}> {
    const supabase = await createServerSupabaseClient();
    const [
        { count: boardsCount, error: boardsError },
        { count: outgoingRequestCount, error: requestsError },
        { count: incomingApplicationCount, error: applicationsError },
        notificationFeed,
    ] = await Promise.all([
        supabase.from("competition_idea_boards").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("join_requests").select("*", { count: "exact", head: true }).eq("requester_id", userId),
        supabase
            .from("board_applications")
            .select("id, competition_idea_boards!inner(user_id)", { count: "exact", head: true })
            .eq("competition_idea_boards.user_id", userId),
        getNotificationFeed(userId, 5),
    ]);

    if (boardsError) {
        throw new Error(`Gagal memuat jumlah board: ${boardsError.message}`);
    }

    if (requestsError) {
        throw new Error(`Gagal memuat request keluar: ${requestsError.message}`);
    }

    if (applicationsError) {
        throw new Error(`Gagal memuat request masuk: ${applicationsError.message}`);
    }

    return {
        boardsCount: boardsCount ?? 0,
        outgoingRequestCount: outgoingRequestCount ?? 0,
        incomingApplicationCount: incomingApplicationCount ?? 0,
        notifications: notificationFeed.notifications,
        unreadNotificationsCount: notificationFeed.unreadCount,
    };
}
