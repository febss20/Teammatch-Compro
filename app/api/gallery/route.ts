import { NextResponse } from "next/server";
import { getGalleryPhotos } from "@/lib/gallery/unsplash";
import { assertRateLimit, getClientIpFromRequest, RateLimitError } from "@/lib/security/rate-limit";
import { logServerError } from "@/lib/security/server-errors";

function clampGalleryPerPage(value: string | null): number {
    const parsedValue = Number.parseInt(value ?? "9", 10);
    if (!Number.isFinite(parsedValue)) {
        return 9;
    }

    return Math.min(12, Math.max(1, parsedValue));
}

function normalizeGalleryQuery(value: string | null): string {
    const query = (value ?? "competition").trim().replace(/\s+/g, " ");
    return query.length > 80 ? query.slice(0, 80) : query;
}

export async function GET(request: Request) {
    const clientIp = getClientIpFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = normalizeGalleryQuery(searchParams.get("query"));
    const perPage = clampGalleryPerPage(searchParams.get("per_page"));

    try {
        await assertRateLimit({
            limitCount: 30,
            scope: "gallery",
            subject: `ip:${clientIp}`,
            windowSeconds: 600,
        });

        const photos = await getGalleryPhotos(query, perPage);
        return NextResponse.json({ photos, total: photos.length });
    } catch (error) {
        if (error instanceof RateLimitError) {
            return NextResponse.json({ error: error.message }, { status: 429 });
        }

        logServerError({ action: "gallery.fetch", metadata: { clientIp, perPage, query } }, error);
        return NextResponse.json({ error: "Galeri belum bisa dimuat saat ini." }, { status: 500 });
    }
}
