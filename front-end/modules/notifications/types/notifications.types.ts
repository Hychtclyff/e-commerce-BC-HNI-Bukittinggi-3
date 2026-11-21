export type NotificationCategory =
  | "ORDER_STATUS"
  | "B2B_KASBON"
  | "PROMO_VOUCHER"
  | "SYSTEM_ANNOUNCEMENT";

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  referenceId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  unreadCount: number;
  total: number;
  totalPages?: number;
}
