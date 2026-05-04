import { z } from "zod";
import {
    competitionIdeaBoardStatusOptions,
    competitionTypeOptions,
    type CompetitionIdeaBoardStatus,
    type CompetitionTypeOption,
} from "@/lib/types";

const honeypotSchema = z.string().trim().max(0, "Terindikasi spam.");

const competitionTypeSelectSchema = z.enum(competitionTypeOptions, {
    error: "Jenis lomba tidak valid.",
});

const boardStatusSchema = z.enum(competitionIdeaBoardStatusOptions, {
    error: "Status board tidak valid.",
});

const skillTokenSchema = z
    .string()
    .trim()
    .min(2, "Setiap skill minimal 2 karakter.")
    .max(50, "Setiap skill maksimal 50 karakter.");

const titleSchema = z.string().trim().min(5, "Judul ide minimal 5 karakter.").max(120, "Judul ide maksimal 120 karakter.");

const descriptionSchema = z
    .string()
    .trim()
    .min(30, "Deskripsi ide minimal 30 karakter.")
    .max(2000, "Deskripsi ide maksimal 2000 karakter.");

const deadlineSchema = z.iso.date("Deadline lomba tidak valid.");

const requiredSkillsInputSchema = z
    .string()
    .trim()
    .min(1, "Skill yang dibutuhkan wajib diisi.")
    .max(500, "Daftar skill terlalu panjang.");

const competitionTypeOtherSchema = z.preprocess(
    (value: unknown) => (typeof value === "string" ? value : ""),
    z.string().trim().max(50, "Jenis lomba lainnya maksimal 50 karakter."),
);

const boardBaseSchema = z
    .object({
        title: titleSchema,
        competition_type_select: competitionTypeSelectSchema,
        competition_type_other: competitionTypeOtherSchema,
        description: descriptionSchema,
        deadline: deadlineSchema,
        required_skills: requiredSkillsInputSchema,
        website: honeypotSchema,
    })
    .superRefine((data, ctx) => {
        if (data.competition_type_select === "other" && data.competition_type_other.trim().length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["competition_type_other"],
                message: "Jenis lomba lainnya minimal 3 karakter.",
            });
        }

        const deadlineDate = createDeadlineDate(data.deadline);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (deadlineDate.getTime() <= today.getTime()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["deadline"],
                message: "Deadline harus setelah hari ini.",
            });
        }

        const normalizedSkills = normalizeRequiredSkills(data.required_skills);

        if (normalizedSkills.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["required_skills"],
                message: "Masukkan minimal 1 skill yang dibutuhkan.",
            });
        }

        if (normalizedSkills.length > 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["required_skills"],
                message: "Maksimal 10 skill dapat dimasukkan.",
            });
        }

        normalizedSkills.forEach((skill: string) => {
            const result = skillTokenSchema.safeParse(skill);

            if (!result.success) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["required_skills"],
                    message: result.error.issues[0]?.message ?? "Format skill tidak valid.",
                });
            }
        });
    });

export const createCompetitionIdeaBoardSchema = boardBaseSchema;

export const updateCompetitionIdeaBoardSchema = boardBaseSchema.extend({
    id: z.uuid("ID board ide tidak valid."),
    status: boardStatusSchema,
});

export interface CompetitionIdeaBoardPayload {
    title: string;
    competitionType: string;
    description: string;
    deadline: string;
    requiredSkills: string[];
}

export interface CompetitionIdeaBoardUpdatePayload extends CompetitionIdeaBoardPayload {
    id: string;
    status: CompetitionIdeaBoardStatus;
}

export function buildCreateCompetitionIdeaBoardPayload(formData: FormData): CompetitionIdeaBoardPayload {
    const parsedData = createCompetitionIdeaBoardSchema.parse({
        title: formData.get("title"),
        competition_type_select: formData.get("competition_type_select"),
        competition_type_other: formData.get("competition_type_other"),
        description: formData.get("description"),
        deadline: formData.get("deadline"),
        required_skills: formData.get("required_skills"),
        website: formData.get("website"),
    });

    return {
        title: parsedData.title,
        competitionType: resolveCompetitionType(parsedData.competition_type_select, parsedData.competition_type_other),
        description: parsedData.description,
        deadline: createDeadlineDate(parsedData.deadline).toISOString(),
        requiredSkills: normalizeRequiredSkills(parsedData.required_skills),
    };
}

export function buildUpdateCompetitionIdeaBoardPayload(formData: FormData): CompetitionIdeaBoardUpdatePayload {
    const parsedData = updateCompetitionIdeaBoardSchema.parse({
        id: formData.get("id"),
        title: formData.get("title"),
        competition_type_select: formData.get("competition_type_select"),
        competition_type_other: formData.get("competition_type_other"),
        description: formData.get("description"),
        deadline: formData.get("deadline"),
        required_skills: formData.get("required_skills"),
        status: formData.get("status"),
        website: formData.get("website"),
    });

    return {
        id: parsedData.id,
        title: parsedData.title,
        competitionType: resolveCompetitionType(parsedData.competition_type_select, parsedData.competition_type_other),
        description: parsedData.description,
        deadline: createDeadlineDate(parsedData.deadline).toISOString(),
        requiredSkills: normalizeRequiredSkills(parsedData.required_skills),
        status: parsedData.status,
    };
}

function resolveCompetitionType(competitionTypeSelect: CompetitionTypeOption, competitionTypeOther: string): string {
    if (competitionTypeSelect !== "other") {
        return competitionTypeSelect;
    }

    return competitionTypeOther.trim();
}

function collapseWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

export function normalizeRequiredSkills(requiredSkillsValue: string): string[] {
    const uniqueSkillMap = new Map<string, string>();

    requiredSkillsValue.split(",").forEach((skill: string) => {
        const normalizedSkill = collapseWhitespace(skill);

        if (normalizedSkill.length === 0) {
            return;
        }

        const skillKey = normalizedSkill.toLowerCase();

        if (!uniqueSkillMap.has(skillKey)) {
            uniqueSkillMap.set(skillKey, normalizedSkill);
        }
    });

    return Array.from(uniqueSkillMap.values());
}

function createDeadlineDate(deadline: string): Date {
    const [yearString, monthString, dayString] = deadline.split("-");
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);

    return new Date(year, month - 1, day, 23, 59, 59, 999);
}
