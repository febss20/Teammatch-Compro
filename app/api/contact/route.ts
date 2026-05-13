import { NextResponse } from "next/server";
import { assertRateLimit, getClientIpFromRequest, RateLimitError } from "@/lib/security/rate-limit";
import { logServerError } from "@/lib/security/server-errors";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { contactPayloadSchema } from "@/lib/shared/contact-validation";

interface ContactRequestBody {
    email?: unknown;
    message?: unknown;
    name?: unknown;
    turnstileToken?: unknown;
}

export async function POST(request: Request) {
    const clientIp = getClientIpFromRequest(request);
    try {
        await assertRateLimit({
            limitCount: 5,
            scope: "contact",
            subject: `ip:${clientIp}`,
            windowSeconds: 600,
        });

        const body = (await request.json()) as ContactRequestBody;
        const validationResult = contactPayloadSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Periksa kembali field yang masih belum valid.",
                    fieldErrors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        await verifyTurnstileToken({
            remoteIp: clientIp,
            token: typeof body.turnstileToken === "string" ? body.turnstileToken : null,
        });

        console.log("New contact message", {
            name: validationResult.data.name,
            email: validationResult.data.email,
            message: validationResult.data.message,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: "Pesan berhasil diterima.",
        });
    } catch (error) {
        if (error instanceof RateLimitError) {
            return NextResponse.json({ error: error.message }, { status: 429 });
        }

        logServerError({ action: "contact.submit", metadata: { clientIp } }, error);
        return NextResponse.json({ error: "Pesan belum bisa diproses saat ini." }, { status: 400 });
    }
}
