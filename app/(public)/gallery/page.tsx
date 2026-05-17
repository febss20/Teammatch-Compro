import { Metadata } from "next";
import { Suspense } from "react";
import Gallery from "@/components/public/Gallery";
import { getGalleryPhotosResult } from "@/lib/gallery/unsplash";
import { getGallerySearchState } from "@/lib/gallery/api";

interface GalleryEmptyState {
    body: string;
    title: string;
}

function getGalleryEmptyState(
    status: "empty" | "error" | "missing_config" | "ready",
    hasFilters: boolean,
): GalleryEmptyState | null {
    if (status === "missing_config") {
        return {
            title: "Galeri belum aktif",
            body: "Sumber foto belum dikonfigurasi, jadi galeri publik belum bisa menampilkan gambar saat ini.",
        };
    }

    if (status === "error") {
        return {
            title: "Galeri belum bisa dimuat",
            body: "Terjadi gangguan saat mengambil foto. Muat ulang halaman beberapa saat lagi.",
        };
    }

    if (status === "empty") {
        return hasFilters
            ? {
                  title: "Tidak ada foto yang cocok",
                  body: "Coba ubah kata kunci atau kategori agar hasil pencarian tidak kosong.",
              }
            : {
                  title: "Belum ada foto untuk ditampilkan",
                  body: "Konten galeri masih kosong. Tambahkan sumber foto atau periksa integrasi upstream.",
              };
    }

    return null;
}

function GalleryFallback() {
    return (
        <section className="relative space-y-6" aria-busy="true" aria-live="polite">
            <div className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex flex-wrap gap-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="h-14 w-28 animate-poster rounded-full bg-[var(--tm-paper-muted)]" />
                    ))}
                </div>
                <div className="h-14 w-full animate-poster bg-[var(--tm-paper-muted)] md:w-[22rem]" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} className="brutal-panel aspect-[4/3] animate-poster bg-[var(--tm-paper-muted)]" />
                ))}
            </div>
        </section>
    );
}

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
    const galleryResult = await getGalleryPhotosResult(searchState.effectiveQuery, 9);
    const emptyState = getGalleryEmptyState(galleryResult.status, searchState.hasFilters);

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

                <Suspense fallback={<GalleryFallback />}>
                    <Gallery emptyState={emptyState} initialPhotos={galleryResult.photos} showSearch={true} />
                </Suspense>
            </div>
        </main>
    );
}
