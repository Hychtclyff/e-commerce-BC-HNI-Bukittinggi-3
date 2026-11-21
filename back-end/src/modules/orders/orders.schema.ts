import { z } from "zod";
import { validateSchema } from "@/schemas/common.schema";

export const getUserOrdersQuerySchema = z.object({
    userId: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    status: z.string().optional().default("ALL"),
    paymentMethod: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const cancelOrderBodySchema = z.object({
    reason: z.string().optional().default("Dibatalkan oleh pelanggan"),
});

export const getUserOrdersSchema = validateSchema({
    querystring: getUserOrdersQuerySchema,
});

export const getOrderStatusCountsSchema = validateSchema({
    querystring: z.object({
        userId: z.string().optional(),
    }),
});

export const getOrderDetailSchema = validateSchema({
    params: z.object({
        id: z.string(),
    }),
});

export const cancelOrderSchema = validateSchema({
    params: z.object({
        id: z.string(),
    }),
    body: cancelOrderBodySchema,
});

export const confirmDeliveredSchema = validateSchema({
    params: z.object({
        id: z.string(),
    }),
});

export type GetUserOrdersQuery = z.infer<typeof getUserOrdersQuerySchema>;
export type CancelOrderBody = z.infer<typeof cancelOrderBodySchema>;
