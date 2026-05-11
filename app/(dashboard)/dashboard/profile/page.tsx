import { redirect } from "next/navigation";
import ProfileEditorForm from "@/components/dashboard/ProfileEditorForm";
import { getCurrentProfile } from "@/lib/auth";
import { getTaxonomies } from "@/lib/dashboard/data";
import { formatDashboardDateCompact } from "@/lib/shared/formatters";

export default async function ProfilePage() {
    const [profile, taxonomies] = await Promise.all([getCurrentProfile(), getTaxonomies()]);

    if (!profile) {
        redirect("/dashboard/profile/setup");
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="section-kicker">Profile</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">KELOLA IDENTITAS DAN PREFERENSI ANDA</h1>
            </div>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                    <p className="display-font text-3xl leading-none">Trust Snapshot</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="brutal-panel-soft p-4">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--tm-muted)]">Track record</p>
                            <p className="mt-2 display-font text-3xl leading-none">{profile.competitionsCount} lomba</p>
                        </div>
                        <div className="brutal-panel-soft p-4">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--tm-muted)]">Rating</p>
                            <p className="mt-2 display-font text-3xl leading-none">
                                {profile.testimonialAverage.toFixed(1)} / 5
                            </p>
                            <p className="mt-2 text-sm text-[var(--tm-muted)]">{profile.testimonialCount} testimoni</p>
                        </div>
                        <div className="brutal-panel-soft p-4">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--tm-muted)]">Best result</p>
                            <p className="mt-2 display-font text-3xl leading-none">{profile.bestResult ?? "Belum ada"}</p>
                        </div>
                    </div>
                </div>

                <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6">
                    <p className="display-font text-3xl leading-none">Histori Kompetisi</p>
                    {!profile.showCompetitionHistory ? (
                        <p className="mt-4 text-sm leading-7 text-[var(--tm-muted)]">
                            Riwayat lomba Anda tetap tersimpan, tetapi saat ini disembunyikan dari profil publik.
                        </p>
                    ) : profile.competitionHistory.length > 0 ? (
                        <div className="mt-4 grid gap-3">
                            {profile.competitionHistory.map((entry) => (
                                <div key={entry.id} className="brutal-panel-soft p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="display-font text-2xl leading-none">{entry.competitionName}</p>
                                            <p className="mt-2 text-sm text-[var(--tm-muted)]">{entry.roleName}</p>
                                        </div>
                                        <span className="brutal-chip bg-white">{entry.bestResult ?? "Hasil belum diisi"}</span>
                                    </div>
                                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                                        Dicatat {formatDashboardDateCompact(entry.recordedAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 text-sm leading-7 text-[var(--tm-muted)]">
                            Belum ada hasil lomba yang tercatat pada profil Anda.
                        </p>
                    )}
                </div>
            </section>

            <ProfileEditorForm profile={profile} skills={taxonomies.skills} competitionTypes={taxonomies.competitionTypes} />
        </div>
    );
}
