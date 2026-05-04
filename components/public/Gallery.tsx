"use client";

import { useState } from "react";
import Image from "next/image";
import { type GalleryPhoto, fetchGalleryPhotos } from "@/lib/gallery/api";

const categories = ["All", "Hackathon", "Teamwork", "Coding", "Design", "Startup"];

export default function Gallery({
    initialPhotos,
    showSearch = false,
}: {
    initialPhotos: GalleryPhoto[];
    showSearch?: boolean;
}) {
    const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos);
    const [activeCategory, setActiveCategory] = useState("All");
    const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim() && activeCategory === "All") {
            setPhotos(initialPhotos);
            return;
        }

        setIsLoading(true);
        const queryTerm = searchQuery.trim() ? searchQuery : activeCategory !== "All" ? activeCategory : "competition";
        try {
            const photosData = await fetchGalleryPhotos(queryTerm, 9);
            setPhotos(photosData);
        } catch {
            // silently handled
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategoryChange = async (category: string) => {
        setActiveCategory(category);
        if (category === "All") {
            setPhotos(initialPhotos);
            return;
        }
        setIsLoading(true);
        try {
            const photosData = await fetchGalleryPhotos(category.toLowerCase(), 9);
            setPhotos(photosData);
        } catch {
            // silently handled
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="relative space-y-6">
            <div className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
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
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari foto kompetisi"
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
                {isLoading
                    ? Array.from({ length: 9 }).map((_, i) => (
                          <div
                              key={`skeleton-${i}`}
                              className="brutal-panel aspect-[4/3] animate-poster bg-[var(--tm-paper-muted)]"
                          />
                      ))
                    : photos.map((photo, i) => (
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
                                      {photo.location || "Competition Moment"}
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
                                    Photo by{" "}
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
                            <div className="section-kicker">Gallery Focus</div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
