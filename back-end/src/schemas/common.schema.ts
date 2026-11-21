import { z } from "zod";

// ==========================================
// 1. REUSABLE ATOMS (Validasi Dasar)
// ==========================================

/** Validasi UUIDv4 PostgreSQL */
export const zUUID = z
    .string()
    .uuid({ message: "Format ID tidak valid (harus UUID)" });

/** Validasi Angka Positif (Harga / Jumlah) */
export const zPositiveInt = z.coerce
    .number()
    .int()
    .min(1, { message: "Minimal bernilai 1" });
export const zPrice = z.coerce
    .number()
    .min(0, { message: "Harga tidak boleh negatif" });

/** Validasi Nomor HP Indonesia (08xx, 628xx, +628xx) */
export const zIndonesianPhone = z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/, {
        message: "Format nomor telepon Indonesia tidak valid",
    });

// ==========================================
// 2. COMMON OBJECT SCHEMAS (Parameter & Query)
// ==========================================

/** Skema untuk Params URL yang butuh ID (/users/:id atau /products/:id) */
export const idParamSchema = z.object({
    id: zUUID,
});

/** Skema Query String untuk Pagination & Search */
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    sort_by: z.string().optional(),
    order: z.enum(["asc", "desc"]).default("desc"),
});

// Helper ektraksi tipe TypeScript
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// ==========================================
// 3. RESPONSE WRAPPER HELPER
// ==========================================

/** Helper untuk membuat Standar Response JSON */
export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
    return z.object({
        success: z.boolean(),
        message: z.string(),
        data: dataSchema,
    });
};

/** Standar Response untuk List / Pagination */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
    itemSchema: T,
) => {
    return z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.array(itemSchema),
        meta: z.object({
            page: z.number(),
            limit: z.number(),
            total_items: z.number(),
            total_pages: z.number(),
        }),
    });
};

// ==========================================
// 4. ROUTE SCHEMA HELPER
// ==========================================

export interface RouteSchemaConfig {
    body?: z.ZodTypeAny;
    querystring?: z.ZodTypeAny;
    params?: z.ZodTypeAny;
    headers?: z.ZodTypeAny;
    response?: Record<number, z.ZodTypeAny>;
    description?: string;
    tags?: string[];
}

/**
 * Helper agar tidak perlu mengetik { schema: ... } berulang kali di rute Fastify.
 * Cukup masukkan objek definisi Anda, dan ia akan membungkusnya otomatis.
 */
export const validateSchema = (config: RouteSchemaConfig) => {
    return { schema: config };
};
