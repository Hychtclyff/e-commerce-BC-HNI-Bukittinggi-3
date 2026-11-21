import apiClient from "@/lib/axios/client";
import { NotificationItem, NotificationsResponse } from "../types/notifications.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";

const resolveUserId = (userId?: string): string | undefined => {
  if (userId) return userId;
  if (typeof window !== "undefined") {
    return useAuthStore.getState().user?.id || undefined;
  }
  return undefined;
};

export const notificationsApi = {
  /**
   * GET /api/v1/user/notifications
   * Mengambil daftar notifikasi pengguna
   */
  async getNotifications(params?: {
    userId?: string;
    category?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: NotificationItem[]; unreadCount: number; total: number; totalPages: number }> {
    const userId = resolveUserId(params?.userId);
    const unreadOnly = params?.isRead === false ? "true" : undefined;
    const res = await apiClient.get("/user/notifications", {
      params: {
        ...params,
        userId,
        unreadOnly,
      },
    });
    const body = res.data;
    const list: NotificationItem[] = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
      ? body
      : [];

    const unread =
      typeof body?.unreadCount === "number"
        ? body.unreadCount
        : typeof body?.meta?.unreadTotal === "number"
        ? body.meta.unreadTotal
        : list.filter((n) => !n.isRead).length;

    const total =
      typeof body?.meta?.totalItems === "number"
        ? body.meta.totalItems
        : typeof body?.total === "number"
        ? body.total
        : list.length;

    const totalPages =
      typeof body?.meta?.totalPages === "number"
        ? body.meta.totalPages
        : 1;

    return {
      data: list,
      unreadCount: unread,
      total,
      totalPages,
    };
  },

  /**
   * GET /api/v1/user/notifications/unread-count
   * Mengambil jumlah notifikasi belum dibaca
   */
  async getUnreadCount(userId?: string): Promise<number> {
    const resolvedUserId = resolveUserId(userId);
    const res = await apiClient.get("/user/notifications/unread-count", {
      params: resolvedUserId ? { userId: resolvedUserId } : undefined,
    });
    return (
      res.data?.unreadCount ??
      res.data?.data?.unreadCount ??
      res.data?.data?.unreadTotal ??
      res.data?.meta?.unreadTotal ??
      0
    );
  },

  /**
   * PATCH /api/v1/user/notifications/:id/read
   * Menandai notifikasi sebagai sudah dibaca
   */
  async markAsRead(id: string, userId?: string): Promise<void> {
    const resolvedUserId = resolveUserId(userId);
    await apiClient.patch(`/user/notifications/${id}/read`, null, {
      params: resolvedUserId ? { userId: resolvedUserId } : undefined,
    });
  },

  /**
   * PATCH /api/v1/user/notifications/read-all
   * Menandai semua notifikasi pengguna sebagai sudah dibaca
   */
  async markAllAsRead(userId?: string): Promise<void> {
    const resolvedUserId = resolveUserId(userId);
    await apiClient.patch("/user/notifications/read-all", null, {
      params: resolvedUserId ? { userId: resolvedUserId } : undefined,
    });
  },

  /**
   * DELETE /api/v1/user/notifications/:id
   * Menghapus notifikasi
   */
  async deleteNotification(id: string, userId?: string): Promise<void> {
    const resolvedUserId = resolveUserId(userId);
    await apiClient.delete(`/user/notifications/${id}`, {
      params: resolvedUserId ? { userId: resolvedUserId } : undefined,
    });
  },

  /**
   * POST /api/v1/user/notifications/bulk-read
   * Menandai multiple notifikasi sebagai sudah dibaca
   */
  async bulkMarkAsRead(ids: string[], userId?: string): Promise<void> {
    const resolvedUserId = resolveUserId(userId);
    await apiClient.post(
      "/user/notifications/bulk-read",
      { ids },
      { params: resolvedUserId ? { userId: resolvedUserId } : undefined }
    );
  },

  /**
   * POST /api/v1/user/notifications/bulk-delete
   * Menghapus multiple notifikasi sekaligus
   */
  async bulkDelete(ids: string[], userId?: string): Promise<void> {
    const resolvedUserId = resolveUserId(userId);
    await apiClient.post(
      "/user/notifications/bulk-delete",
      { ids },
      { params: resolvedUserId ? { userId: resolvedUserId } : undefined }
    );
  },
};

export default notificationsApi;
