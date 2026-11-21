import { z } from "zod";

/**
 * Factory schema klaim kode voucher promo
 */
export const getVoucherSchema = (t?: (key: string) => string) =>
    z.object({
        code: z
            .string()
            .trim()
            .min(1, t ? t("codeRequired") : "Kode voucher wajib diisi")
            .min(3, t ? t("codeMin") : "Kode voucher minimal 3 karakter")
            .transform((val) => val.toUpperCase()),
    });

export const voucherSchema = getVoucherSchema();

export type VoucherFormData = z.infer<typeof voucherSchema>;
