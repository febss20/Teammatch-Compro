import { notFound } from "next/navigation";
import CommitmentCountdown from "@/components/dashboard/CommitmentCountdown";
import CommitmentForm from "@/components/dashboard/CommitmentForm";
import DashboardRealtimeRefresh from "@/components/dashboard/DashboardRealtimeRefresh";
import TeamResourceForm from "@/components/dashboard/TeamResourceForm";
import TeamRenameForm from "@/components/dashboard/TeamRenameForm";
import TeamResultForm from "@/components/dashboard/TeamResultForm";
import TestimonialForm from "@/components/dashboard/TestimonialForm";
import { reopenExpiredSlot, sendCommitmentReminder } from "@/app/(dashboard)/dashboard/actions";
import { requireCompletedProfile } from "@/lib/auth";
import {
    getTeamActivityEvents,
    getTeamById,
    getTeamMembers,
    getTeamResources,
    getTeamResult,
    getTeamTestimonials,
} from "@/lib/dashboard/data";

function formatDateTime(date: string | null): string {
    if (!date) {
        return "Belum tersedia";
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

function formatDate(date: string | null): string {
    if (!date) {
        return "Belum tersedia";
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(date));
}

function formatActivityLabel(eventType: string): string {
    if (eventType === "application_accepted") {
        return "Pelamar diterima";
    }
    if (eventType === "commitment_confirmed") {
        return "Komitmen dikonfirmasi";
    }
    if (eventType === "commitment_reminder_sent") {
        return "Reminder dikirim";
    }
    if (eventType === "slot_reopened") {
        return "Slot dibuka ulang";
    }
    if (eventType === "team_renamed") {
        return "Nama tim diperbarui";
    }
    if (eventType === "resource_added") {
        return "Resource baru ditambahkan";
    }
    if (eventType === "competition_result_recorded") {
        return "Hasil lomba dicatat";
    }

    return eventType;
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = await requireCompletedProfile();
    const { id } = await params;
    const [team, members, teamResult, testimonials, resources, activityEvents] = await Promise.all([
        getTeamById(id),
        getTeamMembers(id),
        getTeamResult(id),
        getTeamTestimonials(id),
        getTeamResources(id),
        getTeamActivityEvents(id),
    ]);

    if (!team) {
        notFound();
    }

    const canAccess = members.some((member) => member.profileId === user.id) || team.creatorId === user.id;
    if (!canAccess) {
        notFound();
    }

    const isCreator = team.creatorId === user.id;
    const confirmedCount = members.filter((member) => member.confirmationStatus === "confirmed").length;
    const pendingCount = members.filter((member) => member.confirmationStatus === "pending").length;
    const expiredCount = members.filter((member) => member.confirmationStatus === "expired").length;
    const progressWidth = members.length > 0 ? `${Math.round((confirmedCount / members.length) * 100)}%` : "0%";
    const testimonialsByAuthorTarget = new Map(
        testimonials.map((testimonial) => [`${testimonial.authorId}:${testimonial.targetProfileId}`, testimonial] as const),
    );

    return (
        <div className="space-y-6">
            <DashboardRealtimeRefresh
                scopeKey={`team-${team.id}`}
                subscriptions={[
                    {
                        event: "*",
                        filter: `team_id=eq.${team.id}`,
                        table: "team_members",
                    },
                    {
                        event: "*",
                        filter: `team_id=eq.${team.id}`,
                        table: "team_resources",
                    },
                    {
                        event: "*",
                        filter: `team_id=eq.${team.id}`,
                        table: "team_results",
                    },
                    {
                        event: "*",
                        filter: `team_id=eq.${team.id}`,
                        table: "testimonials",
                    },
                    {
                        event: "*",
                        filter: `team_id=eq.${team.id}`,
                        table: "team_activity_events",
                    },
                ]}
            />
            <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="brutal-panel bg-[var(--tm-line)] p-6 text-[var(--tm-paper-strong)] md:p-8">
                    <div className="section-kicker w-fit !bg-[var(--tm-accent-2)] !text-[var(--tm-line)]">Team workspace</div>
                    <h1 className="mt-5 display-font text-[clamp(4rem,9vw,7rem)] leading-[0.88]">{team.name}</h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f7eeda]">
                        Kelola komitmen anggota, catat hasil lomba, dan kumpulkan testimoni terverifikasi di satu halaman tim.
                    </p>
                </div>

                <div className="grid gap-4">
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Status Tim</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="brutal-panel-soft p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-[var(--tm-muted)]">Confirmed</p>
                                <p className="mt-2 display-font text-4xl leading-none">{confirmedCount}</p>
                            </div>
                            <div className="brutal-panel-soft p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-[var(--tm-muted)]">Pending</p>
                                <p className="mt-2 display-font text-4xl leading-none">{pendingCount}</p>
                            </div>
                            <div className="brutal-panel-soft p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-[var(--tm-muted)]">Expired</p>
                                <p className="mt-2 display-font text-4xl leading-none">{expiredCount}</p>
                            </div>
                        </div>
                        <div className="mt-5 grid gap-2">
                            <div className="h-4 overflow-hidden border-[3px] border-[var(--tm-line)] bg-white">
                                <div className="h-full bg-[var(--tm-accent)]" style={{ width: progressWidth }} />
                            </div>
                            <p className="text-sm leading-7 text-[var(--tm-muted)]">
                                {confirmedCount} dari {members.length} anggota sudah konfirmasi komitmen.
                            </p>
                        </div>
                    </div>

                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Info Lomba</p>
                        <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                            {team.competitionName ?? "Nama lomba belum ditetapkan"}
                        </p>
                        <p className="text-sm uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                            Deadline: {formatDate(team.deadline)}
                        </p>
                    </div>

                    {isCreator && <TeamRenameForm teamId={team.id} teamName={team.name} />}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-5">
                    <div className="space-y-3">
                        <div className="section-kicker">Commitment</div>
                        <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">STATUS ANGGOTA DAN SLOT TIM</h2>
                    </div>

                    <div className="grid gap-5">
                        {members.map((member) => {
                            const isSelf = member.profileId === user.id;
                            const isExpired = member.confirmationStatus === "expired";

                            return (
                                <article key={member.id} className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-5">
                                    <div className="flex flex-wrap gap-3">
                                        <span className="brutal-chip bg-[var(--tm-accent-2)]">{member.roleName}</span>
                                        <span
                                            className={`brutal-chip ${
                                                member.confirmationStatus === "confirmed"
                                                    ? "brutal-status-open"
                                                    : member.confirmationStatus === "expired"
                                                      ? "brutal-status-closed"
                                                      : "bg-white"
                                            }`}
                                        >
                                            {member.confirmationStatus}
                                        </span>
                                        <CommitmentCountdown deadlineAt={member.commitmentDeadlineAt} />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                                        <div className="space-y-3">
                                            <p className="display-font text-3xl leading-none">
                                                {member.fullName ?? "Anggota TeamMatch"}
                                            </p>
                                            <div className="grid gap-2 text-sm leading-7 text-[var(--tm-muted)]">
                                                <p>Deadline komitmen: {formatDateTime(member.commitmentDeadlineAt)}</p>
                                                <p>Last reminder: {formatDateTime(member.commitmentLastRemindedAt)}</p>
                                                <p>
                                                    Jam komitmen saat ini:{" "}
                                                    {member.commitmentHoursPerWeek
                                                        ? `${member.commitmentHoursPerWeek} jam / minggu`
                                                        : "Belum diisi"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-3">
                                            {isSelf && member.confirmationStatus !== "confirmed" && member.commitmentId && (
                                                <CommitmentForm
                                                    defaultHours={member.commitmentHoursPerWeek ?? 5}
                                                    teamMemberId={member.id}
                                                />
                                            )}

                                            {isSelf && member.confirmationStatus !== "confirmed" && !member.commitmentId && (
                                                <div className="brutal-alert-error text-sm">
                                                    Record komitmen Anda belum tersambung ke tim aktif ini. Ini biasanya berasal
                                                    dari data team lama yang belum sinkron. Creator perlu menjalankan
                                                    sinkronisasi data team sebelum Anda bisa mengonfirmasi komitmen.
                                                </div>
                                            )}

                                            {isCreator &&
                                                !isSelf &&
                                                member.confirmationStatus !== "confirmed" &&
                                                member.commitmentId && (
                                                    <div className="grid gap-3">
                                                        <form action={sendCommitmentReminder}>
                                                            <input type="hidden" name="team_member_id" value={member.id} />
                                                            <button type="submit" className="brutal-button-secondary w-full">
                                                                Kirim reminder
                                                            </button>
                                                        </form>

                                                        {isExpired && (
                                                            <form action={reopenExpiredSlot}>
                                                                <input type="hidden" name="team_member_id" value={member.id} />
                                                                <button type="submit" className="brutal-button-danger w-full">
                                                                    Buka ulang slot
                                                                </button>
                                                            </form>
                                                        )}
                                                    </div>
                                                )}

                                            {isCreator &&
                                                !isSelf &&
                                                member.confirmationStatus !== "confirmed" &&
                                                !member.commitmentId && (
                                                    <div className="brutal-alert-error text-sm">
                                                        Anggota ini sudah masuk tim tetapi record komitmennya belum tersambung.
                                                        Sinkronkan data team lama terlebih dahulu sebelum mengirim reminder atau
                                                        membuka ulang slot.
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>

                <aside className="grid gap-4">
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Resource Tim</p>
                        <div className="mt-4 grid gap-3">
                            {resources.length > 0 ? (
                                resources.map((resource) => (
                                    <a
                                        key={resource.id}
                                        href={resource.url ?? "#"}
                                        target={resource.url ? "_blank" : undefined}
                                        rel={resource.url ? "noreferrer" : undefined}
                                        className="brutal-button-secondary"
                                    >
                                        {resource.label} / {resource.resourceType}
                                    </a>
                                ))
                            ) : (
                                <div className="brutal-panel-soft p-4">
                                    <p className="text-sm leading-7 text-[var(--tm-muted)]">
                                        Belum ada resource aktif. Tambahkan link kerja tim agar workspace ini tidak kosong.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {isCreator && <TeamResourceForm teamId={team.id} />}

                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Hasil Lomba</p>
                        {teamResult ? (
                            <div className="mt-4 grid gap-3">
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-2xl leading-none">{teamResult.resultSummary}</p>
                                    <p className="mt-2 text-sm leading-7 text-[var(--tm-muted)]">
                                        Dicatat pada {formatDate(teamResult.competitionEndedAt)}
                                    </p>
                                </div>
                            </div>
                        ) : isCreator ? (
                            <div className="mt-4">
                                <TeamResultForm teamId={team.id} />
                            </div>
                        ) : (
                            <p className="mt-4 text-sm leading-7 text-[var(--tm-muted)]">
                                Creator belum mencatat hasil lomba untuk tim ini.
                            </p>
                        )}
                    </div>

                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Aktivitas Terkini</p>
                        <div className="mt-4 grid gap-3">
                            {activityEvents.length > 0 ? (
                                activityEvents.map((event) => (
                                    <div key={event.id} className="brutal-panel-soft p-4">
                                        <p className="display-font text-xl leading-none">
                                            {formatActivityLabel(event.eventType)}
                                        </p>
                                        <p className="mt-2 text-sm leading-7 text-[var(--tm-muted)]">
                                            {event.actorName ?? "Sistem"} / {formatDateTime(event.createdAt)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm leading-7 text-[var(--tm-muted)]">
                                    Aktivitas tim akan muncul di sini saat anggota mulai bergerak.
                                </p>
                            )}
                        </div>
                    </div>
                </aside>
            </section>

            <section className="space-y-5">
                <div className="space-y-3">
                    <div className="section-kicker">Testimonial</div>
                    <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">
                        BANGUN JEJAK KERJA TIM YANG TERVERIFIKASI
                    </h2>
                </div>

                {teamResult ? (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {members
                            .filter((member) => member.profileId !== user.id)
                            .map((member) => {
                                const existingTestimonial =
                                    testimonialsByAuthorTarget.get(`${user.id}:${member.profileId}`) ?? null;

                                return (
                                    <article
                                        key={member.id}
                                        className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-5"
                                    >
                                        <div className="flex flex-wrap gap-3">
                                            <span className="brutal-chip bg-[var(--tm-accent-2)]">{member.roleName}</span>
                                            {existingTestimonial?.lockedAt && (
                                                <span className="brutal-chip bg-[#d6e4ff]">
                                                    Terkunci {formatDate(existingTestimonial.lockedAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="display-font text-3xl leading-none">
                                                {member.fullName ?? "Anggota tim"}
                                            </p>
                                            <p className="mt-3 text-sm leading-7 text-[var(--tm-muted)]">
                                                Beri rating dan catatan singkat tentang kualitas kolaborasi anggota ini.
                                            </p>
                                        </div>
                                        <TestimonialForm
                                            teamId={team.id}
                                            targetProfileId={member.profileId}
                                            testimonialId={existingTestimonial?.id}
                                            defaultRating={existingTestimonial?.rating}
                                            defaultBody={existingTestimonial?.body}
                                        />
                                    </article>
                                );
                            })}
                    </div>
                ) : (
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-8">
                        <p className="display-font text-4xl leading-none">Testimoni terbuka setelah hasil lomba dicatat</p>
                        <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                            Creator perlu mencatat hasil akhir lomba lebih dulu agar testimonial dan portfolio anggota bisa
                            diproses.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
