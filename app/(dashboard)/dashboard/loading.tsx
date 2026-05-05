export default function DashboardLoading() {
    return (
        <div className="min-h-screen px-4 py-10 md:py-14">
            <div className="page-frame space-y-8">
                <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="brutal-panel h-[18rem] animate-poster bg-[var(--tm-paper-muted)]" />
                    <div className="grid gap-4">
                        <div className="brutal-panel h-[9rem] animate-poster bg-[var(--tm-paper-muted)]" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="brutal-panel h-[8rem] animate-poster bg-[var(--tm-paper-muted)]" />
                            <div className="brutal-panel h-[8rem] animate-poster bg-[var(--tm-paper-muted)]" />
                        </div>
                    </div>
                </section>

                <section className="grid gap-5">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={`dashboard-skeleton-${index}`}
                            className="brutal-panel h-[22rem] animate-poster bg-[var(--tm-paper-muted)]"
                        />
                    ))}
                </section>
            </div>
        </div>
    );
}
