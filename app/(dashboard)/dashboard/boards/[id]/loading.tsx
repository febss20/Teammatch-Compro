export default function BoardDetailLoading() {
    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-5">
                <div className="brutal-panel h-56 animate-poster bg-[var(--tm-paper-muted)]" />
                <div className="brutal-panel h-72 animate-poster bg-[var(--tm-paper-muted)]" />
                <div className="brutal-panel h-64 animate-poster bg-[var(--tm-paper-muted)]" />
            </div>
            <div className="brutal-panel h-80 animate-poster bg-[var(--tm-paper-muted)]" />
        </div>
    );
}
