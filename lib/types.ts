export const competitionTypeOptions = [
    "hackathon",
    "pkm",
    "business",
    "ui-ux-design",
    "data-science",
    "karya-tulis",
    "others",
] as const;

export const profileVisibilityOptions = ["public", "private"] as const;
export const verificationStatusOptions = ["unverified", "verified"] as const;
export const competitionIdeaBoardStatusOptions = ["open", "closed"] as const;
export const boardVisibilityOptions = ["public", "private"] as const;
export const joinRequestStatusOptions = ["pending", "accepted", "rejected", "withdrawn"] as const;
export const boardApplicationStatusOptions = ["pending", "saved", "accepted", "rejected", "withdrawn"] as const;
export const teamMemberStatusOptions = ["pending", "confirmed", "expired"] as const;
export const notificationCategoryOptions = ["request", "application", "commitment", "reminder", "system"] as const;
export const dashboardMonthOptions = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
] as const;
export const boardRoleOptions = [
    "UI/UX Designer",
    "Frontend Engineer",
    "Backend Engineer",
    "Data Analyst",
    "Pitch Strategist",
] as const;

export type CompetitionTypeOption = (typeof competitionTypeOptions)[number];
export type ProfileVisibility = (typeof profileVisibilityOptions)[number];
export type VerificationStatus = (typeof verificationStatusOptions)[number];
export type CompetitionIdeaBoardStatus = (typeof competitionIdeaBoardStatusOptions)[number];
export type BoardVisibility = (typeof boardVisibilityOptions)[number];
export type JoinRequestStatus = (typeof joinRequestStatusOptions)[number];
export type BoardApplicationStatus = (typeof boardApplicationStatusOptions)[number];
export type TeamMemberStatus = (typeof teamMemberStatusOptions)[number];
export type NotificationCategory = (typeof notificationCategoryOptions)[number];
export type DashboardMonth = (typeof dashboardMonthOptions)[number];

export interface SkillOption {
    id: string;
    slug: string;
    label: string;
    category: string;
}

export interface CompetitionTypeRecord {
    id: string;
    slug: CompetitionTypeOption | string;
    label: string;
    recommendedSkills: string[];
}

export interface ProfileRecord {
    id: string;
    email?: string | null;
    fullName: string | null;
    campusName: string | null;
    username: string | null;
    bio: string | null;
    visibility: ProfileVisibility;
    showCompetitionHistory: boolean;
    profileCompletedAt: string | null;
    verificationStatus: VerificationStatus;
    verifiedAt: string | null;
    skills: SkillOption[];
    competitionTypes: CompetitionTypeRecord[];
    availableMonths: DashboardMonth[];
    hoursPerWeek: number | null;
    completionScore: number;
    // Tambahkan field untuk statistik dari profile_testimonial_summaries
    averageRating: number;
    testimonialCount: number;
    bestResult: string | null;
    competitionsCount: number;
    summaryUpdatedAt: string | null;
}

export interface CandidateRecord {
    profile: ProfileRecord;
    compatibilityScore: number;
    savedByViewer: boolean;
    testimonialAverage: number;
    testimonialCount: number;
    competitionsCount: number;
    bestResult: string | null;
}

export interface CompetitionIdeaBoardRecord {
    id: string;
    userId: string;
    creatorName?: string | null;
    title: string;
    competitionType: string;
    summary: string | null;
    description: string;
    deadline: string;
    requiredSkills: string[];
    status: CompetitionIdeaBoardStatus;
    visibility: BoardVisibility;
    isDraft: boolean;
    publishedAt: string | null;
    closedAt: string | null;
    lastApplicantAt: string | null;
    createdAt: string;
    updatedAt: string;
    slots: BoardSlotRecord[];
}

export interface BoardDraftRecord {
    id: string;
    userId: string;
    title: string | null;
    summary: string | null;
    competitionType: string | null;
    description: string | null;
    deadline: string | null;
    requiredSkills: string[];
    visibility: BoardVisibility;
    slots: BoardSlotRecord[];
    updatedAt: string;
}

export interface BoardSlotRecord {
    id: string;
    boardId: string;
    roleName: string;
    slotCount: number;
    requiredSkills: string[];
}

