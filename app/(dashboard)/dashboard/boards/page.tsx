import Link from "next/link";
import BoardDiscoveryList from "@/components/dashboard/BoardDiscoveryList";
import { requireCompletedProfile } from "@/lib/auth";
import { getOwnBoards, getPublicBoards } from "@/lib/dashboard/data";

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function getStatusMessage(searchParams: { created?: string; updated?: string; deleted?: string }) {
    if (searchParams.created === "1") return "Board publik berhasil dibuat.";
    if (searchParams.updated === "1") return "Board publik berhasil diperbarui.";
    if (searchParams.deleted === "1") return "Board berhasil dihapus.";
    return null;
}

export default async function BoardsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { user } = await requireCompletedProfile();
    const resolvedSearchParams = await searchParams;
    const selectedType = firstParam(resolvedSearchParams.type) ?? "all";
    const [publicBoards, ownBoards] = await Promise.all([
        getPublicBoards({ competitionType: selectedType, viewerId: user.id }),
        getOwnBoards(user.id),
    ]);
    const statusMessage = getStatusMessage({
        created: firstParam(resolvedSearchParams.created),
        updated: firstParam(resolvedSearchParams.updated),
        deleted: firstParam(resolvedSearchParams.deleted),
    });

    return (
        <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-4">
                    <div className="section-kicker">Boards</div>
                    <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">TEMUKAN IDE LOMBA DAN PELAMAR</h1>
                </div>
                <Link href="/dashboard/boards/new" className="brutal-button">
                    Publish board baru
                </Link>
            </div>

            {statusMessage && <div className="brutal-alert-success text-sm">{statusMessage}</div>}

            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <BoardDiscoveryList boards={publicBoards} currentType={selectedType} />

                <aside className="space-y-4">
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Board milik saya</p>
                        <div className="mt-4 grid gap-3">
                            {ownBoards.slice(0, 5).map((board) => (
                                <Link
                                    key={board.id}
                                    href={`/dashboard/boards/${board.id}/review`}
                                    className="brutal-panel-soft block p-4"
                                >
                                    <p className="display-font text-2xl leading-none">{board.title}</p>
                                    <p className="mt-2 text-sm text-[var(--tm-muted)]">{board.competitionType}</p>
                                </Link>
                            ))}
                            {ownBoards.length === 0 && (
                                <p className="text-sm text-[var(--tm-muted)]">Belum ada board milik Anda.</p>
                            )}
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
}
