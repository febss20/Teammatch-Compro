import { z } from "zod";

export const settingsSchema = z.object({
    public_visibility: z.enum(["public", "private"]),
    show_competition_history: z.enum(["true", "false"]),
    request_updates: z.enum(["true", "false"]),
    board_updates: z.enum(["true", "false"]),
    commitment_updates: z.enum(["true", "false"]),
    reminder_updates: z.enum(["true", "false"]),
});

export function safeParseSettings(formData: FormData) {
    return settingsSchema.safeParse({
        public_visibility: formData.get("public_visibility"),
        show_competition_history: formData.get("show_competition_history"),
        request_updates: formData.get("request_updates"),
        board_updates: formData.get("board_updates"),
        commitment_updates: formData.get("commitment_updates"),
        reminder_updates: formData.get("reminder_updates"),
    });
}
