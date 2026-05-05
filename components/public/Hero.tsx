import Link from "next/link";

export default function Hero() {
    return (
        <section className="overflow-hidden px-4 pb-16 pt-10 md:pb-24 md:pt-14">
            <div className="page-frame grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                <div className="animate-rise space-y-6">
                    <div className="section-kicker">
                        <span>Ruang kolaborasi kompetisi kampus</span>
                    </div>
                    <div className="space-y-5">
                        <p className="display-font text-[clamp(4rem,11vw,8rem)] leading-[0.9] text-[var(--tm-line)]">
                            BANGUN
                            <br />
                            TIM
                            <span className="ml-3 inline-block -rotate-2 bg-[var(--tm-accent)] px-3 py-1">LOMBA</span>
                            <br />
                            DENGAN ARAH
                        </p>
                        <p className="max-w-2xl text-lg leading-8 text-[var(--tm-muted)] md:text-xl">
                            TeamMatch membantu mahasiswa membagikan ide lomba, menjelaskan kebutuhan tim, dan mulai
                            berkolaborasi dengan arah yang lebih jelas sejak awal.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link href="/register" className="brutal-button min-w-[220px]">
                            Buat akun
                        </Link>
                        <Link href="/login" className="brutal-button-secondary min-w-[220px]">
                            Masuk ke dashboard
                        </Link>
                    </div>
                </div>

                <div className="brutal-stack animate-rise [animation-delay:120ms]">
                    <div className="brutal-panel relative overflow-hidden bg-[var(--tm-paper-strong)] p-6 md:p-8">
                        <div className="absolute right-5 top-5 rotate-6 border-[3px] border-[var(--tm-line)] bg-[var(--tm-accent-2)] px-3 py-2 display-font text-xl leading-none">
                            Board contoh
                        </div>

                        <div className="grid gap-6">
                            <div className="rounded-[18px] border-[3px] border-[var(--tm-line)] bg-[var(--tm-accent-3)] p-5 text-[var(--tm-paper-strong)]">
                                <p className="display-font text-2xl uppercase tracking-[0.04em]">Ide yang sedang dibuka</p>
                                <h2 className="mt-3 text-2xl font-semibold leading-tight md:text-3xl">
                                    Hackathon AI untuk pengalaman belajar kampus yang lebih personal.
                                </h2>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-xl uppercase">Batas akhir</p>
                                    <p className="mt-2 text-base font-semibold text-[var(--tm-muted)]">27 Mei 2026</p>
                                </div>
                                <div className="brutal-panel-soft bg-[var(--tm-accent-2)] p-4">
                                    <p className="display-font text-xl uppercase">Kebutuhan tim</p>
                                    <p className="mt-2 text-base font-semibold text-[var(--tm-line)]">Masih mencari tim inti</p>
                                </div>
                            </div>

                            <div className="brutal-panel-soft p-4">
                                <p className="display-font text-xl uppercase">Skill utama</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {["Frontend", "ML Engineer", "UI/UX", "Pitching"].map((item) => (
                                        <span key={item} className="brutal-chip">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
