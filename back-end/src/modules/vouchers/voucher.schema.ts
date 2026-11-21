import { z } from "zod";
import { zUUID, validateSchema } from "@/schemas/common.schema";
import { enumSupportedLanguage } from "@/i18n";

export const getVouchersParamsSchema = z.object({
    userId: z.string().optional(),
});

export const getVouchersQuerySchema = z.object({
    lang: z.enum(enumSupportedLanguage).optional(),
    userId: z.string().optional(),
});

export const validateVoucherBodySchema = z.object({
    code: z.string().min(1),
    subtotal: z.number().min(0),
    shippingCost: z.number().min(0).optional().default(0),
    userId: z.string().optional(),
    paymentMethod: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        qty: z.number().optional(),
        tpPoints: z.number().optional(),
    })).optional(),
});

export const getVouchersSchema = validateSchema({
    params: getVouchersParamsSchema,
    querystring: getVouchersQuerySchema,
});

export const validateVoucherSchema = validateSchema({
    body: validateVoucherBodySchema,
});

export type GetVouchersParams = z.infer<typeof getVouchersParamsSchema>;
export type ValidateVoucherBody = z.infer<typeof validateVoucherBodySchema>;
