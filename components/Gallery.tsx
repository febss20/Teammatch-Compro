"use client";

import { useState } from "react";
import Image from "next/image";
import { type GalleryPhoto, fetchGalleryPhotos } from "@/lib/api";

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
        <section className="relative">
            {/* Filter Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => handleCategoryChange(category)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                                activeCategory === category
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                {showSearch && (
                    <form onSubmit={handleSearch} className="w-full md:w-auto relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari foto kompetisi..."
                            className="w-full md:w-72 px-5 py-2.5 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary pr-12 text-sm transition-all"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </button>
                    </form>
                )}
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading
                    ? Array.from({ length: 9 }).map((_, i) => (
                          <div key={`skeleton-${i}`} className="aspect-[4/3] bg-gray-200 animate-pulse rounded-2xl" />
                      ))
                    : photos.map((photo, i) => (
                          <div
                              key={photo.id}
                              onClick={() => setSelectedPhoto(photo)}
                              className="relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group shadow-sm hover:shadow-lg transition-shadow"
                              style={{ backgroundColor: photo.color || "#e5e5e5" }}
                          >
                              <Image
                                  src={photo.thumb}
                                  alt={photo.alt}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  priority={i < 4}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                                  <div className="text-white">
                                      <p className="font-semibold">{photo.location || "Competition"}</p>
                                      <p className="text-sm text-white/70">📸 {photo.photographer}</p>
                                  </div>
                              </div>
                          </div>
                      ))}
            </div>

            {/* Lightbox Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div
                        className="relative max-w-5xl w-full max-h-[80vh] bg-gray-900 rounded-lg overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={selectedPhoto.url}
                                alt={selectedPhoto.alt}
                                className="max-w-full max-h-[70vh] object-contain"
                            />
                        </div>
                        <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold mb-1">{selectedPhoto.location || selectedPhoto.alt}</h3>
                                <p className="text-gray-400">
                                    Photo by{" "}
                                    <a
                                        href={`${selectedPhoto.photographerUrl}?utm_source=teammatch_compro&utm_medium=referral`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-gray-200"
                                    >
                                        {selectedPhoto.photographer}
                                    </a>{" "}
                                    on Unsplash
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
