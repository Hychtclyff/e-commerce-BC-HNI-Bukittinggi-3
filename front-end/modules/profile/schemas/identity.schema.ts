import { z } from "zod";

/**
 * Factory schema identitas profil dengan dukungan terjemahan i18n
 */
export const getIdentitySchema = (t?: (key: string) => string) =>
    z.object({
        fullName: z
            .string()
            .min(1, t ? t("fullNameRequired") : "Nama lengkap wajib diisi")
            .min(3, t ? t("fullNameMin") : "Nama lengkap minimal 3 karakter"),
        email: z
            .string()
            .min(1, t ? t("emailRequired") : "Alamat email wajib diisi")
            .email(t ? t("emailInvalid") : "Format email tidak valid"),
        phoneNumber: z
            .string()
            .min(1, t ? t("phoneRequired") : "Nomor WhatsApp wajib diisi")
            .refine(
                (val) => {
                    const digits = val.replace(/\D/g, "");
                    return digits.length >= 8 && digits.length <= 15;
                },
                {
                    message: t
                        ? t("phoneInvalid")
                        : "Nomor WhatsApp harus berupa 8-15 digit angka",
                }
            ),
    });

// Fallback schema statis default
export const identitySchema = getIdentitySchema();

// Infer tipe data dari schema
export type IdentityFormData = z.infer<typeof identitySchema>;
