import Link from "next/link";
import BoardList from "@/components/dashboard/BoardList";
import DashboardLogoutButton from "@/components/dashboard/DashboardLogoutButton";
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
                        <div className="section-kicker w-fit !bg-[var(--tm-accent-2)] !text-[var(--tm-line)]">
                            Dashboard pribadi
                        </div>
                        <h1 className="mt-5 display-font text-[clamp(4rem,9vw,7rem)] leading-[0.88]">
                            KELOLA
                            <br />
                            BOARD
                            <br />
                            IDEMU
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f7eeda]">
                            Selamat datang, {user.email ?? "Pengguna TeamMatch"}. Semua ide lomba Anda tersimpan di sini agar
                            lebih mudah dipantau, diperbarui, dan dirapikan.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                            <p className="display-font text-3xl leading-none">Aksi cepat</p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link href="/dashboard/boards/new" className="brutal-button">
                                    Buat board ide
                                </Link>
                                <DashboardLogoutButton />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="brutal-panel bg-[var(--tm-accent-2)] p-5">
                                <p className="display-font text-2xl leading-none">Jumlah board</p>
                                <p className="mt-4 display-font text-5xl leading-none">{boards.length}</p>
                            </div>
                            <div className="brutal-panel p-5">
                                <p className="display-font text-2xl leading-none">Ruang kerja</p>
                                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--tm-muted)]">
                                    Privat dan tersusun
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {statusMessage && <div className="brutal-alert-success text-sm">{statusMessage}</div>}

                {boards.length === 0 ? (
                    <section className="brutal-stack">
                        <div className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-8 text-center md:p-10">
                            <div className="mx-auto section-kicker">Belum ada board</div>
                            <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">MULAI DARI IDE PERTAMA</h2>
                            <p className="mx-auto max-w-2xl text-base leading-8 text-[var(--tm-muted)]">
                                Setelah board pertama dibuat, Anda bisa memperbarui detail, menyesuaikan kebutuhan tim, atau
                                menghapusnya kapan saja dari dashboard ini.
                            </p>
                            <Link href="/dashboard/boards/new" className="brutal-button mx-auto">
                                Buat board pertama
                            </Link>
                        </div>
                    </section>
                ) : (
                    <BoardList boards={boards} />
                )}
            </div>
        </div>
    );
}
