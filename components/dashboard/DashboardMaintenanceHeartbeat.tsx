"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { triggerDashboardMaintenance } from "@/app/(dashboard)/dashboard/actions";

const dashboardHeartbeatIntervalMs = 60_000;

export default function DashboardMaintenanceHeartbeat() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        const runHeartbeat = () => {
            startTransition(async () => {
                const result = await triggerDashboardMaintenance();
                if (!cancelled && result.updated) {
                    router.refresh();
                }
            });
        };

        runHeartbeat();

        const intervalId = window.setInterval(() => {
            runHeartbeat();
        }, dashboardHeartbeatIntervalMs);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [router]);

    return null;
}
