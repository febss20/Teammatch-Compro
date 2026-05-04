import Link from "next/link";
import DashboardLogoutButton from "@/components/DashboardLogoutButton";
import DeleteBoardButton from "@/components/DeleteBoardButton";
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
        <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#effcff_100%)] px-4 py-12">
            <div className="mx-auto max-w-7xl space-y-8">
                <section className="relative overflow-hidden rounded-[2.5rem] border border-cyan-100 bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.18),_transparent_28%),linear-gradient(135deg,_#ffffff,_#ecfeff)] p-8 shadow-[0_32px_100px_rgba(6,182,212,0.12)] md:p-10">
                    <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-teal-200/40 blur-3xl" />
                    <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-4">
                            <div className="inline-flex rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
                                Personal Dashboard
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
                                    Selamat datang, {user.email ?? "Pengguna TeamMatch"}.
                                </h1>
                                <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">
                                    Kelola seluruh board ide lomba Anda dari satu dashboard. Setiap board di sini memiliki owner
                                    yang jelas, status yang dapat diperbarui, dan jejak perubahan yang lebih siap dikembangkan.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/dashboard/boards/new"
                                className="inline-flex items-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                            >
                                Buat Board Ide
                            </Link>
                            <DashboardLogoutButton />
                        </div>
                    </div>
                </section>

                {statusMessage && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                        {statusMessage}
                    </div>
                )}

                {boards.length === 0 ? (
                    <section className="rounded-[2rem] border border-dashed border-cyan-200 bg-white/90 p-10 text-center shadow-lg">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Empty State</p>
                        <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-900">
                            Belum ada board ide yang tersimpan.
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600">
                            Mulai dari satu ide yang tajam. Setelah board pertama dibuat, Anda bisa mengedit, menutup, atau
                            menghapusnya langsung dari dashboard ini.
                        </p>
                        <Link
                            href="/dashboard/boards/new"
                            className="mt-8 inline-flex items-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                        >
                            Buat Board Pertama
                        </Link>
                    </section>
                ) : (
                    <section className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Board Anda</p>
                                <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
                                    Kelola ide yang sedang aktif.
                                </h2>
                            </div>
                            <p className="text-sm text-gray-500">{boards.length} board tersimpan</p>
                        </div>

                        <div className="grid gap-5">
                            {boards.map((board) => (
                                <article
                                    key={board.id}
                                    className="rounded-[1.9rem] border border-white/80 bg-white/92 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
                                >
                                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                                                    {board.status}
                                                </span>
                                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                                    {board.competitionType}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight text-gray-900">
                                                    {board.title}
                                                </h3>
                                                <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                                                    {board.description}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {board.requiredSkills.map((skill) => (
                                                    <span
                                                        key={`${board.id}-${skill}`}
                                                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                                                <p>Deadline: {formatDeadline(board.deadline)}</p>
                                                <p>Update terakhir: {formatUpdatedAt(board.updatedAt)}</p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-3">
                                            <Link
                                                href={`/dashboard/boards/${board.id}/edit`}
                                                className="rounded-full border border-cyan-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 transition-colors hover:border-cyan-400 hover:text-cyan-800"
                                            >
                                                Edit
                                            </Link>
                                            <DeleteBoardButton id={board.id} />
                                        </div>
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
