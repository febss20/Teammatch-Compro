"use client";

import Link from "next/link";
import { startTransition, useOptimistic, useState } from "react";
import { deleteCompetitionIdeaBoard } from "@/app/(dashboard)/dashboard/actions";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { formatDashboardDate, formatDashboardDateTime } from "@/lib/shared/formatters";
import type { CompetitionIdeaBoardRecord } from "@/lib/types";

interface BoardListProps {
    boards: CompetitionIdeaBoardRecord[];
}

export default function BoardList({ boards }: BoardListProps) {
    const [boardState, setBoardState] = useState<CompetitionIdeaBoardRecord[]>(boards);
    const [boardToDelete, setBoardToDelete] = useState<CompetitionIdeaBoardRecord | null>(null);
    const [pendingBoardId, setPendingBoardId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [optimisticBoards, removeOptimisticBoard] = useOptimistic(
        boardState,
        (currentBoards: CompetitionIdeaBoardRecord[], deletedBoardId: string) =>
            currentBoards.filter((board) => board.id !== deletedBoardId),
    );

    const handleDelete = async (boardId: string): Promise<boolean> => {
        const currentBoardsSnapshot = [...boardState];
        const formData = new FormData();
        formData.set("id", boardId);

        setDeleteError(null);
        setPendingBoardId(boardId);
        startTransition(() => {
            removeOptimisticBoard(boardId);
        });

        const result = await deleteCompetitionIdeaBoard(formData);

        if (!result.success) {
            setBoardState(currentBoardsSnapshot);
            setPendingBoardId(null);
            setDeleteError(result.formError ?? "Terjadi kesalahan saat menghapus board ide.");
            return false;
        }

        setBoardState((currentBoards) => currentBoards.filter((board) => board.id !== boardId));
        setPendingBoardId(null);
        return true;
    };

    const handleConfirmDelete = async (): Promise<void> => {
        if (!boardToDelete) {
            return;
        }

        const wasDeleted = await handleDelete(boardToDelete.id);

        if (wasDeleted) {
            setBoardToDelete(null);
        }
    };

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                    <div className="section-kicker">Board ide Anda</div>
                    <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">IDE LOMBA YANG SEDANG ANDA KELOLA</h2>
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--tm-muted)]">
                    {optimisticBoards.length} board tersimpan
                </p>
            </div>

            {deleteError && <div className="brutal-alert-error text-sm">{deleteError}</div>}

            <div className="grid gap-5">
                {optimisticBoards.map((board, index) => (
                    <article
                        key={board.id}
                        className="brutal-panel lift-card grid gap-6 bg-[var(--tm-paper-strong)] p-6 animate-rise lg:grid-cols-[1fr_auto]"
                        style={{ animationDelay: `${index * 80}ms` }}
                    >
                        <div className="space-y-5">
                            <div className="flex flex-wrap gap-3">
                                <span
                                    className={`brutal-chip ${board.status === "closed" ? "brutal-status-closed" : "brutal-status-open"}`}
                                >
                                    {board.status === "closed" ? "Ditutup" : "Aktif"}
                                </span>
                                <span className="brutal-chip bg-[var(--tm-surface-info)]">{board.competitionType}</span>
                            </div>

                            <div>
                                <h3 className="display-font text-5xl leading-[0.92] text-[var(--tm-line)]">{board.title}</h3>
                                <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--tm-muted)] break-words">
                                    {board.description}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {board.requiredSkills.map((skill) => (
                                    <span key={`${board.id}-${skill}`} className="brutal-chip bg-white">
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-xl leading-none">Deadline</p>
                                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                                        {formatDashboardDate(board.deadline)}
                                    </p>
                                </div>
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-xl leading-none">Terakhir diperbarui</p>
                                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                                        {formatDashboardDateTime(board.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap content-start gap-3 lg:w-[220px] lg:justify-end">
                            <Link href={`/dashboard/boards/${board.id}/edit`} className="brutal-button-secondary w-full">
                                Edit
                            </Link>
                            <button
                                type="button"
                                disabled={pendingBoardId !== null}
                                className="brutal-button-danger w-full disabled:opacity-60"
                                onClick={() => setBoardToDelete(board)}
                            >
                                {pendingBoardId === board.id ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <ConfirmationDialog
                isOpen={boardToDelete !== null}
                isPending={boardToDelete !== null && pendingBoardId === boardToDelete.id}
                title="Hapus board ide ini?"
                description="Board, slot rekrutmen, dan konteks pengelolaannya akan dihapus dari panel aktif Anda."
                cancelLabel="Kembali"
                confirmLabel="Ya, hapus board"
                onCancel={() => setBoardToDelete(null)}
                onConfirm={handleConfirmDelete}
            />
        </section>
    );
}
