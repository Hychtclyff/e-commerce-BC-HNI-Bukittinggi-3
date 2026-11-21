import { z } from "zod";
import { validateSchema } from "@/schemas/common.schema";

export const getNotificationsQuerySchema = z.object({
    userId: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    category: z.string().optional(),
    unreadOnly: z.string().optional().transform((val) => val === "true"),
});

export const getNotificationsSchema = validateSchema({
    querystring: getNotificationsQuerySchema,
});

export const getUnreadCountSchema = validateSchema({
    querystring: z.object({
        userId: z.string().optional(),
    }),
});

export const notificationIdParamSchema = validateSchema({
    params: z.object({
        id: z.string(),
    }),
});

export const bulkActionSchema = validateSchema({
    body: z.object({
        ids: z.array(z.string()).min(1),
    }),
    querystring: z.object({
        userId: z.string().optional(),
    }),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;
