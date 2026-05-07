"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { saveCandidate, unsaveCandidate } from "@/app/(dashboard)/dashboard/actions";
import type { CandidateRecord, CompetitionTypeRecord, ProfileRecord, SkillOption } from "@/lib/types";

interface CandidateDiscoveryProps {
    candidates: CandidateRecord[];
    competitionTypes: CompetitionTypeRecord[];
    currentQuery: Record<string, string | string[] | undefined>;
    skills: SkillOption[];
    viewerProfile: ProfileRecord | null;
}

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

export default function CandidateDiscovery({
    candidates,
    competitionTypes,
    currentQuery,
    skills,
    viewerProfile,
}: CandidateDiscoveryProps) {
    const [previewCandidateId, setPreviewCandidateId] = useState<string | null>(null);
    const q = firstParam(currentQuery.q) ?? "";
    const selectedSkill = firstParam(currentQuery.skills) ?? "";
    const selectedCompetition = firstParam(currentQuery.competition_types) ?? "";
    const selectedCampus = firstParam(currentQuery.campus) ?? "";
    const selectedMonth = firstParam(currentQuery.availability_month) ?? "";
    const selectedHours = firstParam(currentQuery.hours_per_week_min) ?? "";
    const sort = firstParam(currentQuery.sort) ?? "compatibility";

    const sortedCandidates = useMemo(() => {
        const working = [...candidates];
        if (sort === "latest") {
            return working.sort((a, b) => b.profile.id.localeCompare(a.profile.id));
        }
        if (sort === "rating") {
            return working.sort((a, b) => b.testimonialAverage - a.testimonialAverage);
        }
        if (sort === "availability") {
            return working.sort((a, b) => (b.profile.hoursPerWeek ?? 0) - (a.profile.hoursPerWeek ?? 0));
        }
        return working.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    }, [candidates, sort]);

    const previewCandidate = sortedCandidates.find((candidate) => candidate.profile.id === previewCandidateId) ?? null;

    return (
        <div className="space-y-6">
            <form action="/dashboard/find-team" className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Cari nama atau skill"
                        className="brutal-input"
                        list="skill-suggestions"
                    />
                    <select name="skills" defaultValue={selectedSkill} className="brutal-select">
                        <option value="">Semua skill</option>
                        {skills.map((skill) => (
                            <option key={skill.id} value={skill.slug}>
                                {skill.label}
                            </option>
                        ))}
                    </select>
                    <select name="competition_types" defaultValue={selectedCompetition} className="brutal-select">
                        <option value="">Semua jenis lomba</option>
                        {competitionTypes.map((competitionType) => (
                            <option key={competitionType.id} value={competitionType.slug}>
                                {competitionType.label}
                            </option>
                        ))}
                    </select>
                    <input name="campus" defaultValue={selectedCampus} placeholder="Filter kampus" className="brutal-input" />
                    <input
                        name="availability_month"
                        defaultValue={selectedMonth}
                        placeholder="Bulan, contoh: jul"
                        className="brutal-input"
                    />
                    <input
                        name="hours_per_week_min"
                        defaultValue={selectedHours}
                        placeholder="Min jam / minggu"
                        className="brutal-input"
                    />
                    <select name="sort" defaultValue={sort} className="brutal-select">
                        <option value="compatibility">Sort: Compatibility</option>
                        <option value="rating">Sort: Rating</option>
                        <option value="availability">Sort: Availability</option>
                        <option value="latest">Sort: Terbaru</option>
                    </select>
                    <button type="submit" className="brutal-button">
                        Terapkan Filter
                    </button>
                </div>
                <datalist id="skill-suggestions">
                    {skills.map((skill) => (
                        <option key={skill.id} value={skill.label} />
                    ))}
                </datalist>
            </form>

            <div className="grid gap-5">
                {sortedCandidates.map((candidate) => (
                    <article
                        key={candidate.profile.id}
                        className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-6 lg:grid-cols-[1fr_auto]"
                    >
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <span className="brutal-chip bg-[var(--tm-accent-2)]">
                                    {candidate.compatibilityScore}% match
                                </span>
                                <span className="brutal-chip bg-white">
                                    {candidate.profile.campusName ?? "Kampus belum diisi"}
                                </span>
                                <span className="brutal-chip bg-[#d6e4ff]">
                                    {candidate.profile.visibility === "public" ? "Profil publik" : "Privat"}
                                </span>
                            </div>

                            <div>
                                <h3 className="display-font text-4xl leading-none">
                                    {candidate.profile.fullName ?? candidate.profile.username ?? "Kandidat"}
                                </h3>
                                <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                                    {candidate.profile.bio ?? "Bio belum tersedia."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {candidate.profile.skills.slice(0, 8).map((skill) => {
                                    const matched = viewerProfile?.skills.some((viewerSkill) => viewerSkill.id === skill.id);
                                    return (
                                        <span
                                            key={skill.id}
                                            className={`brutal-chip ${matched ? "bg-[var(--tm-accent)]" : "bg-white"}`}
                                        >
                                            {skill.label}
                                        </span>
                                    );
                                })}
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-xl">Lomba</p>
                                    <p className="mt-2 text-sm text-[var(--tm-muted)]">
                                        {candidate.competitionsCount} partisipasi
                                    </p>
                                </div>
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-xl">Rating</p>
                                    <p className="mt-2 text-sm text-[var(--tm-muted)]">
                                        {candidate.testimonialAverage.toFixed(1)} dari {candidate.testimonialCount} testimoni
                                    </p>
                                </div>
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-xl">Availability</p>
                                    <p className="mt-2 text-sm text-[var(--tm-muted)]">
                                        {candidate.profile.hoursPerWeek ?? 0} jam / minggu
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 lg:w-[240px]">
                            <button
                                type="button"
                                onClick={() => setPreviewCandidateId(candidate.profile.id)}
                                className="brutal-button-secondary"
                            >
                                Preview profil
                            </button>
                            {candidate.savedByViewer ? (
                                <form action={unsaveCandidate}>
                                    <input type="hidden" name="target_profile_id" value={candidate.profile.id} />
                                    <button type="submit" className="brutal-button-secondary w-full">
                                        Hapus simpan
                                    </button>
                                </form>
                            ) : (
                                <form action={saveCandidate}>
                                    <input type="hidden" name="target_profile_id" value={candidate.profile.id} />
                                    <button type="submit" className="brutal-button-secondary w-full">
                                        Simpan kandidat
                                    </button>
                                </form>
                            )}
                            <Link href={`/dashboard/requests?target=${candidate.profile.id}`} className="brutal-button w-full">
                                Kirim request
                            </Link>
                        </div>
                    </article>
                ))}
            </div>

            {previewCandidate && (
                <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl brutal-panel bg-[var(--tm-paper-strong)] p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="section-kicker w-fit">Mini Preview</p>
                            <h4 className="mt-4 display-font text-4xl leading-none">
                                {previewCandidate.profile.fullName ?? previewCandidate.profile.username ?? "Kandidat"}
                            </h4>
                            <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                                {previewCandidate.profile.bio}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {previewCandidate.profile.competitionTypes.map((type) => (
                                    <span key={type.id} className="brutal-chip bg-white">
                                        {type.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button type="button" onClick={() => setPreviewCandidateId(null)} className="brutal-button-secondary">
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
