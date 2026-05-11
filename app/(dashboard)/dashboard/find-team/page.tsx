import CandidateDiscovery from "@/components/dashboard/CandidateDiscovery";
import { requireCompletedProfile } from "@/lib/auth";
import { getCandidateDiscovery, getTaxonomies } from "@/lib/dashboard/data";

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
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

    const q = (firstParam(resolvedSearchParams.q) ?? "").toLowerCase();
    const skillSlug = firstParam(resolvedSearchParams.skills) ?? "";
    const competitionTypeSlug = firstParam(resolvedSearchParams.competition_types) ?? "";
    const campus = (firstParam(resolvedSearchParams.campus) ?? "").toLowerCase();
    const availabilityMonth = firstParam(resolvedSearchParams.availability_month) ?? "";
    const hoursPerWeekMin = Number(firstParam(resolvedSearchParams.hours_per_week_min) ?? "0");

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

            <CandidateDiscovery
                candidates={filteredCandidates}
                competitionTypes={taxonomies.competitionTypes}
                currentQuery={resolvedSearchParams}
                skills={taxonomies.skills}
                viewerProfile={candidateData.viewerProfile}
            />
        </div>
    );
}
