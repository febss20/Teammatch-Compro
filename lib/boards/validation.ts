import { z } from "zod";
import {
    boardVisibilityOptions,
    competitionIdeaBoardStatusOptions,
    competitionTypeOptions,
    type BoardVisibility,
    type CompetitionIdeaBoardStatus,
    type CompetitionTypeOption,
} from "@/lib/types";

const honeypotSchema = z.string().trim().max(0, "Terindikasi spam.");
const competitionTypeSelectSchema = z.enum(competitionTypeOptions, { error: "Jenis lomba tidak valid." });
const boardStatusSchema = z.enum(competitionIdeaBoardStatusOptions, { error: "Status board tidak valid." });
const boardVisibilitySchema = z.enum(boardVisibilityOptions, { error: "Visibilitas board tidak valid." });
const skillTokenSchema = z
    .string()
    .trim()
    .min(2, "Setiap skill minimal 2 karakter.")
    .max(50, "Setiap skill maksimal 50 karakter.");
const titleSchema = z.string().trim().min(5, "Judul ide minimal 5 karakter.").max(120, "Judul ide maksimal 120 karakter.");
const summarySchema = z.string().trim().min(20, "Ringkasan minimal 20 karakter.").max(220, "Ringkasan maksimal 220 karakter.");
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
const roleNameSchema = z.string().trim().min(2, "Peran minimal 2 karakter.").max(50, "Peran maksimal 50 karakter.");
const slotCountSchema = z.coerce
    .number()
    .int("Slot harus berupa angka bulat.")
    .min(1, "Minimal 1 slot.")
    .max(10, "Maksimal 10 slot.");

const createSlotSchema = z.object({
    slot_role_1: roleNameSchema,
    slot_count_1: slotCountSchema,
    slot_role_2: z.preprocess(
        (value) => (typeof value === "string" ? value : ""),
        z.string().trim().max(50, "Peran kedua maksimal 50 karakter."),
    ),
    slot_count_2: z.preprocess((value) => (value === "" || value === null ? undefined : value), slotCountSchema.optional()),
});

const deleteCompetitionIdeaBoardSchema = z.object({
    id: z.uuid("ID board ide tidak valid."),
});

const boardBaseSchema = z
    .object({
        title: titleSchema,
        summary: summarySchema,
        competition_type_select: competitionTypeSelectSchema,
        competition_type_other: competitionTypeOtherSchema,
        description: descriptionSchema,
        deadline: deadlineSchema,
        required_skills: requiredSkillsInputSchema,
        visibility: boardVisibilitySchema,
        website: honeypotSchema,
    })
    .merge(createSlotSchema)
    .superRefine((data, ctx) => {
        if (data.competition_type_select === "others" && data.competition_type_other.trim().length < 3) {
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
        normalizedSkills.forEach((skill) => {
            const result = skillTokenSchema.safeParse(skill);
            if (!result.success) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["required_skills"],
                    message: result.error.issues[0]?.message ?? "Format skill tidak valid.",
                });
            }
        });

        if (data.slot_role_2.trim().length > 0 && data.slot_count_2 === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["slot_count_2"],
                message: "Isi jumlah slot untuk peran kedua.",
            });
        }
    });

export const createCompetitionIdeaBoardSchema = boardBaseSchema;

export const updateCompetitionIdeaBoardSchema = boardBaseSchema.extend({
    id: z.uuid("ID board ide tidak valid."),
    status: boardStatusSchema,
});

export interface BoardSlotPayload {
    roleName: string;
    slotCount: number;
    requiredSkills: string[];
}

export interface CompetitionIdeaBoardPayload {
    title: string;
    summary: string;
    competitionType: string;
    description: string;
    deadline: string;
    requiredSkills: string[];
    visibility: BoardVisibility;
    slots: BoardSlotPayload[];
}

export interface CompetitionIdeaBoardUpdatePayload extends CompetitionIdeaBoardPayload {
    id: string;
    status: CompetitionIdeaBoardStatus;
}

