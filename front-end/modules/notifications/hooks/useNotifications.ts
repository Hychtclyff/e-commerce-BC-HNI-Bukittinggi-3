"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../api/notifications.api";
import { NotificationItem, NotificationCategory } from "../types/notifications.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";

export interface UseNotificationsOptions {
  category?: NotificationCategory | "ALL";
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const userId = authUser?.id || (typeof window !== "undefined" ? useAuthStore.getState().user?.id : undefined);

  const queryParams = {
    userId,
    category: options.category && options.category !== "ALL" ? options.category : undefined,
    isRead: options.isRead,
    page: options.page || 1,
    limit: options.limit || 20,
  };

  // 1. Fetch Notification List
  const {
    data: notifData,
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["user-notifications", userId, queryParams],
    queryFn: async () => {
      return await notificationsApi.getNotifications(queryParams);
    },
    staleTime: 1000 * 15, // 15 detik
  });

  // 2. Fetch Unread Count (Polled every 30s)
  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount,
  } = useQuery({
    queryKey: ["user-notifications-unread", userId],
    queryFn: async () => {
      return await notificationsApi.getUnreadCount(userId);
    },
    refetchInterval: 1000 * 30, // 30 seconds
    staleTime: 1000 * 10,
  });

  // 3. Mark Single as Read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.markAsRead(id, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
    },
  });

  // 4. Mark All as Read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await notificationsApi.markAllAsRead(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
    },
  });

  // 5. Delete Notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.deleteNotification(id, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
    },
  });

  // 6. Bulk Mark as Read
  const bulkMarkAsReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await notificationsApi.bulkMarkAsRead(ids, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
    },
  });

  // 7. Bulk Delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await notificationsApi.bulkDelete(ids, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
    },
  });

  return {
    notifications: notifData?.data ?? [],
    unreadCount: notifData?.unreadCount ?? unreadCount,
    total: notifData?.total ?? 0,
    totalPages: notifData?.totalPages ?? 1,
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
    error: notificationsError,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: string) => deleteNotificationMutation.mutate(id),
    bulkMarkAsRead: (ids: string[]) => bulkMarkAsReadMutation.mutate(ids),
    bulkDelete: (ids: string[]) => bulkDeleteMutation.mutate(ids),
    isMarkingRead: markAsReadMutation.isPending || markAllAsReadMutation.isPending || bulkMarkAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending || bulkDeleteMutation.isPending,
    isBulkOperating: bulkMarkAsReadMutation.isPending || bulkDeleteMutation.isPending,
    refetch: () => {
      refetchNotifications();
      refetchUnreadCount();
    },
  };
}

export default useNotifications;
