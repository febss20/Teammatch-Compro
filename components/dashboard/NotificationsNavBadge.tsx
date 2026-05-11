"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface NotificationsNavBadgeProps {
    initialUnreadCount: number;
    userId: string;
}

interface NotificationRealtimePayload {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: {
        is_read?: boolean | null;
        user_id?: string | null;
    };
    old: {
        is_read?: boolean | null;
        user_id?: string | null;
    };
}

function clampUnreadCount(value: number): number {
    return value < 0 ? 0 : value;
}

export default function NotificationsNavBadge({ initialUnreadCount, userId }: NotificationsNavBadgeProps) {
    const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
    const channelInstanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const channelName = useMemo(() => `nav-notifications-${userId}-${channelInstanceId}`, [channelInstanceId, userId]);

    useEffect(() => {
        const supabase = createBrowserSupabaseClient();
        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "user_notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const eventPayload = payload as unknown as NotificationRealtimePayload;
                    if (eventPayload.eventType === "INSERT" && eventPayload.new.is_read === false) {
                        setUnreadCount((current) => current + 1);
                        return;
                    }

                    if (eventPayload.eventType === "UPDATE") {
                        if (eventPayload.old.is_read === false && eventPayload.new.is_read === true) {
                            setUnreadCount((current) => clampUnreadCount(current - 1));
                            return;
                        }

                        if (eventPayload.old.is_read === true && eventPayload.new.is_read === false) {
                            setUnreadCount((current) => current + 1);
                        }
                    }
                },
            )
            .subscribe();

        return () => {
            void channel.unsubscribe().finally(() => supabase.removeChannel(channel));
        };
    }, [channelName, userId]);

    if (unreadCount <= 0) {
        return null;
    }

    return <span className="brutal-chip bg-[var(--tm-accent)] text-[var(--tm-line)]">{unreadCount}</span>;
}
