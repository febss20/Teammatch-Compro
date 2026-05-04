import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPETITIONS } from "@/lib/marketing/data";

export function generateStaticParams() {
    return COMPETITIONS.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const data = COMPETITIONS.find((item) => item.id === id);

    if (!data) {
        return { title: "Not Found | TeamMatch" };
    }

    return {
        title: `${data.title} | TeamMatch`,
        description: data.description,
    };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = COMPETITIONS.find((item) => item.id === id);

    if (!data) {
        notFound();
    }

    return (
        <div className="px-4 py-12 md:py-16">
            <div className="page-frame grid gap-8">
                <Link href="/services" className="brutal-button-secondary w-fit">
                    Kembali ke daftar
                </Link>

                <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="brutal-panel overflow-hidden bg-[var(--tm-paper-strong)]">
                        <div className="relative h-72 border-b-[3px] border-[var(--tm-line)] md:h-[30rem]">
                            <Image
                                src={data.image}
                                alt={data.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 55vw"
                            />
                            <div className="absolute left-4 top-4 rotate-[-4deg] border-[3px] border-[var(--tm-line)] bg-[var(--tm-accent)] px-3 py-2 display-font text-2xl leading-none text-[var(--tm-line)]">
                                Competition Dossier
                            </div>
                        </div>
                    </div>

                    <div className="editorial-grid">
                        <div className="space-y-4">
                            <div className="section-kicker">Competition Detail</div>
                            <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">{data.title}</h1>
                        </div>

                        <article className="brutal-panel p-6 md:p-8">
                            <p className="text-lg leading-8 text-[var(--tm-muted)]">{data.description}</p>
                            <p className="mt-5 text-base leading-8 text-[var(--tm-muted)]">
                                Di kategori {data.title}, Anda akan bertemu mahasiswa yang biasanya datang dengan kebutuhan
                                peran yang spesifik, tenggat yang sempit, dan ekspektasi kolaborasi yang tinggi. Karena itu,
                                board yang rapi menjadi pembeda utama.
                            </p>
                        </article>

                        <article className="brutal-panel bg-[var(--tm-line)] p-6 text-[var(--tm-paper-strong)] md:p-8">
                            <p className="display-font text-3xl leading-none">Ready to enter</p>
                            <p className="mt-4 text-base leading-7 text-[#f7eeda]">
                                Masuk ke dashboard dan publikasikan board ide untuk kategori ini dengan judul, deadline, dan
                                kebutuhan skill yang presisi.
                            </p>
                            <Link href="/login?next=/dashboard/boards/new" className="brutal-button mt-6 w-full">
                                Posting Board
                            </Link>
                        </article>
                    </div>
                </div>
            </div>
        </div>
    );
}
