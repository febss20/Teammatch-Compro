import Hero from "@/components/Hero";
import Link from "next/link";

export default function HomePage() {
    return (
        <div>
            <Hero />

            <section className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-[linear-gradient(135deg,_rgba(6,182,212,0.1),_rgba(20,184,166,0.14))] p-8 shadow-[0_30px_80px_rgba(6,182,212,0.14)] md:p-10">
                        <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
                        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-teal-200/40 blur-3xl" />

                        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                            <div>
                                <div className="inline-flex rounded-full border border-cyan-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
                                    MVP Feature
                                </div>
                                <h2 className="mt-6 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
                                    Post Board Ide Lomba dan mulai cari rekan tim dengan brief yang jelas.
                                </h2>
                                <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
                                    Fitur ini dirancang sebagai titik awal TeamMatch: Anda menuliskan ide lomba, kategori,
                                    deadline, dan skill yang dibutuhkan agar calon rekan tim langsung paham kebutuhan
                                    kolaborasi.
                                </p>
                            </div>

                            <div className="rounded-[1.75rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                    <p className="text-sm font-semibold text-gray-900">Board Preview</p>
                                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                        Open
                                    </span>
                                </div>
                                <div className="mt-5 space-y-4">
                                    <h3 className="text-xl font-bold text-gray-900">Hackathon AI untuk Edukasi Kampus</h3>
                                    <p className="text-sm leading-6 text-gray-600">
                                        Mencari tim kecil untuk membangun prototype AI assistant yang membantu mahasiswa
                                        memahami jadwal, tugas, dan materi kuliah dengan lebih cepat.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {["Frontend", "Machine Learning", "UI/UX", "Pitching"].map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Link
                                    href="/register"
                                    className="mt-6 inline-flex items-center rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                                >
                                    Mulai dari Register
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-primary text-3xl mb-4 font-bold">01</div>
                        <h3 className="text-xl font-bold mb-2">Cari Kompetisi</h3>
                        <p className="text-gray-500">Akses daftar lomba aktif dari berbagai bidang minat.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-secondary text-3xl mb-4 font-bold">02</div>
                        <h3 className="text-xl font-bold mb-2">Filter Skill</h3>
                        <p className="text-gray-500">Cari teman tim berdasarkan keahlian spesifik yang dibutuhkan.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-primary text-3xl mb-4 font-bold">03</div>
                        <h3 className="text-xl font-bold mb-2">Mulai Kolaborasi</h3>
                        <p className="text-gray-500">Hubungi calon rekan setim dan mulai kerjakan project bersama.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
