"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface RealtimeRefreshSubscription {
    event: "*" | "INSERT" | "UPDATE" | "DELETE";
    filter: string | null;
    table: string;
}

interface DashboardRealtimeRefreshProps {
    scopeKey: string;
    subscriptions: RealtimeRefreshSubscription[];
}

export default function DashboardRealtimeRefresh({ scopeKey, subscriptions }: DashboardRealtimeRefreshProps) {
    const router = useRouter();
    const refreshTimeoutRef = useRef<number | null>(null);
    const serializedSubscriptions = useMemo(() => JSON.stringify(subscriptions), [subscriptions]);

    useEffect(() => {
        const supabase = createBrowserSupabaseClient();
        const resolvedSubscriptions = JSON.parse(serializedSubscriptions) as RealtimeRefreshSubscription[];
        const channels = resolvedSubscriptions.map((subscription, index) =>
            supabase
                .channel(`${scopeKey}-${subscription.table}-${index}`)
                .on(
                    "postgres_changes",
                    {
                        event: subscription.event,
                        schema: "public",
                        table: subscription.table,
                        ...(subscription.filter ? { filter: subscription.filter } : {}),
                    },
                    () => {
                        if (refreshTimeoutRef.current !== null) {
                            window.clearTimeout(refreshTimeoutRef.current);
                        }

                        refreshTimeoutRef.current = window.setTimeout(() => {
                            router.refresh();
                        }, 160);
                    },
                )
                .subscribe(),
        );

        return () => {
            if (refreshTimeoutRef.current !== null) {
                window.clearTimeout(refreshTimeoutRef.current);
            }

            channels.forEach((channel) => {
                void supabase.removeChannel(channel);
            });
        };
    }, [router, scopeKey, serializedSubscriptions]);

    return null;
}
