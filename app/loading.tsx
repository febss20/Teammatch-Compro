export default function Loading() {
    return (
        <div className="min-h-screen px-4 py-10">
            <div className="page-frame flex min-h-[70vh] items-center justify-center">
                <div className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] px-8 py-10 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full border-[4px] border-[var(--tm-line)] border-t-[var(--tm-accent)] animate-spin bg-[var(--tm-accent-2)]" />
                    <div>
                        <p className="display-font text-4xl leading-none">Loading</p>
                        <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[var(--tm-muted)]">Memuat halaman...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
