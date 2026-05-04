import { z } from "zod";

const emailSchema = z.email("Alamat email tidak valid.").transform((value: string) => value.trim().toLowerCase());

const passwordSchema = z.string().trim().min(8, "Password minimal 8 karakter.").max(128, "Password maksimal 128 karakter.");

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    next: z.string().trim().min(1, "Tujuan redirect tidak valid.").max(200, "Tujuan redirect terlalu panjang."),
});

export const registerSchema = z
    .object({
        email: emailSchema,
        password: passwordSchema,
        confirm_password: passwordSchema,
    })
    .superRefine((data, ctx) => {
        if (data.password !== data.confirm_password) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["confirm_password"],
                message: "Konfirmasi password harus sama dengan password.",
            });
        }
    });
