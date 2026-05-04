import Link from "next/link";
import DashboardLogoutButton from "@/components/dashboard/DashboardLogoutButton";
import DeleteBoardButton from "@/components/dashboard/DeleteBoardButton";
import { requireUser } from "@/lib/auth";
import type { CompetitionIdeaBoardRecord } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function mapBoardRecord(row: {
    id: string;
    user_id: string;
    title: string;
    competition_type: string;
    description: string;
    deadline: string;
    required_skills: string[];
    status: string;
    created_at: string;
    updated_at: string;
}): CompetitionIdeaBoardRecord {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        competitionType: row.competition_type,
        description: row.description,
        deadline: row.deadline,
        requiredSkills: row.required_skills,
        status: row.status === "closed" ? "closed" : "open",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function getStatusMessage(searchParams: { created?: string; updated?: string; deleted?: string }): string | null {
    if (searchParams.created === "1") {
        return "Board ide berhasil dibuat.";
    }

    if (searchParams.updated === "1") {
        return "Board ide berhasil diperbarui.";
    }

    if (searchParams.deleted === "1") {
        return "Board ide berhasil dihapus.";
    }

    return null;
}

function formatDeadline(deadline: string): string {
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(deadline));
}

function formatUpdatedAt(updatedAt: string): string {
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(updatedAt));
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ created?: string; updated?: string; deleted?: string }>;
}) {
    const user = await requireUser();
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("competition_idea_boards")
        .select("id, user_id, title, competition_type, description, deadline, required_skills, status, created_at, updated_at")
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Gagal memuat dashboard board ide: ${error.message}`);
    }

    const boards = (data ?? []).map(mapBoardRecord);
    const resolvedSearchParams = await searchParams;
    const statusMessage = getStatusMessage(resolvedSearchParams);

    return (
        <div className="min-h-screen px-4 py-10 md:py-14">
            <div className="page-frame space-y-8">
                <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="brutal-panel bg-[var(--tm-line)] p-6 text-[var(--tm-paper-strong)] md:p-8">
                        <div className="section-kicker w-fit !bg-[var(--tm-accent-2)] !text-[var(--tm-line)]">Workspace</div>
                        <h1 className="mt-5 display-font text-[clamp(4rem,9vw,7rem)] leading-[0.88]">
                            BOARD
                            <br />
                            CONTROL
                            <br />
                            DESK
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f7eeda]">
                            Selamat datang, {user.email ?? "Pengguna TeamMatch"}. Kelola seluruh board ide lomba Anda dari satu
                            workspace yang ringkas, tegas, dan mudah dipindai.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                            <p className="display-font text-3xl leading-none">Quick actions</p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link href="/dashboard/boards/new" className="brutal-button">
                                    Buat Board Ide
                                </Link>
                                <DashboardLogoutButton />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="brutal-panel bg-[var(--tm-accent-2)] p-5">
                                <p className="display-font text-2xl leading-none">Total board</p>
                                <p className="mt-4 display-font text-5xl leading-none">{boards.length}</p>
                            </div>
                            <div className="brutal-panel p-5">
                                <p className="display-font text-2xl leading-none">Mode</p>
                                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--tm-muted)]">
                                    Personal workspace
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {statusMessage && <div className="brutal-alert-success text-sm">{statusMessage}</div>}

                {boards.length === 0 ? (
                    <section className="brutal-stack">
                        <div className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-8 text-center md:p-10">
                            <div className="mx-auto section-kicker">Empty State</div>
                            <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">BOARD PERTAMA MASIH KOSONG</h2>
                            <p className="mx-auto max-w-2xl text-base leading-8 text-[var(--tm-muted)]">
                                Mulai dari satu ide yang tajam. Setelah board pertama dibuat, Anda bisa mengedit, menutup, atau
                                menghapusnya langsung dari dashboard ini.
                            </p>
                            <Link href="/dashboard/boards/new" className="brutal-button mx-auto">
                                Buat Board Pertama
                            </Link>
                        </div>
                    </section>
                ) : (
                    <section className="space-y-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div className="space-y-3">
                                <div className="section-kicker">Board Anda</div>
                                <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">ACTIVE COMPETITION SHEETS</h2>
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--tm-muted)]">
                                {boards.length} board tersimpan
                            </p>
                        </div>

                        <div className="grid gap-5">
                            {boards.map((board, index) => (
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
                                                {board.status}
                                            </span>
                                            <span className="brutal-chip bg-[#d6e4ff]">{board.competitionType}</span>
                                        </div>

                                        <div>
                                            <h3 className="display-font text-5xl leading-[0.92] text-[var(--tm-line)]">
                                                {board.title}
                                            </h3>
                                            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--tm-muted)]">
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
                                                    {formatDeadline(board.deadline)}
                                                </p>
                                            </div>
                                            <div className="brutal-panel-soft p-4">
                                                <p className="display-font text-xl leading-none">Update terakhir</p>
                                                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                                                    {formatUpdatedAt(board.updatedAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap content-start gap-3 lg:w-[220px] lg:justify-end">
                                        <Link href={`/dashboard/boards/${board.id}/edit`} className="brutal-button-secondary w-full">
                                            Edit
                                        </Link>
                                        <DeleteBoardButton id={board.id} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
