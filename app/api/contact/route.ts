import { NextResponse } from "next/server";

interface ContactPayload {
    name: string;
    email: string;
    message: string;
}

export async function POST(request: Request) {
    try {
        const body: ContactPayload = await request.json();

        if (!body.name || !body.email || !body.message) {
            return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
        }

        if (!body.email.includes("@")) {
            return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
        }

        console.log("New contact message:", {
            name: body.name,
            email: body.email,
            message: body.message,
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
