import type {
    CompetitionTypeRecord,
    DashboardMonth,
    ProfileCompetitionHistoryItem,
    ProfileRecord,
    SkillOption,
} from "@/lib/types";

interface SkillRow {
    id: string;
    slug: string;
    label: string;
    category: string;
}

interface CompetitionTypeRow {
    id: string;
    slug: string;
    label: string;
    recommended_skills: string[];
}

interface ProfileRecordInput {
    id: string;
    full_name: string | null;
    campus_name: string | null;
    username: string | null;
    bio: string | null;
    public_visibility: boolean;
    show_competition_history: boolean;
    profile_completed_at: string | null;
    verification_status: string;
    verified_at: string | null;
    email?: string | null;
    skills?: SkillOption[];
    competitionTypes?: CompetitionTypeRecord[];
    availableMonths?: DashboardMonth[];
    hoursPerWeek?: number | null;
    completionScore?: number;
    competitionsCount?: number;
    bestResult?: string | null;
    testimonialCount?: number;
    testimonialAverage?: number;
    competitionHistory?: ProfileCompetitionHistoryItem[];
}

export function mapSkill(row: SkillRow): SkillOption {
    return {
        id: row.id,
        slug: row.slug,
        label: row.label,
        category: row.category,
    };
}

export function mapCompetitionType(row: CompetitionTypeRow): CompetitionTypeRecord {
    return {
        id: row.id,
        slug: row.slug as CompetitionTypeRecord["slug"],
        label: row.label,
        recommendedSkills: row.recommended_skills,
    };
}

export function mapProfileRecord(input: ProfileRecordInput): ProfileRecord {
    return {
        id: input.id,
        email: input.email,
        fullName: input.full_name,
        campusName: input.campus_name,
        username: input.username,
        bio: input.bio,
        visibility: input.public_visibility ? "public" : "private",
        showCompetitionHistory: input.show_competition_history,
        profileCompletedAt: input.profile_completed_at,
        verificationStatus: input.verification_status === "verified" ? "verified" : "unverified",
        verifiedAt: input.verified_at,
        skills: input.skills ?? [],
        competitionTypes: input.competitionTypes ?? [],
        availableMonths: input.availableMonths ?? [],
        hoursPerWeek: input.hoursPerWeek ?? null,
        completionScore: input.completionScore ?? 0,
        competitionsCount: input.competitionsCount ?? 0,
        bestResult: input.bestResult ?? null,
        testimonialCount: input.testimonialCount ?? 0,
        testimonialAverage: input.testimonialAverage ?? 0,
        competitionHistory: input.competitionHistory ?? [],
    };
}
