import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tentang Kami | TeamMatch",
    description: "Kenali TeamMatch lebih dekat sebagai ruang kolaborasi mahasiswa untuk mempersiapkan kompetisi.",
};

export default function AboutPage() {
    return (
        <div className="px-4 py-12 md:py-16">
            <div className="page-frame grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <section className="space-y-5">
                    <div className="section-kicker">Tentang TeamMatch</div>
                    <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">
                        KOLABORASI
                        <br />
                        TIDAK
                        <br />
                        HARUS ACAK
                    </h1>
                    <div className="brutal-panel bg-[var(--tm-accent-2)] p-6">
                        <p className="display-font text-3xl leading-none text-[var(--tm-line)]">Mengapa TeamMatch hadir</p>
                        <p className="mt-4 text-lg leading-8 text-[var(--tm-line)]">
                            Banyak ide lomba yang sebenarnya kuat, tetapi berhenti di tengah jalan karena tim yang tepat tidak
                            pernah benar-benar terbentuk.
                        </p>
                    </div>
                </section>

                <section className="editorial-grid">
                    <article className="brutal-panel p-6 md:p-8">
                        <p className="display-font text-3xl leading-none">Masalah yang ingin diselesaikan</p>
                        <p className="mt-5 text-lg leading-8 text-[var(--tm-muted)]">
                            Mahasiswa sering antusias ikut kompetisi, tetapi proses mencari rekan tim masih serba manual dan
                            kurang terarah. TeamMatch hadir agar proses itu terasa lebih jelas, ringkas, dan lebih mudah
                            dijalankan.
                        </p>
                    </article>

                    <article className="brutal-panel bg-[var(--tm-line)] p-6 text-[var(--tm-paper-strong)] md:p-8">
                        <p className="display-font text-3xl leading-none">Yang kami percaya</p>
                        <p className="mt-5 text-lg leading-8 text-[#f7eeda]">
                            Kolaborasi lintas jurusan akan berjalan lebih baik jika dimulai dari brief yang jelas, kebutuhan
                            skill yang spesifik, dan ekspektasi yang terbuka sejak awal.
                        </p>
                    </article>

                    <article className="brutal-panel brutal-stack p-6 md:p-8">
                        <p className="display-font text-3xl leading-none">Visi</p>
                        <blockquote className="mt-6 max-w-3xl text-2xl font-semibold leading-relaxed text-[var(--tm-line)]">
                            “Menjadi tempat awal yang membantu mahasiswa membentuk tim lomba dengan lebih terarah dan siap
                            bergerak.”
                        </blockquote>
                    </article>
                </section>
            </div>
        </div>
    );
}
