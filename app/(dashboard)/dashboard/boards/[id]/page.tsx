import Link from "next/link";
import { notFound } from "next/navigation";
import BoardApplicationForm from "@/components/dashboard/BoardApplicationForm";
import { closeBoardRecruitment } from "@/app/(dashboard)/dashboard/actions";
import { requireCompletedProfile } from "@/lib/auth";
import { getBoardById } from "@/lib/dashboard/data";

function formatDeadline(deadline: string) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(deadline));
}

export default async function BoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = await requireCompletedProfile();
    const { id } = await params;
    const board = await getBoardById(id);

    if (!board || (board.visibility === "private" && board.userId !== user.id)) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-5">
                    <div className="flex flex-wrap gap-3">
                        <span className="brutal-chip bg-[var(--tm-accent-2)]">{board.competitionType}</span>
                        <span
                            className={`brutal-chip ${board.status === "closed" ? "brutal-status-closed" : "brutal-status-open"}`}
                        >
                            {board.status === "closed" ? "Tutup" : "Aktif"}
                        </span>
                    </div>
                    <div className="space-y-4">
                        <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">{board.title}</h1>
                        <p className="text-lg leading-8 text-[var(--tm-muted)]">{board.summary ?? board.description}</p>
                    </div>

                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                        <p className="display-font text-3xl leading-none">Deskripsi Lengkap</p>
                        <p className="mt-4 text-base leading-8 text-[var(--tm-muted)]">{board.description}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                            <p className="display-font text-3xl leading-none">Deadline</p>
                            <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                                {formatDeadline(board.deadline)}
                            </p>
                        </div>
                        <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                            <p className="display-font text-3xl leading-none">Skill Dibutuhkan</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {board.requiredSkills.map((skill) => (
                                    <span key={skill} className="brutal-chip bg-white">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                        <p className="display-font text-3xl leading-none">Kebutuhan Tim</p>
                        <div className="mt-4 grid gap-4">
                            {board.slots.map((slot) => (
                                <div key={slot.id} className="brutal-panel-soft p-4">
                                    <p className="display-font text-2xl leading-none">{slot.roleName}</p>
                                    <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                                        {slot.slotCount} slot tersedia
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {board.userId === user.id ? (
                        <div className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-5">
                            <p className="display-font text-3xl leading-none">Aksi Creator</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="brutal-panel-soft p-4">
                                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--tm-muted)]">Status board</p>
                                    <p className="mt-2 display-font text-2xl leading-none">
                                        {board.status === "closed" ? "Rekrutmen ditutup" : "Rekrutmen aktif"}
                                    </p>
                                </div>
                                <div className="brutal-panel-soft p-4">
                                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--tm-muted)]">Jumlah peran</p>
                                    <p className="mt-2 display-font text-2xl leading-none">{board.slots.length} slot role</p>
                                </div>
                            </div>
                            <Link href={`/dashboard/boards/${board.id}/edit`} className="brutal-button-secondary">
                                Edit posting
                            </Link>
                            <Link href={`/dashboard/boards/${board.id}/review`} className="brutal-button">
                                Review pelamar
                            </Link>
                            {board.status !== "closed" && (
                                <form action={closeBoardRecruitment}>
                                    <input type="hidden" name="id" value={board.id} />
                                    <button type="submit" className="brutal-button-danger w-full">
                                        Tutup rekrutmen
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : (
                        <BoardApplicationForm board={board} />
                    )}
                </div>
            </div>
        </div>
    );
}
