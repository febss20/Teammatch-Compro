import Link from "next/link";
import BoardList from "@/components/dashboard/BoardList";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DashboardLogoutButton from "@/components/dashboard/DashboardLogoutButton";
import { requireCompletedProfile } from "@/lib/auth";
import { getDashboardSnapshot, getOwnBoards } from "@/lib/dashboard/data";
import { sanitizeNotificationLinkPath } from "@/lib/notifications/contracts";

function getStatusMessage(searchParams: { profile?: string }): string | null {
    if (searchParams.profile === "completed") {
        return "Profil Anda lengkap dan siap dipakai untuk matching.";
    }
    return null;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ profile?: string }> }) {
    const { user, profile } = await requireCompletedProfile();
    const [snapshot, boards, resolvedSearchParams] = await Promise.all([
        getDashboardSnapshot(user.id),
        getOwnBoards(user.id),
        searchParams,
    ]);

    const statusMessage = getStatusMessage(resolvedSearchParams);

    return (
        <div className="space-y-8">
            <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="brutal-panel bg-[var(--tm-line)] p-6 text-[var(--tm-paper-strong)] md:p-8">
                    <div className="section-kicker w-fit !bg-[var(--tm-accent-2)] !text-[var(--tm-line)]">Dashboard home</div>
                    <h1 className="mt-5 display-font text-[clamp(4rem,9vw,7rem)] leading-[0.88]">
                        MATCH
                        <br />
                        PLATFORM
                        <br />
                        READY
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f7eeda]">
                        Selamat datang, {profile.fullName ?? user.email ?? "Pengguna TeamMatch"}. Profil Anda siap dipakai untuk
                        mencari rekan, mempublikasikan board, dan mengelola request kolaborasi.
                    </p>
                </div>

                <div className="grid gap-4">
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                        <p className="display-font text-3xl leading-none">Aksi cepat</p>
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            <Link href="/dashboard/find-team" className="brutal-button">
                                Find Team
                            </Link>
                            <Link href="/dashboard/boards" className="brutal-button-secondary">
                                Explore Boards
                            </Link>
                            <Link href="/dashboard/teams" className="brutal-button-secondary">
                                My Teams
                            </Link>
                            <Link href="/dashboard/profile" className="brutal-button-secondary">
                                Edit Profile
                            </Link>
                            <DashboardLogoutButton />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="brutal-panel bg-[var(--tm-accent-2)] p-5">
                            <p className="display-font text-2xl leading-none">Profile</p>
                            <p className="mt-4 display-font text-5xl leading-none">{profile.completionScore}%</p>
                        </div>
                        <div className="brutal-panel p-5">
                            <p className="display-font text-2xl leading-none">Boards</p>
                            <p className="mt-4 display-font text-5xl leading-none">{snapshot.boardsCount}</p>
                        </div>
                        <div className="brutal-panel bg-[#d6e4ff] p-5">
                            <p className="display-font text-2xl leading-none">Requests</p>
                            <p className="mt-4 display-font text-5xl leading-none">{snapshot.outgoingRequestCount}</p>
                        </div>
                    </div>
                </div>
            </section>

            {statusMessage && <div className="brutal-alert-success text-sm">{statusMessage}</div>}

            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-5">
                    <div className="flex items-end justify-between gap-4">
                        <div className="space-y-3">
                            <div className="section-kicker">Boards terbaru</div>
                            <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">IDE YANG SEDANG ANDA JALANKAN</h2>
                        </div>
                        <Link href="/dashboard/boards/new" className="brutal-button-secondary">
                            Buat board baru
                        </Link>
                    </div>
                    {boards.length > 0 ? (
                        <BoardList boards={boards.slice(0, 3)} />
                    ) : (
                        <DashboardEmptyState
                            actionHref="/dashboard/boards/new"
                            actionLabel="Buat board baru"
                            title="Belum ada board aktif"
                            body="Mulai dengan menerbitkan board publik pertama Anda agar kandidat lain bisa melamar."
                        />
                    )}
                </div>

                <div className="grid gap-4">
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Signal terbaru</p>
                        <p className="mt-3 text-sm uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                            Pelamar masuk: {snapshot.incomingApplicationCount}
                        </p>
                    </div>
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Notifikasi terbaru</p>
                        <p className="mt-3 text-sm uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                            Unread: {snapshot.unreadNotificationsCount}
                        </p>
                        <div className="mt-4 grid gap-3">
                            {snapshot.notifications.length > 0 ? (
                                snapshot.notifications.map((notification) => {
                                    const safeLinkPath = sanitizeNotificationLinkPath(notification.linkPath);

                                    if (!safeLinkPath) {
                                        return (
                                            <div key={notification.id} className="brutal-panel-soft p-4">
                                                <p className="display-font text-xl leading-none">{notification.title}</p>
                                                <p className="mt-2 text-sm leading-7 text-[var(--tm-muted)]">
                                                    {notification.body}
                                                </p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link key={notification.id} href={safeLinkPath} className="brutal-panel-soft block p-4">
                                            <p className="display-font text-xl leading-none">{notification.title}</p>
                                            <p className="mt-2 text-sm leading-7 text-[var(--tm-muted)]">{notification.body}</p>
                                        </Link>
                                    );
                                })
                            ) : (
                                <p className="text-sm leading-7 text-[var(--tm-muted)]">Belum ada notifikasi penting.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
