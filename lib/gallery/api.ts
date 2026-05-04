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

interface GalleryApiResponse {
    photos: GalleryPhoto[];
}

export async function fetchGalleryPhotos(query: string, perPage: number): Promise<GalleryPhoto[]> {
    const res = await fetch(`/api/gallery?query=${encodeURIComponent(query)}&per_page=${perPage}`);
    if (!res.ok) {
        throw new Error("Failed to fetch gallery");
    }

    const data = (await res.json()) as GalleryApiResponse;
    return data.photos;
}
