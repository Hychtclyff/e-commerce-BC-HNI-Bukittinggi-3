"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Package, CreditCard, Tag, Info, ExternalLink, Check } from "lucide-react";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { NotificationCategory } from "@/modules/notifications/types/notifications.types";

export const NotificationBell: React.FC = () => {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    isLoading,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "ORDER_STATUS":
        return <Package className="w-4 h-4 text-primary-sage" />;
      case "B2B_KASBON":
        return <CreditCard className="w-4 h-4 text-accent-gold" />;
      case "PROMO_VOUCHER":
        return <Tag className="w-4 h-4 text-status-warning" />;
      case "SYSTEM_ANNOUNCEMENT":
      default:
        return <Info className="w-4 h-4 text-text-muted" />;
    }
  };

  const filteredNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Bell Button */}
      <button
        id="navbar-notification-bell-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
        title="Pusat Notifikasi"
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer focus:outline-none ${
          isOpen
            ? "text-primary-sage bg-primary-sage/15 ring-2 ring-primary-sage/30 shadow-xs"
            : "text-text-muted hover:text-text-primary hover:bg-canvas"
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-status-danger text-[9px] font-bold text-white shadow-sm ring-2 ring-surface animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border-subtle bg-surface shadow-2xl p-4 z-50 animate-in fade-in-50 slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-sage/10 text-primary-sage">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-text-primary">
                {t("title")}
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-primary-sage/15 text-primary-sage px-2 py-0.5 rounded-full">
                  {unreadCount} {t("unread")}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-[11px] font-semibold text-primary-sage hover:underline flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t("markAllRead")}</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(false)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                !filterUnreadOnly
                  ? "bg-primary-sage text-white shadow-xs font-semibold"
                  : "bg-canvas text-text-muted hover:text-text-primary"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(true)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                filterUnreadOnly
                  ? "bg-primary-sage text-white shadow-xs font-semibold"
                  : "bg-canvas text-text-muted hover:text-text-primary"
              }`}
            >
              {t("unread")} {unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          </div>

          {/* List Section */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-text-muted space-y-2">
                <div className="w-6 h-6 border-2 border-primary-sage border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Memuat notifikasi...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-canvas flex items-center justify-center text-text-muted">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p>{t("empty")}</p>
              </div>
            ) : (
              filteredNotifications.slice(0, 6).map((item) => {
                const targetUrl = item.category === "ORDER_STATUS" && item.referenceId
                  ? `/orders/${item.referenceId}`
                  : item.actionUrl;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.isRead) markAsRead(item.id);
                      setIsOpen(false);
                      if (targetUrl) router.push(targetUrl);
                    }}
                    className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                      !item.isRead
                        ? "border-primary-sage/30 bg-primary-sage/5 hover:bg-primary-sage/10"
                        : "border-border-subtle/60 bg-canvas/60 hover:bg-canvas"
                    }`}
                  >
                    <div className="mt-0.5 p-2 rounded-lg bg-surface border border-border-subtle shadow-xs shrink-0 flex items-center justify-center">
                      {getCategoryIcon(item.category)}
                    </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-xs truncate ${
                          !item.isRead
                            ? "font-bold text-text-primary"
                            : "font-medium text-text-primary"
                        }`}
                      >
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary-sage shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed mb-1">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-text-muted/80">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Footer View All */}
          <div className="mt-3 pt-2.5 border-t border-border-subtle text-center">
            <Link
              id="notification-bell-view-all-link"
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-sage hover:underline"
            >
              <span>{t("viewAll")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
