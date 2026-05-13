import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const dashboardMaintenanceIntervalMs = 30_000;

let dashboardMaintenancePromise: Promise<number> | null = null;
let lastDashboardMaintenanceAt: number | null = null;

function shouldRunDashboardMaintenance(currentTime: number, lastRunAt: number | null): boolean {
    if (lastRunAt === null) {
        return true;
    }

    return currentTime - lastRunAt >= dashboardMaintenanceIntervalMs;
}

async function processDashboardMaintenance(): Promise<number> {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.rpc("run_dashboard_maintenance");

    if (error) {
        throw new Error(`Gagal menjalankan maintenance dashboard: ${error.message}`);
    }

    return data ?? 0;
}

export async function runDashboardMaintenance(): Promise<boolean> {
    const currentTime = Date.now();
    if (!shouldRunDashboardMaintenance(currentTime, lastDashboardMaintenanceAt)) {
        return false;
    }

    if (dashboardMaintenancePromise) {
        await dashboardMaintenancePromise;
        return false;
    }

    dashboardMaintenancePromise = processDashboardMaintenance();

    try {
        const processedCount = await dashboardMaintenancePromise;
        lastDashboardMaintenanceAt = Date.now();
        return processedCount > 0;
    } finally {
        dashboardMaintenancePromise = null;
    }
}
