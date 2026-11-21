import { z } from "zod";
import { getNotificationsQuerySchema } from "./notifications.schema";

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

export type NotificationCategory =
    | "ORDER_STATUS"
    | "B2B_KASBON"
    | "PROMO_VOUCHER"
    | "SYSTEM_ANNOUNCEMENT";

export interface NotificationItem {
    id: string;
    userId: string;
    title: string;
    message: string;
    category: NotificationCategory;
    isRead: boolean;
    actionUrl?: string;
    createdAt: string;
}
