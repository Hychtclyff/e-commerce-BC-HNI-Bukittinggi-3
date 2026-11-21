import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
    getNotificationsSchema,
    getUnreadCountSchema,
    notificationIdParamSchema,
    bulkActionSchema,
} from "./notifications.schema";
import { notificationsController } from "./notifications.controller";

export async function notificationRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    // GET /api/v1/notifications
    server.get(
        "/",
        getNotificationsSchema,
        notificationsController.getNotifications
    );

    // GET /api/v1/notifications/unread-count
    server.get(
        "/unread-count",
        getUnreadCountSchema,
        notificationsController.getUnreadCount
    );

    // PATCH /api/v1/notifications/:id/read
    server.patch(
        "/:id/read",
        notificationIdParamSchema,
        notificationsController.markAsRead
    );

    // PATCH /api/v1/notifications/read-all
    server.patch(
        "/read-all",
        notificationsController.markAllAsRead
    );

    // POST /api/v1/notifications/bulk-read
    server.post(
        "/bulk-read",
        bulkActionSchema,
        notificationsController.bulkMarkAsRead
    );

    // POST /api/v1/notifications/bulk-delete
    server.post(
        "/bulk-delete",
        bulkActionSchema,
        notificationsController.bulkDelete
    );

    // DELETE /api/v1/notifications/:id
    server.delete(
        "/:id",
        notificationIdParamSchema,
        notificationsController.deleteNotification
    );
}
