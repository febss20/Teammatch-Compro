import { NextResponse, type NextRequest } from "next/server";

import { logServerError } from "@/lib/security/server-errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function getExpectedToken(): string {
    const token = process.env.CRON_SECRET;
    if (!token) {
        throw new Error("CRON_SECRET belum dikonfigurasi.");
    }

    return token;
}

function isAuthorized(request: NextRequest, expectedToken: string): boolean {
    const authorization = request.headers.get("authorization");
    return authorization === `Bearer ${expectedToken}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const expectedToken = getExpectedToken();
        if (!isAuthorized(request, expectedToken)) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }

        const supabase = createAdminSupabaseClient();
        const { data, error } = await supabase.rpc("run_dashboard_maintenance");

        if (error) {
            throw new Error(`Dashboard maintenance gagal: ${error.message}`);
        }

        return NextResponse.json({ processedCount: data ?? 0 });
    } catch (error) {
        logServerError({ action: "api.internal.dashboardMaintenance" }, error);
        return NextResponse.json({ error: "Maintenance belum dapat diproses." }, { status: 500 });
    }
}
