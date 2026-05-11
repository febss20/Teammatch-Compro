export default function NotificationsLoading() {
    return (
        <div className="grid gap-5">
            <div className="brutal-panel h-28 animate-poster bg-[var(--tm-paper-muted)]" />
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="brutal-panel h-48 animate-poster bg-[var(--tm-paper-muted)]" />
            ))}
        </div>
    );
}
