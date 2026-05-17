"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { saveCandidate, unsaveCandidate } from "@/app/(dashboard)/dashboard/actions";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import PendingSubmitButton from "@/components/shared/PendingSubmitButton";
import { dashboardMonthOptions } from "@/lib/types";
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

function buildSearchParamsFromQuery(currentQuery: Record<string, string | string[] | undefined>): URLSearchParams {
    const params = new URLSearchParams();

    Object.entries(currentQuery).forEach(([key, value]) => {
        const normalizedValue = firstParam(value)?.trim() ?? "";

        if (normalizedValue.length > 0) {
            params.set(key, normalizedValue);
        }
    });

    return params;
}

function getProfileInitials(profile: ProfileRecord): string {
    const source = profile.fullName ?? profile.username ?? "TM";
    return source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

function clearTimeoutRef(timeoutRef: React.MutableRefObject<number | null>) {
    if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
}

export default function CandidateDiscovery({
    candidates,
    competitionTypes,
    currentQuery,
    skills,
    viewerProfile,
}: CandidateDiscoveryProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [previewCandidateId, setPreviewCandidateId] = useState<string | null>(null);
    const q = firstParam(currentQuery.q) ?? "";
    const selectedSkill = firstParam(currentQuery.skills) ?? "";
    const selectedCompetition = firstParam(currentQuery.competition_types) ?? "";
    const selectedCampus = firstParam(currentQuery.campus) ?? "";
    const selectedMonth = firstParam(currentQuery.availability_month) ?? "";
    const selectedHours = firstParam(currentQuery.hours_per_week_min) ?? "";
    const sort = firstParam(currentQuery.sort) ?? "compatibility";
    const queryTimeoutRef = useRef<number | null>(null);
    const campusTimeoutRef = useRef<number | null>(null);
    const hoursTimeoutRef = useRef<number | null>(null);
    const normalizedSearchParams = useMemo(() => buildSearchParamsFromQuery(currentQuery), [currentQuery]);

    useEffect(() => {
        const currentSearch = searchParams.toString();
        const nextSearch = normalizedSearchParams.toString();

        if (currentSearch === nextSearch) {
            return;
        }

        router.replace(nextSearch.length > 0 ? `${pathname}?${nextSearch}` : pathname, { scroll: false });
    }, [normalizedSearchParams, pathname, router, searchParams]);

    useEffect(() => {
        return () => {
            clearTimeoutRef(queryTimeoutRef);
            clearTimeoutRef(campusTimeoutRef);
            clearTimeoutRef(hoursTimeoutRef);
        };
    }, []);

    function replaceSearchParams(nextEntries: Record<string, string>) {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(nextEntries).forEach(([key, value]) => {
            if (value.trim().length === 0) {
                params.delete(key);
                return;
            }
            params.set(key, value);
        });

        const nextQuery = params.toString();
        router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }

    function replaceSearchParamsDebounced(
        timeoutRef: React.MutableRefObject<number | null>,
        nextEntries: Record<string, string>,
    ) {
        clearTimeoutRef(timeoutRef);
        timeoutRef.current = window.setTimeout(() => {
            replaceSearchParams(nextEntries);
            timeoutRef.current = null;
        }, 250);
    }

    function resetFilters() {
        clearTimeoutRef(queryTimeoutRef);
        clearTimeoutRef(campusTimeoutRef);
        clearTimeoutRef(hoursTimeoutRef);

        replaceSearchParams({
            q: "",
            campus: "",
            skills: "",
            competition_types: "",
            availability_month: "",
            hours_per_week_min: "",
            sort: "compatibility",
        });
    }

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
            <div className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <input
                        key={`query-${q}`}
                        name="q"
                        defaultValue={q}
                        placeholder="Cari nama atau skill"
                        className="brutal-input"
                        list="skill-suggestions"
                        onChange={(event) => {
                            replaceSearchParamsDebounced(queryTimeoutRef, { q: event.target.value });
                        }}
                    />
                    <select
                        name="skills"
                        value={selectedSkill}
                        className="brutal-select"
                        onChange={(event) => replaceSearchParams({ skills: event.target.value })}
                    >
                        <option value="">Semua skill</option>
                        {skills.map((skill) => (
                            <option key={skill.id} value={skill.slug}>
                                {skill.label}
                            </option>
                        ))}
                    </select>
                    <select
                        name="competition_types"
                        value={selectedCompetition}
                        className="brutal-select"
                        onChange={(event) => replaceSearchParams({ competition_types: event.target.value })}
                    >
                        <option value="">Semua jenis lomba</option>
                        {competitionTypes.map((competitionType) => (
                            <option key={competitionType.id} value={competitionType.slug}>
                                {competitionType.label}
                            </option>
                        ))}
                    </select>
                    <input
                        key={`campus-${selectedCampus}`}
                        name="campus"
                        defaultValue={selectedCampus}
                        placeholder="Filter kampus"
                        className="brutal-input"
                        onChange={(event) => replaceSearchParamsDebounced(campusTimeoutRef, { campus: event.target.value })}
                    />
                    <select
                        name="availability_month"
                        value={selectedMonth}
                        className="brutal-select"
                        onChange={(event) => replaceSearchParams({ availability_month: event.target.value })}
                    >
                        <option value="">Semua bulan availability</option>
                        {dashboardMonthOptions.map((month) => (
                            <option key={month} value={month}>
                                {month.toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <input
                        key={`hours-${selectedHours}`}
                        name="hours_per_week_min"
                        defaultValue={selectedHours}
                        placeholder="Min jam / minggu"
                        className="brutal-input"
                        inputMode="numeric"
                        onChange={(event) =>
                            replaceSearchParamsDebounced(hoursTimeoutRef, { hours_per_week_min: event.target.value })
                        }
                    />
                    <select
                        name="sort"
                        value={sort}
                        className="brutal-select"
                        onChange={(event) => replaceSearchParams({ sort: event.target.value })}
                    >
                        <option value="compatibility">Sort: Compatibility</option>
                        <option value="rating">Sort: Rating</option>
                        <option value="availability">Sort: Availability</option>
                        <option value="latest">Sort: Terbaru</option>
                    </select>
                    <button type="button" className="brutal-button" onClick={resetFilters}>
                        Reset Filter
                    </button>
                </div>
                <datalist id="skill-suggestions">
                    {skills.map((skill) => (
                        <option key={skill.id} value={skill.label} />
                    ))}
                </datalist>
            </div>

            <div className="grid gap-5">
                {sortedCandidates.length > 0 ? (
                    sortedCandidates.map((candidate) => (
                        <article
                            key={candidate.profile.id}
                            className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-6 lg:grid-cols-[minmax(0,1fr)_240px]"
                        >
                            <div className="min-w-0 space-y-4">
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

                                <div className="flex gap-4">
                                    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[var(--tm-line)] bg-[var(--tm-paper)]">
                                        <div className="min-w-0">
                                            {candidate.profile.avatarUrl ? (
                                                <Image
                                                    src={candidate.profile.avatarUrl}
                                                    alt=""
                                                    width={64}
                                                    height={64}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="display-font text-2xl leading-none">
                                                    {getProfileInitials(candidate.profile) || "TM"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="display-font text-4xl leading-none">
                                            {candidate.profile.fullName ?? candidate.profile.username ?? "Kandidat"}
                                        </h3>
                                        <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                                            {candidate.profile.bio ?? "Bio belum tersedia."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {candidate.profile.skills.slice(0, 8).map((skill) => {
                                        const matched = viewerProfile?.skills.some(
                                            (viewerSkill) => viewerSkill.id === skill.id,
                                        );
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
                                            {candidate.testimonialAverage.toFixed(1)} dari {candidate.testimonialCount}{" "}
                                            testimoni
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
                                <Link href={`/dashboard/find-team/${candidate.profile.id}`} className="brutal-button-secondary">
                                    Detail kandidat
                                </Link>
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
                                        <PendingSubmitButton
                                            className="brutal-button-secondary w-full"
                                            idleLabel="Hapus simpan"
                                            pendingLabel="Menghapus..."
                                        />
                                    </form>
                                ) : (
                                    <form action={saveCandidate}>
                                        <input type="hidden" name="target_profile_id" value={candidate.profile.id} />
                                        <PendingSubmitButton
                                            className="brutal-button-secondary w-full"
                                            idleLabel="Simpan kandidat"
                                            pendingLabel="Menyimpan..."
                                        />
                                    </form>
                                )}
                                <Link
                                    href={`/dashboard/requests?target=${candidate.profile.id}`}
                                    className="brutal-button w-full"
                                >
                                    Kirim request
                                </Link>
                            </div>
                        </article>
                    ))
                ) : (
                    <DashboardEmptyState
                        actionHref="/dashboard/profile"
                        actionLabel="Rapikan profil"
                        title="Belum ada kandidat yang cocok"
                        body="Coba ubah filter, lengkapi skill profil, atau perluas preferensi lomba Anda untuk membuka lebih banyak kandidat."
                    />
                )}
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
