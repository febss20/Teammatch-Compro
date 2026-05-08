import { notFound } from "next/navigation";
import JoinRequestComposer from "@/components/dashboard/JoinRequestComposer";
import { requireCompletedProfile } from "@/lib/auth";
import { getCandidateById } from "@/lib/dashboard/data";

function formatStatsLabel(value: number, singularLabel: string, pluralLabel: string): string {
    return `${value} ${value === 1 ? singularLabel : pluralLabel}`;
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, profile } = await requireCompletedProfile();
    const { id } = await params;
    const candidate = await getCandidateById(user.id, id);

    if (!candidate) {
        notFound();
    }

    const viewerSkillIds = new Set(profile.skills.map((skill) => skill.id));
    const matchedSkills = candidate.profile.skills.filter((skill) => viewerSkillIds.has(skill.id));

    return (
        <div className="space-y-6">
            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="brutal-panel bg-[var(--tm-line)] p-6 text-[var(--tm-paper-strong)] md:p-8">
                    <div className="section-kicker w-fit !bg-[var(--tm-accent-2)] !text-[var(--tm-line)]">
                        Candidate dossier
                    </div>
                    <h1 className="mt-5 display-font text-[clamp(3.6rem,8vw,6.6rem)] leading-[0.9]">
                        {candidate.profile.fullName ?? candidate.profile.username ?? "Kandidat TeamMatch"}
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f7eeda] break-words">
                        {candidate.profile.bio ?? "Kandidat ini belum menuliskan bio singkat."}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <span className="brutal-chip bg-[var(--tm-accent)] text-[var(--tm-line)]">
                            {candidate.compatibilityScore}% compatibility
                        </span>
                        <span className="brutal-chip bg-white text-[var(--tm-line)]">
                            {candidate.profile.campusName ?? "Kampus belum diisi"}
                        </span>
                        <span className="brutal-chip bg-[#d6e4ff] text-[var(--tm-line)]">
                            {candidate.profile.hoursPerWeek ?? 0} jam / minggu
                        </span>
                    </div>
                </div>

                <JoinRequestComposer targetProfileId={candidate.profile.id} />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                        <p className="display-font text-3xl leading-none">Skill Utama</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {candidate.profile.skills.length > 0 ? (
                                candidate.profile.skills.slice(0, 8).map((skill) => (
                                    <span key={skill.id} className="brutal-chip bg-[var(--tm-accent)]">
                                        {skill.label}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-[var(--tm-muted)]">Belum ada skill yang dipublikasikan.</span>
                            )}
                        </div>
                    </div>

                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                        <p className="display-font text-3xl leading-none">Minat Kompetisi</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {candidate.profile.competitionTypes.length > 0 ? (
                                candidate.profile.competitionTypes.map((competitionType) => (
                                    <span key={competitionType.id} className="brutal-chip bg-white">
                                        {competitionType.label}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-[var(--tm-muted)]">Belum ada preferensi lomba yang dipilih.</span>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="grid gap-4">
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Trust Snapshot</p>
                        <div className="mt-4 grid gap-3">
                            <div className="brutal-panel-soft p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-[var(--tm-muted)]">Track record</p>
                                <p className="mt-2 display-font text-3xl leading-none">
                                    {formatStatsLabel(candidate.competitionsCount, "lomba", "lomba")}
                                </p>
                            </div>
                            <div className="brutal-panel-soft p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-[var(--tm-muted)]">Rating</p>
                                <p className="mt-2 display-font text-3xl leading-none">
                                    {candidate.testimonialAverage.toFixed(1)} / 5
                                </p>
                                <p className="mt-2 text-sm leading-7 text-[var(--tm-muted)]">
                                    {formatStatsLabel(candidate.testimonialCount, "testimoni", "testimoni")}
                                </p>
                            </div>
                            <div className="brutal-panel-soft p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-[var(--tm-muted)]">Best result</p>
                                <p className="mt-2 display-font text-3xl leading-none">{candidate.bestResult ?? "Belum ada"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                        <p className="display-font text-3xl leading-none">Availability</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {candidate.profile.availableMonths.length > 0 ? (
                                candidate.profile.availableMonths.map((month) => (
                                    <span key={month} className="brutal-chip bg-white">
                                        {month.toUpperCase()}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-[var(--tm-muted)]">Bulan aktif belum dipublikasikan.</span>
                            )}
                        </div>
                    </div>
                </aside>
            </section>

            {matchedSkills.length > 0 && (
                <section className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                    <p className="display-font text-3xl leading-none">Skill yang Cocok dengan Profil Publik Kandidat</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {matchedSkills.map((skill) => (
                            <span key={skill.id} className="brutal-chip bg-[#d6e4ff]">
                                {skill.label}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
