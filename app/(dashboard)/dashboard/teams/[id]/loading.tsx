export default function TeamLoading() {
    return (
        <div className="grid gap-5">
            <div className="brutal-panel h-28 animate-poster bg-[var(--tm-paper-muted)]" />
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="grid gap-5">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="brutal-panel h-36 animate-poster bg-[var(--tm-paper-muted)]" />
                    ))}
                </div>
                <div className="grid gap-4">
                    <div className="brutal-panel h-40 animate-poster bg-[var(--tm-paper-muted)]" />
                    <div className="brutal-panel h-56 animate-poster bg-[var(--tm-paper-muted)]" />
                </div>
            </div>
        </div>
    );
}
