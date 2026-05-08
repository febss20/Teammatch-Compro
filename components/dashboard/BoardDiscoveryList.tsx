"use client";

import Link from "next/link";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import type { CompetitionIdeaBoardRecord } from "@/lib/types";

interface BoardDiscoveryListProps {
    boards: CompetitionIdeaBoardRecord[];
    currentType: string;
}

function formatDeadline(deadline: string) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(deadline));
}

function isNewBoard(publishedAt: string | null) {
    if (!publishedAt) {
        return false;
    }

    return Date.now() - new Date(publishedAt).getTime() < 24 * 60 * 60 * 1000;
}

const tabs = [
    ["all", "Semua"],
    ["hackathon", "Hackathon"],
    ["pkm", "PKM"],
    ["business", "Business"],
    ["others", "Lainnya"],
] as const;

export default function BoardDiscoveryList({ boards, currentType }: BoardDiscoveryListProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
                {tabs.map(([value, label]) => (
                    <Link
                        key={value}
                        href={`/dashboard/boards${value === "all" ? "" : `?type=${value}`}`}
                        className={`brutal-chip px-4 py-3 text-base ${currentType === value ? "bg-[var(--tm-accent)]" : "bg-white"}`}
                    >
                        {label}
                    </Link>
                ))}
            </div>

            <div className="grid gap-5">
                {boards.length > 0 ? (
                    boards.map((board) => (
                        <article key={board.id} className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-6">
                            <div className="flex flex-wrap gap-3">
                                <span className="brutal-chip bg-[var(--tm-accent-2)]">{board.competitionType}</span>
                                <span
                                    className={`brutal-chip ${board.status === "closed" ? "brutal-status-closed" : "brutal-status-open"}`}
                                >
                                    {board.status === "closed" ? "Tutup" : "Aktif"}
                                </span>
                                {isNewBoard(board.publishedAt) && (
                                    <span className="brutal-chip bg-[var(--tm-accent)]">Baru</span>
                                )}
                            </div>

                            <div>
                                <h3 className="display-font text-5xl leading-[0.92]">{board.title}</h3>
                                <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                                    {board.summary ?? board.description}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {board.requiredSkills.map((skill) => (
                                    <span key={skill} className="brutal-chip bg-white">
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                                <div className="text-sm uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                                    Creator: {board.creatorName ?? "Anonymous"} / Deadline {formatDeadline(board.deadline)}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Link href={`/dashboard/boards/${board.id}`} className="brutal-button-secondary">
                                        Detail
                                    </Link>
                                    <Link href={`/dashboard/boards/${board.id}`} className="brutal-button">
                                        Gabung Tim
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))
                ) : (
                    <DashboardEmptyState
                        actionHref="/dashboard/boards/new"
                        actionLabel="Buat board baru"
                        title="Belum ada board yang cocok"
                        body="Coba ganti tab jenis lomba atau mulai publikasikan board Anda sendiri agar discovery tetap bergerak."
                    />
                )}
            </div>
        </div>
    );
}
