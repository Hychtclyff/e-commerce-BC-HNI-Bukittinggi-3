import { db } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";
import { GetNotificationsQuery } from "./notifications.schema";

export const notificationsService = {
    async createNotification(payload: {
        userId: string;
        title: string;
        message: string;
        category: "ORDER_STATUS" | "B2B_KASBON" | "PROMO_VOUCHER" | "SYSTEM";
        referenceId?: string;
    }) {
        try {
            return await db.orm.notifications.Notification.create({
                userId: payload.userId,
                title: payload.title,
                message: payload.message,
                category: payload.category,
                referenceId: payload.referenceId || undefined,
                isRead: false,
            });
        } catch (error) {
            console.error("Failed to create notification:", error);
            return null;
        }
    },

    async getNotifications(userId: string, query: GetNotificationsQuery, lang: SupportedLanguage = "id") {
        try {
            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;

            let list = await db.orm.notifications.Notification
                .where({ userId })
                .all();

            if (query.category) {
                list = list.filter(n => n.category === query.category);
            }

            if (query.unreadOnly) {
                list = list.filter(n => !n.isRead);
            }

            // Sort by createdAt desc
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const totalItems = list.length;
            const totalPages = Math.ceil(totalItems / limit) || 1;
            const paginatedData = list.slice(skip, skip + limit);

            const allUserNotifications = await db.orm.notifications.Notification.where({ userId }).all();
            const unreadTotal = allUserNotifications.filter(n => !n.isRead).length;

            return {
                data: paginatedData,
                meta: {
                    page,
                    limit,
                    totalItems,
                    totalPages,
                    unreadTotal,
                },
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('notifications.get_notifications_failed', { message: error.message }, lang), 500);
        }
    },

    async getUnreadCount(userId: string, lang: SupportedLanguage = "id") {
        try {
            const list = await db.orm.notifications.Notification.where({ userId }).all();
            const unreadCount = list.filter(n => !n.isRead).length;
            return { unreadCount };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('notifications.get_notifications_failed', { message: error.message }, lang), 500);
        }
    },

    async markAsRead(notificationId: string, userId?: string, lang: SupportedLanguage = "id") {
        try {
            const notification = await db.orm.notifications.Notification.where({ id: notificationId }).first();
            if (!notification) {
                throw new AppError(t('notifications.not_found', {}, lang), 404);
            }

            if (userId && notification.userId !== userId) {
                throw new AppError(t('common.forbidden', {}, lang), 403);
            }

            await db.orm.notifications.Notification
                .where({ id: notification.id })
                .update({
                    isRead: true,
                    readAt: new Date().toISOString(),
                });

            return { id: notification.id, isRead: true };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('notifications.mark_read_failed', { message: error.message }, lang), 500);
        }
    },

    async markAllAsRead(userId: string, lang: SupportedLanguage = "id") {
        try {
            const unreadList = await db.orm.notifications.Notification
                .where({ userId })
                .all();

            const nowIso = new Date().toISOString();
            for (const n of unreadList) {
                if (!n.isRead) {
                    await db.orm.notifications.Notification
                        .where({ id: n.id })
                        .update({ isRead: true, readAt: nowIso });
                }
            }

            return { updatedCount: unreadList.filter(n => !n.isRead).length };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('notifications.mark_all_read_failed', { message: error.message }, lang), 500);
        }
    },

    async deleteNotification(notificationId: string, userId?: string, lang: SupportedLanguage = "id") {
        try {
            const notification = await db.orm.notifications.Notification.where({ id: notificationId }).first();
            if (!notification) {
                throw new AppError(t('notifications.not_found', {}, lang), 404);
            }

            if (userId && notification.userId !== userId) {
                throw new AppError(t('common.forbidden', {}, lang), 403);
            }

            await db.orm.notifications.Notification
                .where({ id: notification.id })
                .delete();

            return { id: notificationId, deleted: true };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('notifications.delete_failed', { message: error.message }, lang), 500);
        }
    },

    async bulkMarkAsRead(ids: string[], userId?: string, lang: SupportedLanguage = "id") {
        try {
            const nowIso = new Date().toISOString();
            let count = 0;
            for (const id of ids) {
                const notif = await db.orm.notifications.Notification.where({ id }).first();
                if (notif && (!userId || notif.userId === userId)) {
                    if (!notif.isRead) {
                        await db.orm.notifications.Notification.where({ id }).update({
                            isRead: true,
                            readAt: nowIso,
                        });
                        count++;
                    }
                }
            }
            return { updatedCount: count };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('notifications.mark_read_failed', { message: error.message }, lang), 500);
        }
    },

    async bulkDelete(ids: string[], userId?: string, lang: SupportedLanguage = "id") {
        try {
            let count = 0;
            for (const id of ids) {
                const notif = await db.orm.notifications.Notification.where({ id }).first();
                if (notif && (!userId || notif.userId === userId)) {
                    await db.orm.notifications.Notification.where({ id }).delete();
                    count++;
                }
            }
            return { deletedCount: count };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('notifications.delete_failed', { message: error.message }, lang), 500);
        }
    }
};
