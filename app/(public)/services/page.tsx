import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { COMPETITIONS } from "@/lib/data";

export const metadata: Metadata = {
    title: "Kategori Lomba | TeamMatch",
    description: "Jelajahi berbagai kategori kompetisi dan temukan rekan tim yang tepat untuk lomba Anda.",
};

export default async function ServicesPage() {
    return (
        <div className="px-4 py-12 md:py-16">
            <div className="page-frame space-y-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                        <div className="section-kicker">Competition Categories</div>
                        <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">PILIH ARENA YANG TEPAT</h1>
                    </div>
                    <p className="max-w-xl text-lg leading-8 text-[var(--tm-muted)]">
                        Setiap kategori punya ritme, skill, dan pola kolaborasi yang berbeda. TeamMatch menempatkannya seperti
                        dossier, bukan kartu promosi biasa.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {COMPETITIONS.map((item, index) => (
                        <article
                            key={item.id}
                            className="brutal-panel lift-card overflow-hidden bg-[var(--tm-paper-strong)] animate-rise"
                            style={{ animationDelay: `${index * 90}ms` }}
                        >
                            <div className="relative h-56 border-b-[3px] border-[var(--tm-line)] bg-[var(--tm-paper-muted)]">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div className="absolute left-4 top-4 rotate-[-3deg] border-[3px] border-[var(--tm-line)] bg-[var(--tm-accent-2)] px-3 py-2 display-font text-2xl leading-none">
                                    Category
                                </div>
                            </div>
                            <div className="grid gap-5 p-6">
                                <div>
                                    <h2 className="display-font text-4xl leading-none text-[var(--tm-line)]">{item.title}</h2>
                                    <p className="mt-4 text-base leading-7 text-[var(--tm-muted)]">{item.description}</p>
                                </div>
                                <Link href={`/services/${item.id}`} className="brutal-button w-full">
                                    Lihat Detail
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
