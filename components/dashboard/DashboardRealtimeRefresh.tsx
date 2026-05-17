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

const dashboardRefreshDebounceMs = 450;
const dashboardRefreshCooldownMs = 2_000;

export default function DashboardRealtimeRefresh({ scopeKey, subscriptions }: DashboardRealtimeRefreshProps) {
    const router = useRouter();
    const refreshTimeoutRef = useRef<number | null>(null);
    const lastRefreshAtRef = useRef<number>(0);
    const pendingRefreshRef = useRef<boolean>(false);
    const serializedSubscriptions = useMemo(() => JSON.stringify(subscriptions), [subscriptions]);

    useEffect(() => {
        const supabase = createBrowserSupabaseClient();
        const resolvedSubscriptions = JSON.parse(serializedSubscriptions) as RealtimeRefreshSubscription[];

        const clearRefreshTimeout = () => {
            if (refreshTimeoutRef.current !== null) {
                window.clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
        };

        const flushRefresh = () => {
            if (!pendingRefreshRef.current || document.visibilityState !== "visible") {
                return;
            }

            const now = Date.now();
            const remainingCooldown = dashboardRefreshCooldownMs - (now - lastRefreshAtRef.current);

            if (remainingCooldown > 0) {
                clearRefreshTimeout();
                refreshTimeoutRef.current = window.setTimeout(flushRefresh, remainingCooldown);
                return;
            }

            pendingRefreshRef.current = false;
            lastRefreshAtRef.current = now;
            clearRefreshTimeout();
            router.refresh();
        };

        const scheduleRefresh = () => {
            pendingRefreshRef.current = true;
            clearRefreshTimeout();
            refreshTimeoutRef.current = window.setTimeout(flushRefresh, dashboardRefreshDebounceMs);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && pendingRefreshRef.current) {
                scheduleRefresh();
            }
        };

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
                    scheduleRefresh,
                )
                .subscribe(),
        );

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleVisibilityChange);

        return () => {
            clearRefreshTimeout();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleVisibilityChange);

            channels.forEach((channel) => {
                void supabase.removeChannel(channel);
            });
        };
    }, [router, scopeKey, serializedSubscriptions]);

    return null;
}
