import { z } from "zod";

export const contactPayloadSchema = z.object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
    email: z.email("Format email tidak valid.").transform((value: string) => value.trim().toLowerCase()),
    message: z.string().trim().min(10, "Pesan minimal 10 karakter.").max(2000, "Pesan maksimal 2000 karakter."),
});

export type ContactPayload = z.infer<typeof contactPayloadSchema>;
