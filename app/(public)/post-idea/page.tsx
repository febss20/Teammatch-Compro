import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Mulai Posting Ide | TeamMatch",
    description: "Masuk ke TeamMatch untuk membuat board ide lomba dan mulai mencari rekan tim.",
};

export default function PostIdeaPage() {
    return (
        <main className="px-4 py-12 md:py-16">
            <div className="page-frame grid gap-6">
                <div className="space-y-4">
                    <div className="section-kicker">Mulai ide lomba</div>
                    <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">BUAT BOARD DARI DASHBOARD</h1>
                    <p className="max-w-3xl text-lg leading-8 text-[var(--tm-muted)]">
                        Route ini dipakai sebagai pintu masuk untuk mulai posting ide. Untuk melanjutkan, masuk ke akun Anda
                        lalu buka form board baru di dashboard.
                    </p>
                </div>

                <div className="grid gap-4 md:max-w-2xl md:grid-cols-2">
                    <Link href="/login?next=/dashboard/boards/new" className="brutal-button">
                        Masuk dan buat board
                    </Link>
                    <Link href="/services" className="brutal-button-secondary">
                        Lihat kategori lomba
                    </Link>
                </div>
            </div>
        </main>
    );
}
