export default function BoardsLoading() {
    return (
        <div className="grid gap-5">
            <div className="brutal-panel h-28 animate-poster bg-[var(--tm-paper-muted)]" />
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="grid gap-5">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="brutal-panel h-64 animate-poster bg-[var(--tm-paper-muted)]" />
                    ))}
                </div>
                <div className="brutal-panel h-72 animate-poster bg-[var(--tm-paper-muted)]" />
            </div>
        </div>
    );
}
