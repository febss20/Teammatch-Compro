import { z } from "zod";

export const joinRequestSchema = z.object({
    target_profile_id: z.uuid("Target profil tidak valid."),
    board_id: z.preprocess((value) => (typeof value === "string" && value.length > 0 ? value : undefined), z.uuid().optional()),
    selected_role: z.string().trim().min(2, "Pilih peran yang ingin Anda ambil.").max(50, "Peran maksimal 50 karakter."),
    message: z.string().trim().min(1, "Pesan wajib diisi.").max(150, "Pesan maksimal 150 karakter."),
});

export const boardApplicationSchema = z.object({
    board_id: z.uuid("Board tidak valid."),
    board_slot_id: z.preprocess(
        (value) => (typeof value === "string" && value.length > 0 ? value : undefined),
        z.uuid().optional(),
    ),
    selected_role: z.string().trim().min(2, "Pilih peran yang ingin diambil.").max(50, "Peran maksimal 50 karakter."),
    message: z.string().trim().min(1, "Pesan lamaran wajib diisi.").max(200, "Pesan lamaran maksimal 200 karakter."),
});

export function safeParseJoinRequest(formData: FormData) {
    return joinRequestSchema.safeParse({
        target_profile_id: formData.get("target_profile_id"),
        board_id: formData.get("board_id"),
        selected_role: formData.get("selected_role"),
        message: formData.get("message"),
    });
}

export function safeParseBoardApplication(formData: FormData) {
    return boardApplicationSchema.safeParse({
        board_id: formData.get("board_id"),
        board_slot_id: formData.get("board_slot_id"),
        selected_role: formData.get("selected_role"),
        message: formData.get("message"),
    });
}
