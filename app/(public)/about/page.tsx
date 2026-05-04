import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tentang Kami | TeamMatch",
    description: "Pelajari lebih lanjut tentang TeamMatch, platform kolaborasi mahasiswa untuk kompetisi.",
};

export default function AboutPage() {
    return (
        <div className="px-4 py-12 md:py-16">
            <div className="page-frame grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <section className="space-y-5">
                    <div className="section-kicker">About TeamMatch</div>
                    <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">
                        KOLABORASI
                        <br />
                        BUKAN
                        <br />
                        KEBETULAN
                    </h1>
                    <div className="brutal-panel bg-[var(--tm-accent-2)] p-6">
                        <p className="display-font text-3xl leading-none text-[var(--tm-line)]">Manifesto</p>
                        <p className="mt-4 text-lg leading-8 text-[var(--tm-line)]">
                            TeamMatch lahir dari satu masalah yang terlalu sering dianggap normal: ide lomba bagus gugur bukan
                            karena idenya lemah, tetapi karena timnya tidak pernah terbentuk dengan benar.
                        </p>
                    </div>
                </section>

                <section className="editorial-grid">
                    <article className="brutal-panel p-6 md:p-8">
                        <p className="display-font text-3xl leading-none">Kenapa dibuat</p>
                        <p className="mt-5 text-lg leading-8 text-[var(--tm-muted)]">
                            Mahasiswa sering memiliki dorongan besar untuk ikut kompetisi, tetapi proses mencari rekan kerja
                            yang selaras masih acak. TeamMatch ingin mengubah pencarian itu menjadi proses yang lebih
                            intentional, ringkas, dan terukur.
                        </p>
                    </article>

                    <article className="brutal-panel bg-[var(--tm-line)] p-6 text-[var(--tm-paper-strong)] md:p-8">
                        <p className="display-font text-3xl leading-none">Apa yang dipercaya</p>
                        <p className="mt-5 text-lg leading-8 text-[#f7eeda]">
                            Kolaborasi lintas jurusan seharusnya tidak terasa seperti mencari orang secara manual di banyak grup
                            chat. Brief yang jelas, ownership yang jelas, dan kebutuhan skill yang spesifik adalah fondasi awal
                            untuk tim yang lebih sehat.
                        </p>
                    </article>

                    <article className="brutal-panel brutal-stack p-6 md:p-8">
                        <p className="display-font text-3xl leading-none">Visi</p>
                        <blockquote className="mt-6 max-w-3xl text-2xl font-semibold leading-relaxed text-[var(--tm-line)]">
                            “Menjadi workspace awal paling tegas bagi mahasiswa untuk membangun tim impian dan mengeksekusi
                            kompetisi dengan brief yang matang.”
                        </blockquote>
                    </article>
                </section>
            </div>
        </div>
    );
}
