"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { galleryCategories, getGallerySearchState, type GalleryCategory, type GalleryPhoto } from "@/lib/gallery/api";

interface GalleryProps {
    initialPhotos: GalleryPhoto[];
    showSearch?: boolean;
}

function buildGallerySearchParams(q: string, category: GalleryCategory): URLSearchParams {
    const params = new URLSearchParams();
    const normalizedQuery = q.trim();

    if (normalizedQuery.length > 0) {
        params.set("q", normalizedQuery);
    }

    if (category !== "All") {
        params.set("category", category);
    }

    return params;
}

export default function Gallery({ initialPhotos, showSearch = false }: GalleryProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
    const [isPending, startTransition] = useTransition();

    const urlState = getGallerySearchState({
        q: searchParams.get("q"),
        category: searchParams.get("category"),
    });
    const activeCategory = urlState.category;

    const replaceGalleryUrl = (queryValue: string, category: GalleryCategory) => {
        const nextParams = buildGallerySearchParams(queryValue, category);
        const nextUrl = nextParams.toString().length > 0 ? `${pathname}?${nextParams.toString()}` : pathname;

        startTransition(() => {
            router.replace(nextUrl, { scroll: false });
        });
    };

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        replaceGalleryUrl(searchInputRef.current?.value ?? urlState.q, activeCategory);
    };

    const handleCategoryChange = (category: GalleryCategory) => {
        replaceGalleryUrl(searchInputRef.current?.value ?? urlState.q, category);
    };

    return (
        <section className="relative space-y-6">
            <div className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex flex-wrap gap-3">
                    {galleryCategories.map((category) => (
                        <button
                            key={category}
                            onClick={() => handleCategoryChange(category)}
                            className={`display-font rounded-full border-[3px] px-4 py-3 text-lg uppercase ${
                                activeCategory === category
                                    ? "border-[var(--tm-line)] bg-[var(--tm-accent)] text-[var(--tm-line)] shadow-[4px_4px_0_var(--tm-line)]"
                                    : "border-[var(--tm-line)] bg-[var(--tm-paper-strong)] text-[var(--tm-line)]"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {showSearch && (
                    <form onSubmit={handleSearch} className="relative w-full md:w-[22rem]">
                        <input
                            key={`${urlState.q}-${activeCategory}`}
                            ref={searchInputRef}
                            type="text"
                            defaultValue={urlState.q}
                            onChange={(event) => replaceGalleryUrl(event.currentTarget.value, activeCategory)}
                            placeholder="Cari foto suasana lomba"
                            className="brutal-input !pr-14"
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[var(--tm-line)] bg-[var(--tm-accent-2)] shadow-[3px_3px_0_var(--tm-line)]"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </button>
                    </form>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {isPending
                    ? Array.from({ length: 9 }).map((_, i) => (
                          <div
                              key={`skeleton-${i}`}
                              className="brutal-panel aspect-[4/3] animate-poster bg-[var(--tm-paper-muted)]"
                          />
                      ))
                    : initialPhotos.map((photo, i) => (
                          <button
                              key={photo.id}
                              onClick={() => setSelectedPhoto(photo)}
                              className="brutal-panel group relative aspect-[4/3] overflow-hidden bg-[var(--tm-paper-muted)] text-left animate-rise"
                              style={{ animationDelay: `${i * 80}ms` }}
                          >
                              <Image
                                  src={photo.thumb}
                                  alt={photo.alt}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                                  priority={i < 4}
                              />
                              <div className="absolute inset-x-0 bottom-0 border-t-[3px] border-[var(--tm-line)] bg-[rgba(255,249,239,0.92)] p-4">
                                  <p className="display-font text-2xl leading-none text-[var(--tm-line)]">
                                      {photo.location || "Momen kompetisi"}
                                  </p>
                                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--tm-muted)]">
                                      {photo.photographer}
                                  </p>
                              </div>
                          </button>
                      ))}
            </div>

            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(19,19,19,0.92)] p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute right-6 top-6 inline-flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[var(--tm-paper-strong)] bg-[var(--tm-accent)] text-[var(--tm-line)] shadow-[4px_4px_0_#fff9ef]"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div
                        className="w-full max-w-6xl overflow-hidden rounded-[24px] border-[3px] border-[var(--tm-paper-strong)] bg-[var(--tm-paper-strong)] shadow-[10px_10px_0_#fff9ef]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative flex min-h-[28rem] items-center justify-center bg-[var(--tm-line)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={selectedPhoto.url}
                                alt={selectedPhoto.alt}
                                className="max-h-[70vh] max-w-full object-contain"
                            />
                        </div>
                        <div className="grid gap-3 border-t-[3px] border-[var(--tm-line)] p-6 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                                <h3 className="display-font text-4xl leading-none text-[var(--tm-line)]">
                                    {selectedPhoto.location || selectedPhoto.alt}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-[var(--tm-muted)]">
                                    Foto oleh{" "}
                                    <a
                                        href={`${selectedPhoto.photographerUrl}?utm_source=teammatch_compro&utm_medium=referral`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold underline"
                                    >
                                        {selectedPhoto.photographer}
                                    </a>{" "}
                                    on Unsplash
                                </p>
                            </div>
                            <div className="section-kicker">Sorotan</div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
