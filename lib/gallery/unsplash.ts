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

export type GalleryFetchStatus = "empty" | "error" | "missing_config" | "ready";

export interface GalleryPhotosResult {
    photos: GalleryPhoto[];
    status: GalleryFetchStatus;
}

interface UnsplashSearchResponse {
    total: number;
    total_pages: number;
    results: UnsplashPhoto[];
}

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

function mapGalleryPhoto(photo: UnsplashPhoto): GalleryPhoto {
    return {
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.small,
        alt: photo.alt_description || "Competition photo",
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        location: photo.location?.title || null,
        color: photo.color,
    };
}

export async function getGalleryPhotosResult(query: string, perPage: number): Promise<GalleryPhotosResult> {
    if (!UNSPLASH_ACCESS_KEY) {
        return {
            photos: [],
            status: "missing_config",
        };
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
            return {
                photos: [],
                status: "error",
            };
        }

        const data: UnsplashSearchResponse = await res.json();
        const photos = data.results.map(mapGalleryPhoto);

        return {
            photos,
            status: photos.length > 0 ? "ready" : "empty",
        };
    } catch {
        return {
            photos: [],
            status: "error",
        };
    }
}

export async function getGalleryPhotos(
    query: string,
    perPage: number,
    options?: { graceful?: boolean },
): Promise<GalleryPhoto[]> {
    const graceful = options?.graceful === true;

    const result = await getGalleryPhotosResult(query, perPage);

    if (result.status === "ready" || result.status === "empty") {
        return result.photos;
    }

    if (graceful) {
        return [];
    }

    if (result.status === "missing_config") {
        throw new Error("Unsplash API key not configured");
    }

    throw new Error("Failed to fetch gallery photos");
}
