export const galleryCategories = ["All", "Hackathon", "Teamwork", "Coding", "Design", "Startup"] as const;

export const defaultGalleryQuery = "hackathon competition teamwork";

export type GalleryCategory = (typeof galleryCategories)[number];

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

export interface GallerySearchState {
    q: string;
    category: GalleryCategory;
    effectiveQuery: string;
    hasFilters: boolean;
}

interface GalleryApiResponse {
    photos: GalleryPhoto[];
}

export function normalizeGalleryCategory(categoryValue: string | null | undefined): GalleryCategory {
    const matchedCategory = galleryCategories.find((category) => category.toLowerCase() === categoryValue?.toLowerCase());

    return matchedCategory ?? "All";
}

export function getGallerySearchState(input: {
    q?: string | null | undefined;
    category?: string | null | undefined;
}): GallerySearchState {
    const q = typeof input.q === "string" ? input.q.trim() : "";
    const category = normalizeGalleryCategory(input.category);
    const effectiveQuery = q.length > 0 ? q : category !== "All" ? category.toLowerCase() : defaultGalleryQuery;

    return {
        q,
        category,
        effectiveQuery,
        hasFilters: q.length > 0 || category !== "All",
    };
}

export async function fetchGalleryPhotos(query: string, perPage: number): Promise<GalleryPhoto[]> {
    const res = await fetch(`/api/gallery?query=${encodeURIComponent(query)}&per_page=${perPage}`);

    if (!res.ok) {
        throw new Error("Failed to fetch gallery");
    }

    const data = (await res.json()) as GalleryApiResponse;
    return data.photos;
}
