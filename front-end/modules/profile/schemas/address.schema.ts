import { z } from "zod";

/**
 * Factory schema alamat pengiriman dengan dukungan i18n
 */
export const getAddressSchema = (t?: (key: string) => string) =>
    z.object({
        recipientName: z
            .string()
            .min(1, t ? t("recipientNameRequired") : "Nama penerima wajib diisi")
            .min(3, t ? t("recipientNameRequired") : "Nama penerima minimal 3 karakter"),
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
        fullAddress: z
            .string()
            .min(1, t ? t("fullAddressRequired") : "Alamat lengkap wajib diisi")
            .min(5, t ? t("fullAddressRequired") : "Alamat lengkap minimal 5 karakter"),
        district: z
            .string()
            .min(1, t ? t("districtRequired") : "Kecamatan wajib diisi"),
        city: z
            .string()
            .min(1, t ? t("cityRequired") : "Kota/Kabupaten wajib diisi"),
        province: z
            .string()
            .min(1, t ? t("provinceRequired") : "Provinsi wajib diisi"),
        postalCode: z
            .string()
            .min(1, t ? t("postalCodeRequired") : "Kode pos wajib diisi"),
        notes: z.string(),
    });

export const addressSchema = getAddressSchema();

export type AddressFormData = z.infer<typeof addressSchema>;