export function safeParseCreateCompetitionIdeaBoard(formData: FormData) {
    return createCompetitionIdeaBoardSchema.safeParse({
        title: formData.get("title"),
        summary: formData.get("summary"),
        competition_type_select: formData.get("competition_type_select"),
        competition_type_other: formData.get("competition_type_other"),
        description: formData.get("description"),
        deadline: formData.get("deadline"),
        required_skills: formData.get("required_skills"),
        visibility: formData.get("visibility"),
        slot_role_1: formData.get("slot_role_1"),
        slot_count_1: formData.get("slot_count_1"),
        slot_role_2: formData.get("slot_role_2"),
        slot_count_2: formData.get("slot_count_2"),
        website: formData.get("website"),
    });
}

export function safeParseUpdateCompetitionIdeaBoard(formData: FormData) {
    return updateCompetitionIdeaBoardSchema.safeParse({
        id: formData.get("id"),
        title: formData.get("title"),
        summary: formData.get("summary"),
        competition_type_select: formData.get("competition_type_select"),
        competition_type_other: formData.get("competition_type_other"),
        description: formData.get("description"),
        deadline: formData.get("deadline"),
        required_skills: formData.get("required_skills"),
        visibility: formData.get("visibility"),
        status: formData.get("status"),
        slot_role_1: formData.get("slot_role_1"),
        slot_count_1: formData.get("slot_count_1"),
        slot_role_2: formData.get("slot_role_2"),
        slot_count_2: formData.get("slot_count_2"),
        website: formData.get("website"),
    });
}

export function safeParseDeleteCompetitionIdeaBoard(formData: FormData) {
    return deleteCompetitionIdeaBoardSchema.safeParse({
        id: formData.get("id"),
    });
}

export function createCompetitionIdeaBoardPayload(
    data: z.infer<typeof createCompetitionIdeaBoardSchema>,
): CompetitionIdeaBoardPayload {
    return {
        title: data.title,
        summary: data.summary,
        competitionType: resolveCompetitionType(data.competition_type_select, data.competition_type_other),
        description: data.description,
        deadline: createDeadlineDate(data.deadline).toISOString(),
        requiredSkills: normalizeRequiredSkills(data.required_skills),
        visibility: data.visibility,
        slots: buildSlots(data.slot_role_1, data.slot_count_1, data.slot_role_2, data.slot_count_2, data.required_skills),
    };
}

export function updateCompetitionIdeaBoardPayload(
    data: z.infer<typeof updateCompetitionIdeaBoardSchema>,
): CompetitionIdeaBoardUpdatePayload {
    return {
        id: data.id,
        title: data.title,
        summary: data.summary,
        competitionType: resolveCompetitionType(data.competition_type_select, data.competition_type_other),
        description: data.description,
        deadline: createDeadlineDate(data.deadline).toISOString(),
        requiredSkills: normalizeRequiredSkills(data.required_skills),
        visibility: data.visibility,
        slots: buildSlots(data.slot_role_1, data.slot_count_1, data.slot_role_2, data.slot_count_2, data.required_skills),
        status: data.status,
    };
}

function buildSlots(
    roleOne: string,
    slotCountOne: number,
    roleTwo: string,
    slotCountTwo: number | undefined,
    requiredSkillsValue: string,
): BoardSlotPayload[] {
    const baseSkills = normalizeRequiredSkills(requiredSkillsValue);
    const slots: BoardSlotPayload[] = [
        {
            roleName: roleOne.trim(),
            slotCount: slotCountOne,
            requiredSkills: baseSkills,
        },
    ];

    if (roleTwo.trim().length > 0) {
        slots.push({
            roleName: roleTwo.trim(),
            slotCount: slotCountTwo ?? 1,
            requiredSkills: baseSkills,
        });
    }

    return slots;
}

function resolveCompetitionType(competitionTypeSelect: CompetitionTypeOption, competitionTypeOther: string): string {
    if (competitionTypeSelect !== "others") {
        return competitionTypeSelect;
    }

    return competitionTypeOther.trim();
}

function collapseWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

export function normalizeRequiredSkills(requiredSkillsValue: string): string[] {
    const uniqueSkillMap = new Map<string, string>();

    requiredSkillsValue.split(",").forEach((skill) => {
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