export interface JoinRequestRecord {
    id: string;
    requesterId: string;
    targetProfileId: string;
    requesterName: string | null;
    targetProfileName: string | null;
    boardId: string | null;
    selectedRole: string;
    message: string;
    status: JoinRequestStatus;
    rejectionLocked: boolean;
    createdAt: string;
    updatedAt: string;
    respondedAt: string | null;
}

export interface BoardApplicationRecord {
    id: string;
    boardId: string;
    applicantId: string;
    boardSlotId: string | null;
    teamId: string | null;
    selectedRole: string;
    message: string;
    status: BoardApplicationStatus;
    skillMatchScore: number;
    createdAt: string;
    updatedAt: string;
    respondedAt: string | null;
}

export interface TeamRecord {
    id: string;
    boardId: string | null;
    creatorId: string;
    name: string;
    competitionName: string | null;
    deadline: string | null;
}

export interface TeamListItemRecord extends TeamRecord {
    confirmedMembersCount: number;
    membersCount: number;
    selfCommitmentStatus: TeamMemberStatus | null;
}

export interface TeamMemberRecord {
    id: string;
    profileId: string;
    fullName: string | null;
    roleName: string;
    confirmationStatus: TeamMemberStatus;
    commitmentId: string | null;
    commitmentDeadlineAt: string | null;
    commitmentConfirmedAt: string | null;
    commitmentLastRemindedAt: string | null;
    commitmentHoursPerWeek: number | null;
}

export interface NotificationRecord {
    id: string;
    category: NotificationCategory;
    title: string;
    body: string;
    linkPath: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface TeamResultRecord {
    id: string;
    teamId: string;
    resultSummary: string;
    competitionEndedAt: string;
    createdAt: string;
}

export interface TeamResourceRecord {
    id: string;
    teamId: string;
    resourceType: string;
    label: string;
    url: string | null;
    createdAt: string;
}

export interface TeamActivityEventRecord {
    id: string;
    teamId: string;
    actorId: string | null;
    actorName: string | null;
    eventType: string;
    payload: Record<string, unknown>;
    createdAt: string;
}

export interface TestimonialRecord {
    id: string;
    teamId: string;
    authorId: string;
    targetProfileId: string;
    rating: number;
    body: string;
    lockedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type CompetitionIdeaBoardFieldName =
    | "id"
    | "title"
    | "summary"
    | "competition_type_select"
    | "competition_type_other"
    | "description"
    | "deadline"
    | "required_skills"
    | "status"
    | "visibility"
    | "slots_json"
    | "website";

export type LoginFieldName = "email" | "password" | "next";
export type RegisterFieldName = "email" | "password" | "confirm_password";
export type ProfileStepOneFieldName = "full_name" | "campus_name" | "username" | "bio";
export type ProfileStepTwoFieldName = "skills" | "custom_skills" | "competition_types" | "custom_competition_types";
export type ProfileStepThreeFieldName =
    | "available_months"
    | "hours_per_week"
    | "public_visibility"
    | "show_competition_history";
export type ProfileFieldName =
    | ProfileStepOneFieldName
    | ProfileStepTwoFieldName
    | ProfileStepThreeFieldName
    | "profile_completed_at";
export type JoinRequestFieldName = "target_profile_id" | "selected_role" | "message" | "board_id";
export type BoardApplicationFieldName = "board_id" | "board_slot_id" | "selected_role" | "message";
export type SettingsFieldName =
    | "public_visibility"
    | "show_competition_history"
    | "request_updates"
    | "board_updates"
    | "commitment_updates"
    | "reminder_updates";
export type PasswordChangeFieldName = "current_password" | "new_password" | "confirm_new_password";
export type CommitmentFieldName = "team_member_id" | "hours_per_week";
export type TeamRenameFieldName = "team_id" | "team_name";
export type TeamResultFieldName = "team_id" | "result_summary" | "competition_ended_at";
export type TestimonialFieldName = "team_id" | "target_profile_id" | "rating" | "body" | "testimonial_id";
export type TeamResourceFieldName = "team_id" | "resource_type" | "label" | "url";

export interface FormActionState<FieldName extends string> {
    success: boolean;
    message: string;
    formError: string | null;
    fieldErrors: Partial<Record<FieldName, string[]>>;
}
