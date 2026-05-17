import "server-only";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RateLimitError";
    }
}

interface SupabaseRpcErrorLike {
    code: string | null;
    details: string | null;
    hint: string | null;
    message: string;
}

function getSupabaseRpcErrorLike(error: unknown): SupabaseRpcErrorLike | null {
    if (!error || typeof error !== "object") {
        return null;
    }

    const message = "message" in error && typeof error.message === "string" ? error.message : null;
    if (!message) {
        return null;
    }

    return {
        code: "code" in error && typeof error.code === "string" ? error.code : null,
        details: "details" in error && typeof error.details === "string" ? error.details : null,
        hint: "hint" in error && typeof error.hint === "string" ? error.hint : null,
        message,
    };
}

interface RateLimitInput {
    limitCount: number;
    scope: string;
    subject: string;
    windowSeconds: number;
}

function getRateLimitSecret(): string {
    const value = process.env.RATE_LIMIT_SECRET;

    if (value && value.length > 0) {
        return value;
    }

    if (process.env.NODE_ENV === "development") {
        return "development-rate-limit-secret";
    }

    throw new Error("RATE_LIMIT_SECRET belum dikonfigurasi.");
}

function hashRateLimitSubject(subject: string): string {
    return createHash("sha256").update(getRateLimitSecret()).update(":").update(subject).digest("hex");
}

function getFirstForwardedIp(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const firstValue = value.split(",")[0]?.trim();
    return firstValue && firstValue.length > 0 ? firstValue : null;
}

export function getClientIpFromRequest(request: Request): string {
    return (
        getFirstForwardedIp(request.headers.get("x-forwarded-for")) ??
        request.headers.get("x-real-ip") ??
        request.headers.get("cf-connecting-ip") ??
        "unknown"
    );
}

export async function getClientIpFromHeaders(): Promise<string> {
    const headerStore = await headers();
    return (
        getFirstForwardedIp(headerStore.get("x-forwarded-for")) ??
        headerStore.get("x-real-ip") ??
        headerStore.get("cf-connecting-ip") ??
        "unknown"
    );
}

export async function assertRateLimit(input: RateLimitInput): Promise<void> {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.rpc("consume_rate_limit", {
        p_limit_count: input.limitCount,
        p_scope: input.scope,
        p_subject_hash: hashRateLimitSubject(input.subject),
        p_window_seconds: input.windowSeconds,
    });

    if (error) {
        throw new RateLimitError("Terlalu banyak percobaan. Coba lagi nanti.");
    }
}

export function mapSupabaseRateLimitError(error: SupabaseRpcErrorLike): RateLimitError | null {
    const searchableText = [error.message, error.details, error.hint]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" ")
        .toLowerCase();

    if (!searchableText.includes("rate limit exceeded")) {
        return null;
    }

    return new RateLimitError("Terlalu banyak percobaan. Coba lagi nanti.");
}

export function throwIfRateLimited(error: unknown): void {
    const rpcError = getSupabaseRpcErrorLike(error);
    if (!rpcError) {
        return;
    }

    const rateLimitError = mapSupabaseRateLimitError(rpcError);
    if (rateLimitError) {
        throw rateLimitError;
    }
}
