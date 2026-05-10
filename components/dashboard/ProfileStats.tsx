"use client";

import type { ProfileRecord } from "@/lib/types";

interface ProfileStatsProps {
    profile: ProfileRecord;
}

export default function ProfileStats({ profile }: ProfileStatsProps) {
    return (
        <div className="brutal-panel bg-(--tm-paper-strong) p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">Statistik Profil</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Kompetisi Count */}
                <div className="text-center p-4 border-2 border-black bg-(--tm-bg)">
                    <div className="text-3xl font-bold text-(--tm-primary)">
                        {profile.competitionsCount}
                    </div>
                    <div className="text-sm mt-2 font-medium">
                        Kompetisi Diikuti
                    </div>
                </div>

                {/* Testimonial Count */}
                <div className="text-center p-4 border-2 border-black bg-(--tm-bg)">
                    <div className="text-3xl font-bold text-(--tm-primary)">
                        {profile.testimonialCount}
                    </div>
                    <div className="text-sm mt-2 font-medium">
                        Testimoni Diterima
                    </div>
                </div>

                {/* Average Rating */}
                <div className="text-center p-4 border-2 border-black bg-(--tm-bg)">
                    <div className="text-3xl font-bold text-(--tm-primary)">
                        {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : "-"}
                    </div>
                    <div className="text-sm mt-2 font-medium">
                        Rating Rata-rata
                    </div>
                    {profile.averageRating > 0 && (
                        <div className="mt-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`text-lg ${
                                        i < Math.floor(profile.averageRating)
                                            ? "text-yellow-500"
                                            : "text-gray-300"
                                    }`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Best Result */}
                <div className="text-center p-4 border-2 border-black bg-(--tm-bg) md:col-span-2 lg:col-span-1">
                    <div className="text-sm font-medium mb-2">
                        Hasil Terbaik
                    </div>
                    <div className="text-lg font-bold text-(--tm-primary) min-h-12 flex items-center justify-center">
                        {profile.bestResult || "-"}
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            {profile.summaryUpdatedAt && (
                <div className="mt-6 text-sm text-gray-600 text-center">
                    Terakhir diperbarui: {new Date(profile.summaryUpdatedAt).toLocaleDateString("id-ID")}
                </div>
            )}

            {/* Empty State */}
            {profile.competitionsCount === 0 && profile.testimonialCount === 0 && (
                <div className="mt-6 text-center p-4 border-2 border-dashed border-gray-400 bg-gray-50">
                    <div className="text-gray-600">
                        Belum ada statistik yang tersedia. Ikuti kompetisi dan dapatkan testimoni untuk melihat statistik Anda di sini.
                    </div>
                </div>
            )}
        </div>
    );
}
