import { NextResponse } from "next/server";
import { getGalleryPhotos } from "@/lib/unsplash";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "competition";
    const perPage = parseInt(searchParams.get("per_page") || "9");

    try {
        const photos = await getGalleryPhotos(query, perPage);
        return NextResponse.json({ photos, total: photos.length });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch photos";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
