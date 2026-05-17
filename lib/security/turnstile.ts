import "server-only";

interface TurnstileVerificationInput {
    remoteIp: string;
    token: string | null;
}

interface TurnstileResponse {
    success: boolean;
    "error-codes"?: string[];
}

export class TurnstileValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TurnstileValidationError";
    }
}

function getTurnstileSecret(): string | null {
    const value = process.env.TURNSTILE_SECRET_KEY;
    if (value && value.length > 0) {
        return value;
    }

    if (process.env.NODE_ENV === "development") {
        return null;
    }

    throw new Error("TURNSTILE_SECRET_KEY belum dikonfigurasi.");
}

async function postTurnstileVerification(body: URLSearchParams): Promise<TurnstileResponse> {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        body,
        method: "POST",
    });

    if (!response.ok) {
        throw new Error(`Verifikasi Turnstile gagal dengan status ${response.status}.`);
    }

    return (await response.json()) as TurnstileResponse;
}

export async function verifyTurnstileToken(input: TurnstileVerificationInput): Promise<void> {
    const secret = getTurnstileSecret();
    if (!secret) {
        return;
    }

    if (!input.token || input.token.length === 0) {
        throw new TurnstileValidationError("Verifikasi keamanan gagal.");
    }

    const body = new URLSearchParams({
        remoteip: input.remoteIp,
        response: input.token,
        secret,
    });

    let lastError: unknown = null;
    for (const attempt of [1, 2]) {
        try {
            const result = await postTurnstileVerification(body);
            if (!result.success) {
                throw new TurnstileValidationError(`Token Turnstile tidak valid: ${(result["error-codes"] ?? []).join(",")}`);
            }
            return;
        } catch (error) {
            lastError = error;
            console.warn("Turnstile verification attempt failed", {
                attempt,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    throw lastError instanceof Error ? lastError : new Error("Verifikasi keamanan gagal.");
}
