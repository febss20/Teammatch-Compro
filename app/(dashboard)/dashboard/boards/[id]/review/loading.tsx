export default function BoardReviewLoading() {
    return (
        <div className="grid gap-5">
            <div className="brutal-panel h-28 animate-poster bg-[var(--tm-paper-muted)]" />
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="brutal-panel h-72 animate-poster bg-[var(--tm-paper-muted)]" />
            ))}
        </div>
    );
}
