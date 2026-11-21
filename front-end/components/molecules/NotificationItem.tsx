"use client";

import React from "react";
import { Package, CreditCard, Tag, Info, ChevronRight, Check } from "lucide-react";
import { NotificationItem as NotificationItemType, NotificationCategory } from "@/modules/notifications/types/notifications.types";
import Link from "next/link";

interface NotificationItemProps {
  item: NotificationItemType;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const getCategoryIcon = (category: NotificationCategory) => {
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

export const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onRead,
  onDelete,
}) => {
  const handleClick = () => {
    if (!item.isRead && onRead) {
      onRead(item.id);
    }
  };

  const formattedDate = () => {
    try {
      const date = new Date(item.createdAt);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return item.createdAt;
    }
  };

  const targetUrl = item.category === "ORDER_STATUS" && item.referenceId
    ? `/orders/${item.referenceId}`
    : item.actionUrl;

  const content = (
    <div
      onClick={handleClick}
      className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
        !item.isRead
          ? "border-primary-sage/30 bg-primary-sage/5 shadow-xs"
          : "border-border-subtle bg-surface hover:border-primary-sage/30 hover:bg-canvas/60"
      }`}
    >
      {/* Category Icon */}
      <div
        className={`mt-0.5 p-2 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
          !item.isRead
            ? "bg-surface border border-primary-sage/20 text-primary-sage"
            : "bg-canvas border border-border-subtle text-text-muted"
        }`}
      >
        {getCategoryIcon(item.category)}
      </div>

      {/* Main Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4
            className={`text-xs truncate ${
              !item.isRead
                ? "text-text-primary font-bold"
                : "text-text-muted font-medium"
            }`}
          >
            {item.title}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            {!item.isRead && (
              <span className="w-2 h-2 rounded-full bg-primary-sage ring-2 ring-primary-sage/30 animate-pulse" />
            )}
            <span className="text-[10px] text-text-muted font-medium">
              {formattedDate()}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
          {item.message}
        </p>

        {targetUrl && (
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary-sage group-hover:translate-x-0.5 transition-transform">
            <span>{item.category === "ORDER_STATUS" ? "Lihat detail pesanan" : "Buka detail"}</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );

  if (targetUrl) {
    return (
      <Link href={targetUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
};

export default NotificationItem;
