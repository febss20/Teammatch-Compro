export default function NewBoardLoading() {
    return (
        <div className="min-h-screen px-4 py-10 md:py-14">
            <div className="page-frame space-y-8">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="brutal-panel h-32 animate-poster bg-[var(--tm-paper-muted)]" />
                    <div className="brutal-panel h-14 w-56 animate-poster bg-[var(--tm-paper-muted)]" />
                </div>

                <div className="brutal-panel h-[42rem] animate-poster bg-[var(--tm-paper-muted)]" />
            </div>
        </div>
    );
}
