import { z } from "zod";
import { zUUID, zIndonesianPhone, validateSchema } from "@/schemas/common.schema";
import { enumSupportedLanguage } from "@/i18n";

export const getAddressesParamsSchema = z.object({
    userId: zUUID.optional(),
});

export const addressIdParamsSchema = z.object({
    id: zUUID,
});

export const addressQuerySchema = z.object({
    lang: z.enum(enumSupportedLanguage).optional(),
    userId: zUUID.optional(),
});

export const createAddressBodySchema = z.object({
    userId: zUUID.optional(),
    recipientName: z.string().min(2, "Nama penerima minimal 2 karakter"),
    phoneNumber: zIndonesianPhone,
    fullAddress: z.string().min(5, "Alamat lengkap minimal 5 karakter"),
    district: z.string().min(2, "Kecamatan minimal 2 karakter"),
    city: z.string().min(2, "Kota minimal 2 karakter"),
    province: z.string().optional().default("Sumatera Barat"),
    postalCode: z.string().optional(),
    isPrimary: z.boolean().optional().default(false),
});

export const updateAddressBodySchema = createAddressBodySchema.partial();

export const getAddressesSchema = validateSchema({
    params: getAddressesParamsSchema,
    querystring: addressQuerySchema,
});

export const createAddressSchema = validateSchema({
    body: createAddressBodySchema,
    querystring: addressQuerySchema,
});

export const updateAddressSchema = validateSchema({
    params: addressIdParamsSchema,
    body: updateAddressBodySchema,
    querystring: addressQuerySchema,
});

export const addressIdOnlySchema = validateSchema({
    params: addressIdParamsSchema,
    querystring: addressQuerySchema,
});

export type GetAddressesParams = z.infer<typeof getAddressesParamsSchema>;
export type AddressIdParams = z.infer<typeof addressIdParamsSchema>;
export type CreateAddressBody = z.infer<typeof createAddressBodySchema>;
export type UpdateAddressBody = z.infer<typeof updateAddressBodySchema>;
