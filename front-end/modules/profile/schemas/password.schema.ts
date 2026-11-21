import { z } from "zod";

/**
 * Factory schema ubah kata sandi dengan validasi konfirmasi dan i18n
 */
export const getPasswordSchema = (t?: (key: string) => string) =>
    z
        .object({
            oldPassword: z
                .string()
                .min(1, t ? t("oldPasswordRequired") : "Kata sandi saat ini wajib diisi"),
            newPassword: z
                .string()
                .min(1, t ? t("newPasswordRequired") : "Kata sandi baru wajib diisi")
                .min(6, t ? t("newPasswordMin") : "Kata sandi baru minimal 6 karakter"),
            confirmPassword: z
                .string()
                .min(1, t ? t("confirmPasswordRequired") : "Konfirmasi kata sandi wajib diisi"),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
            message: t ? t("passwordMismatch") : "Konfirmasi kata sandi baru tidak cocok.",
            path: ["confirmPassword"],
        });

export const passwordSchema = getPasswordSchema();

export type PasswordFormData = z.infer<typeof passwordSchema>;
