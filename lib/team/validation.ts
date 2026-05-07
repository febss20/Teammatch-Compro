import { z } from "zod";

export const commitmentSchema = z.object({
    team_member_id: z.uuid("Anggota tim tidak valid."),
    hours_per_week: z.coerce
        .number()
        .int("Jam per minggu harus bilangan bulat.")
        .min(1, "Jam per minggu minimal 1.")
        .max(80, "Jam per minggu maksimal 80."),
});

export const teamRenameSchema = z.object({
    team_id: z.uuid("Tim tidak valid."),
    team_name: z.string().trim().min(3, "Nama tim minimal 3 karakter.").max(80, "Nama tim maksimal 80 karakter."),
});

export const teamResultSchema = z.object({
    team_id: z.uuid("Tim tidak valid."),
    result_summary: z.string().trim().min(10, "Ringkasan hasil minimal 10 karakter.").max(200, "Ringkasan hasil maksimal 200 karakter."),
    competition_ended_at: z.iso.date("Tanggal selesai lomba tidak valid."),
});

export const testimonialSchema = z.object({
    team_id: z.uuid("Tim tidak valid."),
    target_profile_id: z.uuid("Target testimonial tidak valid."),
    rating: z.coerce.number().int("Rating harus bilangan bulat.").min(1, "Rating minimal 1").max(5, "Rating maksimal 5"),
    body: z.string().trim().min(10, "Testimoni minimal 10 karakter.").max(300, "Testimoni maksimal 300 karakter."),
    testimonial_id: z.preprocess((value) => (typeof value === "string" && value.length > 0 ? value : undefined), z.uuid().optional()),
});

export function safeParseCommitment(formData: FormData) {
    return commitmentSchema.safeParse({
        team_member_id: formData.get("team_member_id"),
        hours_per_week: formData.get("hours_per_week"),
    });
}

export function safeParseTeamRename(formData: FormData) {
    return teamRenameSchema.safeParse({
        team_id: formData.get("team_id"),
        team_name: formData.get("team_name"),
    });
}

export function safeParseTeamResult(formData: FormData) {
    return teamResultSchema.safeParse({
        team_id: formData.get("team_id"),
        result_summary: formData.get("result_summary"),
        competition_ended_at: formData.get("competition_ended_at"),
    });
}

export function safeParseTestimonial(formData: FormData) {
    return testimonialSchema.safeParse({
        team_id: formData.get("team_id"),
        target_profile_id: formData.get("target_profile_id"),
        rating: formData.get("rating"),
        body: formData.get("body"),
        testimonial_id: formData.get("testimonial_id"),
    });
}
