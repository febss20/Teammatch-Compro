import Link from "next/link";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import { requireCompletedProfile } from "@/lib/auth";
import { getTeamsForUser } from "@/lib/dashboard/data";
import { formatDashboardDate } from "@/lib/shared/formatters";

function resolveCommitmentStatusLabel(value: "confirmed" | "expired" | "pending" | null): string {
    if (value === "confirmed") {
        return "Komitmen Anda: confirmed";
    }
    if (value === "expired") {
        return "Komitmen Anda: expired";
    }
    if (value === "pending") {
        return "Komitmen Anda: pending";
    }

    return "Anda mengakses sebagai creator";
}

export default async function TeamsIndexPage() {
    const { user } = await requireCompletedProfile();
    const teams = await getTeamsForUser(user.id);

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="section-kicker">Teams</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">SEMUA TEAM YANG ANDA MILIKI ATAU IKUTI</h1>
                <p className="max-w-3xl text-base leading-8 text-[var(--tm-muted)]">
                    Halaman ini menjadi jalur utama untuk membuka team tanpa bergantung pada notifikasi acceptance.
                </p>
            </div>

            {teams.length > 0 ? (
                <div className="grid gap-5">
                    {teams.map((team) => (
                        <article
                            key={team.id}
                            className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-6 lg:grid-cols-[1fr_auto]"
                        >
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <span className="brutal-chip bg-[var(--tm-accent-2)]">
                                        {team.confirmedMembersCount}/{team.membersCount} confirmed
                                    </span>
                                    <span className="brutal-chip bg-white">
                                        {resolveCommitmentStatusLabel(team.selfCommitmentStatus)}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="display-font text-4xl leading-none">{team.name}</h2>
                                    <p className="mt-3 text-sm uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                                        {team.competitionName ?? "Kompetisi belum dinamai"} / deadline{" "}
                                        {formatDashboardDate(team.deadline)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Link href={`/dashboard/teams/${team.id}`} className="brutal-button">
                                    Buka team
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <DashboardEmptyState
                    actionHref="/dashboard/boards"
                    actionLabel="Jelajahi board"
                    body="Belum ada team yang Anda buat atau ikuti. Setelah applicant diterima atau Anda diterima ke board orang lain, team akan muncul di sini."
                    title="Belum ada team aktif"
                />
            )}
        </div>
    );
}
