import Gallery from "@/components/Gallery";
import { getGalleryPhotos } from "@/lib/unsplash";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gallery Kompetisi | TeamMatch",
    description: "Jelajahi berbagai keseruan saat kompetisi bersama TeamMatch.",
};

export default async function GalleryPage() {
    const galleryPhotos = await getGalleryPhotos("hackathon competition teamwork", 9, { graceful: true });

    return (
        <main className="py-20 px-20">
            <Gallery initialPhotos={galleryPhotos} showSearch={true} />
        </main>
    );
}
