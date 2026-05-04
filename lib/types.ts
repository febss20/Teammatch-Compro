export const competitionTypeOptions = [
    "hackathon",
    "business_plan",
    "ui_ux_design",
    "data_science",
    "karya_tulis",
    "startup_pitch",
    "other",
] as const;

export const competitionIdeaBoardStatusOptions = ["open", "closed"] as const;

export type CompetitionTypeOption = (typeof competitionTypeOptions)[number];
export type CompetitionIdeaBoardStatus = (typeof competitionIdeaBoardStatusOptions)[number];

export interface CompetitionIdeaBoardRecord {
    id: string;
    userId: string;
    title: string;
    competitionType: string;
    description: string;
    deadline: string;
    requiredSkills: string[];
    status: CompetitionIdeaBoardStatus;
    createdAt: string;
    updatedAt: string;
}

export type CompetitionIdeaBoardFieldName =
    | "id"
    | "title"
    | "competition_type_select"
    | "competition_type_other"
    | "description"
    | "deadline"
    | "required_skills"
    | "status"
    | "website";

export type LoginFieldName = "email" | "password" | "next";
export type RegisterFieldName = "email" | "password" | "confirm_password";

export interface FormActionState<FieldName extends string> {
    success: boolean;
    message: string;
    formError: string | null;
    fieldErrors: Partial<Record<FieldName, string[]>>;
}
