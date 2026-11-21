import { z } from "zod";

/**
 * Factory schema login yang mendukung internationalization (i18n)
 */
export const getLoginSchema = (t?: (key: string) => string) =>
    z.object({
        email: z
            .string()
            .min(1, t ? t("validation.emailRequired") : "Alamat email wajib diisi")
            .email(t ? t("validation.emailInvalid") : "Format email tidak valid"),
        password: z
            .string()
            .min(1, t ? t("validation.passwordRequired") : "Kata sandi wajib diisi")
            .min(6, t ? t("validation.passwordMinLength") : "Password minimal 6 karakter"),
    });

/**
 * Factory schema register yang mendukung internationalization (i18n)
 */
export const getRegisterSchema = (t?: (key: string) => string) =>
    z.object({
        fullName: z
            .string()
            .min(3, t ? t("validation.fullNameMinLength") : "Nama lengkap minimal 3 karakter"),
        phoneNumber: z
            .string()
            .min(1, t ? t("validation.phoneRequired") : "Nomor telepon wajib diisi")
            .refine(
                (val) => {
                    const digits = val.replace(/\D/g, "");
                    return digits.length >= 8 && digits.length <= 11;
                },
                {
                    message: t
                        ? t("validation.phoneMinLength")
                        : "Nomor HP minimal 8 - 11 digit (sebelum kode negara)",
                }
            ),
        email: z
            .string()
            .min(1, t ? t("validation.emailRequired") : "Alamat email wajib diisi")
            .email(t ? t("validation.emailInvalid") : "Format email tidak valid"),
        password: z
            .string()
            .min(1, t ? t("validation.passwordRequired") : "Kata sandi wajib diisi")
            .min(6, t ? t("validation.passwordMinLength") : "Password minimal 6 karakter"),
    });

// Static Fallback Schemas
export const LoginSchema = getLoginSchema();
export const RegisterSchema = getRegisterSchema();

export const authSchema = {
    login: LoginSchema,
    register: RegisterSchema,
};

export const LoginSchemas = {
    login: getLoginSchema,
    register: getRegisterSchema,
};

export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type LoginInput = LoginFormData;
export type RegisterInput = RegisterFormData;
