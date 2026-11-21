"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, RefreshCw, Filter, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationCategory } from "../types/notifications.types";
import { NotificationItem } from "@/components/molecules/NotificationItem";
import { TijarahCard } from "@/components/atom/tijarahCard";

export const NotificationsPanel: React.FC = () => {
  const t = useTranslations("notifications");
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | "ALL">("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingRead,
    refetch,
  } = useNotifications({
    category: selectedCategory,
    isRead: unreadOnly ? false : undefined,
  });

  const categories: { key: NotificationCategory | "ALL"; label: string }[] = [
    { key: "ALL", label: "Semua Notifikasi" },
    { key: "ORDER_STATUS", label: t("orders") || "Pesanan" },
    { key: "B2B_KASBON", label: t("kasbon") || "Kasbon B2B" },
    { key: "PROMO_VOUCHER", label: t("promo") || "Promo Voucher" },
    { key: "SYSTEM_ANNOUNCEMENT", label: t("system") || "Sistem" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-extrabold text-text-primary">
              {t("title")}
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-rose-500/15 text-rose-500 font-bold px-2.5 py-0.5 rounded-full border border-rose-500/20">
                {unreadCount} {t("unread")}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Pusat update status pesanan, mutasi limit kasbon B2B, dan voucher promo spesial.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              disabled={isMarkingRead}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-sage hover:underline cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t("markAllRead")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary cursor-pointer p-1.5 rounded-lg hover:bg-canvas"
            title="Muat ulang notifikasi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Quick Toggles */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary-sage text-white shadow-xs"
                    : "bg-surface text-text-muted hover:text-text-primary hover:bg-canvas border border-border-subtle/60"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Unread Only Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-xs text-text-muted font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-border-subtle text-primary-sage focus:ring-primary-sage h-3.5 w-3.5 accent-primary-sage"
            />
            <span>Hanya yang belum dibaca</span>
          </label>
        </div>
      </div>

      {/* Notification List Section */}
      <div className="space-y-3">
        {isLoading && notifications.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-muted space-y-3">
            <div className="w-8 h-8 border-2 border-primary-sage border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <TijarahCard tijarahVariant="default" className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-sage/10 text-primary-sage flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 opacity-60" />
            </div>
            <h4 className="font-bold text-sm text-text-primary mb-1">
              Tidak Ada Notifikasi
            </h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              {unreadOnly
                ? "Semua notifikasi pada kategori ini sudah dibaca."
                : t("empty")}
            </p>
          </TijarahCard>
        ) : (
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onRead={(id) => markAsRead(id)}
              onDelete={(id) => deleteNotification(id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
