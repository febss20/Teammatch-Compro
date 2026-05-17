import { createHash, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { assertRateLimit, getClientIpFromRequest, RateLimitError } from "@/lib/security/rate-limit";
import { logServerError } from "@/lib/security/server-errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const maintenanceResponseHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
    Vary: "Authorization",
};

const maintenanceRateLimitHeaders = {
    ...maintenanceResponseHeaders,
    "Retry-After": "600",
};

function getExpectedToken(): string {
    const token = process.env.CRON_SECRET;
    if (!token) {
        throw new Error("CRON_SECRET belum dikonfigurasi.");
    }

    return token;
}

function hashSecret(value: string): Buffer {
    return createHash("sha256").update(value).digest();
}

function getAllowedIps(): string[] {
    const configuredIps = process.env.CRON_ALLOWED_IPS;

    if (!configuredIps) {
        return [];
    }

    return configuredIps
        .split(",")
        .map((ipAddress) => ipAddress.trim())
        .filter((ipAddress) => ipAddress.length > 0);
}

function getRequestIpCandidates(request: NextRequest): string[] {
    const forwardedForHeader = request.headers.get("x-forwarded-for");
    const forwardedForAddresses = forwardedForHeader
        ? forwardedForHeader
              .split(",")
              .map((ipAddress) => ipAddress.trim())
              .filter((ipAddress) => ipAddress.length > 0)
        : [];

    const extraAddresses = [request.headers.get("x-real-ip"), request.headers.get("cf-connecting-ip")].filter(
        (ipAddress): ipAddress is string => typeof ipAddress === "string" && ipAddress.length > 0,
    );

    return [...new Set([...forwardedForAddresses, ...extraAddresses])];
}

function isIpAllowed(request: NextRequest): boolean {
    const allowedIps = getAllowedIps();

    if (allowedIps.length === 0) {
        return true;
    }

    const requestIpCandidates = getRequestIpCandidates(request);
    return requestIpCandidates.some((ipAddress) => allowedIps.includes(ipAddress));
}

function isAuthorized(request: NextRequest, expectedToken: string): boolean {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return false;
    }

    const providedToken = authorization.slice("Bearer ".length).trim();

    if (providedToken.length === 0) {
        return false;
    }

    return timingSafeEqual(hashSecret(providedToken), hashSecret(expectedToken));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const clientIp = getClientIpFromRequest(request);

    try {
        const expectedToken = getExpectedToken();
        if (!isAuthorized(request, expectedToken)) {
            return NextResponse.json({ error: "Unauthorized." }, { headers: maintenanceResponseHeaders, status: 401 });
        }

        if (!isIpAllowed(request)) {
            return NextResponse.json({ error: "Forbidden." }, { headers: maintenanceResponseHeaders, status: 403 });
        }

        await assertRateLimit({
            limitCount: 10,
            scope: "internal_dashboard_maintenance",
            subject: `ip:${clientIp}`,
            windowSeconds: 600,
        });

        const supabase = createAdminSupabaseClient();
        const { data, error } = await supabase.rpc("run_dashboard_maintenance");

        if (error) {
            throw new Error(`Dashboard maintenance gagal: ${error.message}`);
        }

        return NextResponse.json({ processedCount: data ?? 0 }, { headers: maintenanceResponseHeaders });
    } catch (error) {
        if (error instanceof RateLimitError) {
            return NextResponse.json({ error: error.message }, { headers: maintenanceRateLimitHeaders, status: 429 });
        }

        logServerError({ action: "api.internal.dashboardMaintenance", metadata: { clientIp } }, error);
        return NextResponse.json(
            { error: "Maintenance belum dapat diproses." },
            { headers: maintenanceResponseHeaders, status: 500 },
        );
    }
}
