import "server-only";

export interface UnsplashPhoto {
    id: string;
    urls: { raw: string; full: string; regular: string; small: string; thumb: string };
    alt_description: string | null;
    description: string | null;
    user: { name: string; links: { html: string } };
    likes: number;
    width: number;
    height: number;
    color: string;
    location: { title: string | null } | null;
}

export interface GalleryPhoto {
    id: string;
    url: string;
    thumb: string;
    alt: string;
    photographer: string;
    photographerUrl: string;
    location: string | null;
    color: string;
}

interface UnsplashSearchResponse {
    total: number;
    total_pages: number;
    results: UnsplashPhoto[];
}

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

export async function getGalleryPhotos(
    query: string = "hackathon competition",
    perPage: number = 9,
    options?: { graceful?: boolean },
): Promise<GalleryPhoto[]> {
    const graceful = options?.graceful === true;

    if (!UNSPLASH_ACCESS_KEY) {
        if (graceful) return [];
        throw new Error("Unsplash API key not configured");
    }

    try {
        const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
            {
                headers: {
                    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
                next: { revalidate: 3600 },
            },
        );

        if (!res.ok) {
            throw new Error(`Unsplash API error: ${res.status}`);
        }

        const data: UnsplashSearchResponse = await res.json();

        return data.results.map((photo) => ({
            id: photo.id,
            url: photo.urls.regular,
            thumb: photo.urls.small,
            alt: photo.alt_description || "Competition photo",
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            location: photo.location?.title || null,
            color: photo.color,
        }));
    } catch {
        if (graceful) return [];
        throw new Error("Failed to fetch gallery photos");
    }
}
