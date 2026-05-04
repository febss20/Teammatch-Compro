import Gallery from "@/components/public/Gallery";
import { getGalleryPhotos } from "@/lib/gallery/unsplash";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gallery Kompetisi | TeamMatch",
    description: "Jelajahi berbagai keseruan saat kompetisi bersama TeamMatch.",
};

export default async function GalleryPage() {
    const galleryPhotos = await getGalleryPhotos("hackathon competition teamwork", 9, { graceful: true });

    return (
        <main className="px-4 py-12 md:py-16">
            <div className="page-frame space-y-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                        <div className="section-kicker">Competition Gallery</div>
                        <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">MOMEN YANG TERASA HIDUP</h1>
                    </div>
                    <p className="max-w-2xl text-lg leading-8 text-[var(--tm-muted)]">
                        Galeri ini tidak tampil sebagai feed netral. Ia harus terasa seperti papan dokumentasi suasana kompetisi:
                        padat, energik, dan tetap terkurasi.
                    </p>
                </div>

                <Gallery initialPhotos={galleryPhotos} showSearch={true} />
            </div>
        </main>
    );
}
