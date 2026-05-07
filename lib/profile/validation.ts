import { z } from "zod";
import { dashboardMonthOptions, profileVisibilityOptions } from "@/lib/types";

const visibilitySchema = z.enum(profileVisibilityOptions, {
    error: "Visibilitas profil tidak valid.",
});

export const profileStepOneSchema = z.object({
    full_name: z.string().trim().min(3, "Nama lengkap minimal 3 karakter.").max(80, "Nama lengkap maksimal 80 karakter."),
    campus_name: z.string().trim().min(3, "Nama kampus minimal 3 karakter.").max(100, "Nama kampus maksimal 100 karakter."),
    username: z
        .string()
        .trim()
        .min(3, "Username minimal 3 karakter.")
        .max(30, "Username maksimal 30 karakter.")
        .regex(/^[a-z0-9_]+$/i, "Username hanya boleh berisi huruf, angka, dan underscore."),
    bio: z.string().trim().min(20, "Bio minimal 20 karakter.").max(280, "Bio maksimal 280 karakter."),
});

export const profileStepTwoSchema = z.object({
    skills: z.array(z.uuid("Skill tidak valid.")).min(1, "Pilih minimal 1 skill.").max(5, "Maksimal 5 skill."),
    competition_types: z.array(z.uuid("Jenis lomba tidak valid.")).min(1, "Pilih minimal 1 jenis lomba."),
});

export const profileStepThreeSchema = z.object({
    available_months: z
        .array(z.enum(dashboardMonthOptions, { error: "Bulan ketersediaan tidak valid." }))
        .min(1, "Pilih minimal 1 bulan ketersediaan."),
    hours_per_week: z.coerce.number().int("Jam per minggu harus berupa angka bulat.").min(1).max(80),
    public_visibility: visibilitySchema,
    show_competition_history: z.union([z.literal("true"), z.literal("false")]).transform((value) => value === "true"),
});

export const updateProfileSchema = profileStepOneSchema.merge(profileStepTwoSchema).merge(profileStepThreeSchema);

export function safeParseProfileStepOne(formData: FormData) {
    return profileStepOneSchema.safeParse({
        full_name: formData.get("full_name"),
        campus_name: formData.get("campus_name"),
        username: formData.get("username"),
        bio: formData.get("bio"),
    });
}

export function safeParseProfileStepTwo(formData: FormData) {
    return profileStepTwoSchema.safeParse({
        skills: formData.getAll("skills"),
        competition_types: formData.getAll("competition_types"),
    });
}

export function safeParseProfileStepThree(formData: FormData) {
    return profileStepThreeSchema.safeParse({
        available_months: formData.getAll("available_months"),
        hours_per_week: formData.get("hours_per_week"),
        public_visibility: formData.get("public_visibility"),
        show_competition_history: formData.get("show_competition_history") ?? "false",
    });
}

export function safeParseUpdateProfile(formData: FormData) {
    return updateProfileSchema.safeParse({
        full_name: formData.get("full_name"),
        campus_name: formData.get("campus_name"),
        username: formData.get("username"),
        bio: formData.get("bio"),
        skills: formData.getAll("skills"),
        competition_types: formData.getAll("competition_types"),
        available_months: formData.getAll("available_months"),
        hours_per_week: formData.get("hours_per_week"),
        public_visibility: formData.get("public_visibility"),
        show_competition_history: formData.get("show_competition_history") ?? "false",
    });
}
