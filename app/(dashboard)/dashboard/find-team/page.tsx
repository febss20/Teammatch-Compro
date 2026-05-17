import { Suspense } from "react";
import CandidateDiscovery from "@/components/dashboard/CandidateDiscovery";
import { requireCompletedProfile } from "@/lib/auth";
import { getCandidateDiscovery, getTaxonomies } from "@/lib/dashboard/data";
import { dashboardMonthOptions } from "@/lib/types";

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function normalizeSearchText(value: string | string[] | undefined): string {
    return (firstParam(value) ?? "").trim();
}

function normalizeCandidateSort(value: string | string[] | undefined): string {
    const sortValue = firstParam(value);

    if (sortValue === "availability" || sortValue === "latest" || sortValue === "rating") {
        return sortValue;
    }

    return "compatibility";
}

function normalizeHoursPerWeekMin(value: string | string[] | undefined): string {
    const parsedValue = Number.parseInt((firstParam(value) ?? "").trim(), 10);

    if (!Number.isFinite(parsedValue) || parsedValue < 1) {
        return "";
    }

    return String(Math.min(parsedValue, 80));
}

function CandidateDiscoveryFallback() {
    return (
        <div className="space-y-6" aria-busy="true" aria-live="polite">
            <div className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="h-14 animate-poster bg-[var(--tm-paper-muted)]" />
                    ))}
                </div>
            </div>
            <div className="grid gap-5">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="brutal-panel h-72 animate-poster bg-[var(--tm-paper-muted)]" />
                ))}
            </div>
        </div>
    );
}

export default async function FindTeamPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { user } = await requireCompletedProfile();
    const [resolvedSearchParams, taxonomies, candidateData] = await Promise.all([
        searchParams,
        getTaxonomies(),
        getCandidateDiscovery(user.id),
    ]);

    const validSkillSlugs = new Set(taxonomies.skills.map((skill) => skill.slug));
    const validCompetitionTypeSlugs = new Set(taxonomies.competitionTypes.map((competitionType) => competitionType.slug));
    const validMonthValues = new Set<string>(dashboardMonthOptions);
    const queryValue = normalizeSearchText(resolvedSearchParams.q);
    const q = queryValue.toLowerCase();
    const rawSkillSlug = firstParam(resolvedSearchParams.skills) ?? "";
    const skillSlug = validSkillSlugs.has(rawSkillSlug) ? rawSkillSlug : "";
    const rawCompetitionTypeSlug = firstParam(resolvedSearchParams.competition_types) ?? "";
    const competitionTypeSlug = validCompetitionTypeSlugs.has(rawCompetitionTypeSlug) ? rawCompetitionTypeSlug : "";
    const campusValue = normalizeSearchText(resolvedSearchParams.campus);
    const campus = campusValue.toLowerCase();
    const rawAvailabilityMonth = (firstParam(resolvedSearchParams.availability_month) ?? "").trim().toLowerCase();
    const availabilityMonth = validMonthValues.has(rawAvailabilityMonth) ? rawAvailabilityMonth : "";
    const hoursPerWeekMinValue = normalizeHoursPerWeekMin(resolvedSearchParams.hours_per_week_min);
    const hoursPerWeekMin = hoursPerWeekMinValue.length > 0 ? Number.parseInt(hoursPerWeekMinValue, 10) : 0;
    const sort = normalizeCandidateSort(resolvedSearchParams.sort);

    const filteredCandidates = candidateData.candidates.filter((candidate) => {
        const matchesQuery =
            q.length === 0 ||
            candidate.profile.fullName?.toLowerCase().includes(q) ||
            candidate.profile.username?.toLowerCase().includes(q) ||
            candidate.profile.skills.some((skill) => skill.label.toLowerCase().includes(q));
        const matchesSkill = skillSlug.length === 0 || candidate.profile.skills.some((skill) => skill.slug === skillSlug);
        const matchesCompetition =
            competitionTypeSlug.length === 0 ||
            candidate.profile.competitionTypes.some((type) => type.slug === competitionTypeSlug);
        const matchesCampus = campus.length === 0 || candidate.profile.campusName?.toLowerCase().includes(campus);
        const matchesMonth =
            availabilityMonth.length === 0 || candidate.profile.availableMonths.includes(availabilityMonth as never);
        const matchesHours = hoursPerWeekMin <= 0 || (candidate.profile.hoursPerWeek ?? 0) >= hoursPerWeekMin;

        return matchesQuery && matchesSkill && matchesCompetition && matchesCampus && matchesMonth && matchesHours;
    });

    const normalizedQuery: Record<string, string> = {};

    if (queryValue.length > 0) {
        normalizedQuery.q = queryValue;
    }

    if (skillSlug.length > 0) {
        normalizedQuery.skills = skillSlug;
    }

    if (competitionTypeSlug.length > 0) {
        normalizedQuery.competition_types = competitionTypeSlug;
    }

    if (campusValue.length > 0) {
        normalizedQuery.campus = campusValue;
    }

    if (availabilityMonth.length > 0) {
        normalizedQuery.availability_month = availabilityMonth;
    }

    if (hoursPerWeekMinValue.length > 0) {
        normalizedQuery.hours_per_week_min = hoursPerWeekMinValue;
    }

    if (sort !== "compatibility") {
        normalizedQuery.sort = sort;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="section-kicker">Find Team</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">CARI KANDIDAT YANG PALING COCOK</h1>
                <p className="max-w-3xl text-base leading-8 text-[var(--tm-muted)]">
                    Filter kandidat berdasarkan skill, minat lomba, availability, dan kampus. Semua hasil memakai URL state agar
                    mudah di-refresh atau dibagikan.
                </p>
            </div>

            <Suspense fallback={<CandidateDiscoveryFallback />}>
                <CandidateDiscovery
                    candidates={filteredCandidates}
                    competitionTypes={taxonomies.competitionTypes}
                    currentQuery={normalizedQuery}
                    skills={taxonomies.skills}
                    viewerProfile={candidateData.viewerProfile}
                />
            </Suspense>
        </div>
    );
}
