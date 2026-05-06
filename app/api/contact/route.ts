import { NextResponse } from "next/server";
import { contactPayloadSchema } from "@/lib/shared/contact-validation";

export async function POST(request: Request) {
    try {
        const body = await request.json();
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

        console.log("New contact message:", {
            name: validationResult.data.name,
            email: validationResult.data.email,
            message: validationResult.data.message,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: "Pesan berhasil diterima.",
        });
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
}
