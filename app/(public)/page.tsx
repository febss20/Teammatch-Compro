import Hero from "@/components/public/Hero";
import Link from "next/link";

const workflowItems = [
    {
        id: "01",
        title: "Tulis ide dengan jelas",
        description: "Cantumkan judul, kategori, tenggat, dan skill yang dibutuhkan agar orang lain cepat memahami idenya.",
        tone: "bg-[var(--tm-accent-2)]",
    },
    {
        id: "02",
        title: "Temukan rekan yang sesuai",
        description: "Gunakan board untuk melihat siapa yang paling cocok dari sisi peran, kemampuan, dan cara kerja.",
        tone: "bg-[var(--tm-paper-strong)]",
    },
    {
        id: "03",
        title: "Kelola lewat dashboard",
        description: "Perbarui detail board, rapikan kebutuhan tim, lalu tutup ketika susunan anggota sudah lengkap.",
        tone: "bg-[var(--tm-accent)]",
    },
];

export default function HomePage() {
    return (
        <div className="pb-20">
            <Hero />

            <section className="px-4 py-8 md:py-12">
                <div className="page-frame brutal-panel brutal-stack relative grid gap-8 overflow-hidden bg-[var(--tm-paper-strong)] p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                    <div className="space-y-5">
                        <div className="section-kicker">Fitur utama</div>
                        <h2 className="display-font text-5xl leading-[0.9] text-[var(--tm-line)] md:text-6xl">
                            POST BOARD
                            <br />
                            IDE LOMBA
                        </h2>
                        <p className="max-w-2xl text-lg leading-8 text-[var(--tm-muted)]">
                            TeamMatch berpusat pada board ide lomba. Di sini, Anda bisa menjelaskan ide, kebutuhan tim, dan
                            tenggat dengan singkat supaya calon rekan tim langsung memahami konteksnya.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="brutal-panel-soft bg-[var(--tm-accent-2)] p-4">
                                <p className="display-font text-2xl">Tenggat jelas</p>
                                <p className="mt-2 text-sm leading-6 text-[var(--tm-line)]">
                                    Orang lain bisa langsung menangkap ritme kerja dan tingkat urgensinya.
                                </p>
                            </div>
                            <div className="brutal-panel-soft p-4">
                                <p className="display-font text-2xl">Skill spesifik</p>
                                <p className="mt-2 text-sm leading-6 text-[var(--tm-muted)]">
                                    Anda tidak sekadar mencari anggota, tetapi mencari peran yang memang dibutuhkan.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="brutal-panel grid gap-5 bg-[var(--tm-line)] p-5 text-[var(--tm-paper-strong)] md:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <p className="display-font text-3xl">Contoh Board</p>
                            <span className="rounded-full border-[2px] border-[var(--tm-paper-strong)] bg-[var(--tm-accent-2)] px-4 py-2 display-font text-xl text-[var(--tm-line)]">
                                Aktif
                            </span>
                        </div>
                        <div className="rounded-[18px] border-[3px] border-[var(--tm-paper-strong)] bg-[var(--tm-paper-strong)] p-5 text-[var(--tm-line)]">
                            <h3 className="text-2xl font-semibold leading-tight md:text-3xl">
                                Hackathon AI untuk Edukasi Kampus
                            </h3>
                            <p className="mt-4 text-sm leading-7 text-[var(--tm-muted)]">
                                Mencari tim kecil untuk membangun AI assistant yang membantu mahasiswa memahami jadwal, materi,
                                dan tugas dengan cara yang lebih praktis.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                {["Frontend", "Machine Learning", "UI/UX", "Pitching"].map((skill) => (
                                    <span key={skill} className="brutal-chip">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <Link href="/register" className="brutal-button w-full">
                            Mulai dengan daftar
                        </Link>
                    </div>
                </div>
            </section>

            <section className="px-4 py-8 md:py-14">
                <div className="page-frame space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-3">
                            <div className="section-kicker">Alur singkat</div>
                            <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">MULAI DARI IDE, LANJUT KE TIM</h2>
                        </div>
                        <p className="max-w-xl text-base leading-7 text-[var(--tm-muted)]">
                            TeamMatch dirancang supaya proses mencari rekan lomba terasa lebih rapi dan tidak berhenti di
                            obrolan yang serba acak.
                        </p>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                        {workflowItems.map((item, index) => (
                            <article
                                key={item.id}
                                className={`brutal-panel lift-card grid min-h-[270px] gap-5 p-6 ${item.tone} animate-rise`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="display-font text-7xl leading-none">{item.id}</div>
                                <div>
                                    <h3 className="display-font text-3xl leading-none">{item.title}</h3>
                                    <p className="mt-4 text-base leading-7 text-[var(--tm-muted)]">{item.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
