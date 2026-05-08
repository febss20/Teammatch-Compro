export default function TeamsLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="section-kicker">Teams</div>
                <div className="h-20 w-full max-w-4xl brutal-skeleton" />
            </div>

            <div className="grid gap-5">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-6">
                        <div className="flex gap-3">
                            <div className="h-10 w-40 brutal-skeleton" />
                            <div className="h-10 w-52 brutal-skeleton" />
                        </div>
                        <div className="h-16 w-full brutal-skeleton" />
                    </div>
                ))}
            </div>
        </div>
    );
}
