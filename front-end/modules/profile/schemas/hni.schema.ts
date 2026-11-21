import { z } from "zod";

/**
 * Schema verifikasi / pendaftaran keanggotaan HNI
 * (Data alamat ditangani secara terpisah melalui Alamat Panel)
 */
export const getHniRegistrationSchema = (t?: (key: string) => string) =>
    z.object({
        memberId: z
            .string()
            .trim()
            .min(1, t ? t("memberIdRequired") : "ID Member HNI wajib diisi")
            .min(6, t ? t("memberIdRequired") : "ID Member HNI minimal 6 digit"),
        memberName: z
            .string()
            .trim()
            .min(1, t ? t("memberNameRequired") : "Nama terdaftar HNI wajib diisi")
            .min(3, t ? t("memberNameRequired") : "Nama terdaftar HNI minimal 3 karakter"),
        uplineName: z.string().optional(),
        rank: z.string().optional(),
        phoneNumber: z.string().optional(),
    });

export const hniRegistrationSchema = getHniRegistrationSchema();

export type HniRegistrationFormData = z.infer<typeof hniRegistrationSchema>;

