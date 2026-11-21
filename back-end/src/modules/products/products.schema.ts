import { z } from "zod";
import { validateSchema } from "@/schemas/common.schema";
import { enumSupportedLanguage } from "@/i18n";

export const getProductsQuerySchema = z.object({
    lang: z.enum(enumSupportedLanguage).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(20),
});

export const getProductsSchema = validateSchema({
    querystring: getProductsQuerySchema,
});

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
