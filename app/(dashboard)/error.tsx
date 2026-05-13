"use client";

import { useEffect } from "react";

interface DashboardErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function DashboardErrorPage({ error, reset }: DashboardErrorPageProps) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="tm-shell py-16">
            <section className="brutal-hero px-6 py-12">
                <p className="section-label">Dashboard Error</p>
                <h1 className="mt-6 font-display text-4xl uppercase tracking-[0.04em] text-[var(--tm-ink)] sm:text-5xl">
                    Dashboard gagal dimuat.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--tm-muted)]">
                    Terjadi error runtime pada segment dashboard. Coba muat ulang boundary ini terlebih dahulu sebelum
                    melanjutkan.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                    <button type="button" onClick={reset} className="brutal-button">
                        Coba lagi
                    </button>
                    <a href="/dashboard" className="brutal-button brutal-button--secondary">
                        Kembali ke dashboard
                    </a>
                </div>
                {error.digest ? <p className="mt-8 text-sm text-[var(--tm-muted)]">Kode error: {error.digest}</p> : null}
            </section>
        </main>
    );
}
