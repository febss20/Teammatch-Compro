import { Metadata } from "next";
import Gallery from "@/components/public/Gallery";
import { getGalleryPhotos } from "@/lib/gallery/unsplash";
import { getGallerySearchState } from "@/lib/gallery/api";

export const metadata: Metadata = {
    title: "Galeri Kompetisi | TeamMatch",
    description: "Lihat suasana kompetisi dan kolaborasi mahasiswa di berbagai momen yang terekam.",
};

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
    const resolvedSearchParams = await searchParams;
    const searchState = getGallerySearchState({
        q: resolvedSearchParams.q,
        category: resolvedSearchParams.category,
    });
    const galleryPhotos = await getGalleryPhotos(searchState.effectiveQuery, 9, { graceful: true });

    return (
        <main className="px-4 py-12 md:py-16">
            <div className="page-frame space-y-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                        <div className="section-kicker">Galeri kompetisi</div>
                        <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">MOMEN YANG TERASA HIDUP</h1>
                    </div>
                    <p className="max-w-2xl text-lg leading-8 text-[var(--tm-muted)]">
                        Galeri ini merangkum suasana kompetisi yang ramai, fokus, dan penuh kerja sama. Anda bisa menjelajahinya
                        untuk melihat energi yang ingin dibangun TeamMatch.
                    </p>
                </div>

                <Gallery initialPhotos={galleryPhotos} showSearch={true} />
            </div>
        </main>
    );
}
