"use client";

import React, { useState, useMemo } from "react";
import {
  Bell,
  Package,
  CreditCard,
  Tag,
  Info,
  CheckCheck,
  Check,
  Trash2,
  RefreshCw,
  Search,
  X,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Inbox,
  Filter,
  CheckCircle2,
  Clock,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationCategory, NotificationItem } from "../types/notifications.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";

export const NotificationsViewAllPage: React.FC = () => {
  const t = useTranslations("notifications");

  // State controls
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | "ALL">("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Hook with query params
  const {
    notifications,
    unreadCount,
    total,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkMarkAsRead,
    bulkDelete,
    isMarkingRead,
    isDeleting,
    isBulkOperating,
    refetch,
  } = useNotifications({
    category: selectedCategory,
    isRead: unreadOnly ? false : undefined,
    limit: 100, // Fetch up to 100 on the full view page
  });

  // Calculate KPI stats across active notifications
  const stats = useMemo(() => {
    let orderCount = 0;
    let kasbonCount = 0;
    let promoCount = 0;
    let systemCount = 0;

    notifications.forEach((item) => {
      if (item.category === "ORDER_STATUS") orderCount++;
      else if (item.category === "B2B_KASBON") kasbonCount++;
      else if (item.category === "PROMO_VOUCHER") promoCount++;
      else if (item.category === "SYSTEM_ANNOUNCEMENT") systemCount++;
    });

    return {
      orderCount,
      kasbonPromoCount: kasbonCount + promoCount,
      systemCount,
    };
  }, [notifications]);

  // Client-side search filtering on title, message, and referenceId
  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) {
      return notifications;
    }
    const q = searchQuery.toLowerCase().trim();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.referenceId && n.referenceId.toLowerCase().includes(q))
    );
  }, [notifications, searchQuery]);

  // Category Configuration
  const categories: {
    key: NotificationCategory | "ALL";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: "ALL", label: t("all") || "Semua", icon: <Bell className="w-3.5 h-3.5" /> },
    { key: "ORDER_STATUS", label: t("orders") || "Pesanan", icon: <Package className="w-3.5 h-3.5" /> },
    { key: "B2B_KASBON", label: t("kasbon") || "Kasbon B2B", icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: "PROMO_VOUCHER", label: t("promo") || "Promo", icon: <Tag className="w-3.5 h-3.5" /> },
    { key: "SYSTEM_ANNOUNCEMENT", label: t("system") || "Sistem", icon: <Info className="w-3.5 h-3.5" /> },
  ];

  // Helper for category badge styling and contextual redirection
  const getCategoryMeta = (item: NotificationItem) => {
    switch (item.category) {
      case "ORDER_STATUS": {
        // Alihkan view order ke /orders/[orderId] jika referenceId tersedia
        const orderUrl = item.referenceId
          ? `/orders/${item.referenceId}`
          : item.actionUrl || "/profile?tab=orders";

        return {
          icon: <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
          name: t("orders") || "Pesanan",
          actionText: t("actionOrder") || "Lihat Detail Pesanan",
          actionUrl: orderUrl,
          buttonVariant: "outline" as const,
        };
      }
      case "B2B_KASBON":
        return {
          icon: <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
          name: t("kasbon") || "Kasbon B2B",
          actionText: t("actionKasbon") || "Cek Plafon Kasbon",
          actionUrl: item.actionUrl || "/profile?tab=kasbon",
          buttonVariant: "gold" as const,
        };
      case "PROMO_VOUCHER":
        return {
          icon: <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
          badgeBg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
          name: t("promo") || "Promo",
          actionText: t("actionPromo") || "Lihat Promo & Belanja",
          actionUrl: item.actionUrl || "/shop",
          buttonVariant: "primary" as const,
        };
      case "SYSTEM_ANNOUNCEMENT":
      default:
        return {
          icon: <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
          badgeBg: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
          name: t("system") || "Sistem",
          actionText: t("actionSystem") || "Buka Informasi",
          actionUrl: item.actionUrl || "/profile",
          buttonVariant: "secondary" as const,
        };
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMinutes < 1) return "Baru saja";
      if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;

      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Selection Logic
  const isAllSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.includes(n.id));

  const isSomeSelected =
    selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkMarkRead = () => {
    if (selectedIds.length === 0) return;
    bulkMarkAsRead(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(
      t("deleteConfirm", { count: selectedIds.length }) ||
        `Yakin ingin menghapus ${selectedIds.length} notifikasi terpilih?`
    );
    if (!ok) return;
    bulkDelete(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div id="notifications-view-all-page" className="w-full pb-24 space-y-6">
      {/* 1. Breadcrumbs */}
      <nav
        id="notifications-breadcrumbs"
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-text-muted"
      >
        <Link
          href="/"
          className="hover:text-primary-sage transition-colors font-medium flex items-center gap-1"
        >
          {t("breadcrumbHome") || "Beranda"}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted/50" />
        <span className="font-semibold text-text-primary">
          {t("breadcrumbNotifications") || "Pusat Notifikasi"}
        </span>
      </nav>

      {/* 2. Hero Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-surface border border-border-subtle shadow-sm mac-glass">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary-sage/20 to-primary-sage/5 border border-primary-sage/25 text-primary-sage shadow-xs shrink-0">
            <Bell className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                id="notifications-main-heading"
                className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-text-primary"
              >
                {t("pageTitle") || "Pusat Notifikasi"}
              </h1>
              {unreadCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {unreadCount} {t("unread") || "Belum Dibaca"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Semua Terbaca
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
              {t("pageSubtitle") ||
                "Pantau riwayat pembaruan status pesanan, mutasi limit kasbon B2B, dan voucher promo resmi BC HNI 3 Bukittinggi secara real-time."}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          {unreadCount > 0 && (
            <TijarahButton
              id="notifications-mark-all-read-btn"
              tijarahVariant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              isLoading={isMarkingRead}
              className="text-xs font-semibold"
              startContent={<CheckCheck className="w-4 h-4" />}
            >
              {t("markAllRead") || "Tandai Semua Dibaca"}
            </TijarahButton>
          )}

          <TijarahButton
            id="notifications-refresh-btn"
            tijarahVariant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="text-xs font-semibold"
            startContent={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            {t("refresh") || "Segarkan"}
          </TijarahButton>
        </div>
      </header>

      {/* 3. KPI Summary Stats */}
      <section
        id="notifications-kpi-summary"
        aria-label="Ringkasan Statistik Notifikasi"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Total Notifikasi */}
        <TijarahCard
          tijarahVariant="default"
          className="p-4 sm:p-5 relative overflow-hidden group hover:border-primary-sage/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              {t("kpiTotal") || "Total Notifikasi"}
            </span>
            <div className="p-2 rounded-xl bg-primary-sage/10 text-primary-sage">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              {total || notifications.length}
            </span>
            <span className="text-[11px] text-text-muted">pesan</span>
          </div>
        </TijarahCard>

        {/* Belum Dibaca */}
        <TijarahCard
          tijarahVariant="default"
          className="p-4 sm:p-5 relative overflow-hidden group hover:border-rose-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              {t("kpiUnread") || "Belum Dibaca"}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {unreadCount}
            </span>
            <span className="text-[11px] text-text-muted">butuh aksi</span>
          </div>
        </TijarahCard>

        {/* Pesanan & Logistik */}
        <TijarahCard
          tijarahVariant="default"
          className="p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              {t("kpiOrders") || "Pesanan & Logistik"}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              {stats.orderCount}
            </span>
            <span className="text-[11px] text-text-muted">update</span>
          </div>
        </TijarahCard>

        {/* Kasbon & Promo */}
        <TijarahCard
          tijarahVariant="default"
          className="p-4 sm:p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              {t("kpiKasbonPromo") || "Kasbon & Promo"}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              {stats.kasbonPromoCount}
            </span>
            <span className="text-[11px] text-text-muted">kesempatan</span>
          </div>
        </TijarahCard>
      </section>

      {/* 4. Filter & Search Controls */}
      <section
        id="notifications-filter-controls"
        aria-label="Filter dan Pencarian Notifikasi"
        className="p-4 rounded-2xl bg-surface border border-border-subtle shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="notifications-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder") || "Cari judul notifikasi atau kata kunci..."}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-canvas border border-border-subtle text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-sage/30 focus:border-primary-sage transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Master Select All Checkbox */}
            {filteredNotifications.length > 0 && (
              <button
                type="button"
                id="notifications-master-select-all-btn"
                onClick={handleSelectAll}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isAllSelected
                    ? "bg-primary-sage text-white border-primary-sage"
                    : "bg-canvas border-border-subtle text-text-primary hover:bg-border-subtle/30"
                }`}
                title={isAllSelected ? "Batalkan pilihan semua" : "Pilih semua notifikasi"}
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : isSomeSelected ? (
                  <MinusSquare className="w-4 h-4 text-primary-sage" />
                ) : (
                  <Square className="w-4 h-4 text-text-muted" />
                )}
                <span>{isAllSelected ? (t("deselectAll") || "Batal Pilih") : (t("selectAll") || "Pilih Semua")}</span>
              </button>
            )}

            {/* Quick Toggle Unread Only */}
            <label className="flex items-center gap-2.5 text-xs font-semibold text-text-primary cursor-pointer select-none px-3 py-2 rounded-xl bg-canvas border border-border-subtle hover:bg-border-subtle/30 transition-colors shrink-0">
              <input
                id="notifications-unread-checkbox"
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded border-border-subtle text-primary-sage focus:ring-primary-sage h-4 w-4 accent-primary-sage cursor-pointer"
              />
              <span>{t("unreadOnly") || "Hanya belum dibaca"}</span>
            </label>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                id={`notifications-filter-${cat.key.toLowerCase()}`}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary-sage text-white shadow-xs"
                    : "bg-canvas text-text-muted hover:text-text-primary hover:bg-border-subtle/40 border border-border-subtle/80"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Sticky Floating Bulk Actions Toolbar (Appears when items are selected) */}
      {selectedIds.length > 0 && (
        <aside
          id="notifications-bulk-actions-toolbar"
          aria-label="Aksi Notifikasi Terpilih"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md border border-primary-sage/40 shadow-2xl rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-sage text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-text-primary">
                {t("bulkSelected", { count: selectedIds.length }) ||
                  `${selectedIds.length} notifikasi dipilih`}
              </p>
              <p className="text-[11px] text-text-muted">Pilih aksi massal untuk diterapkan</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <TijarahButton
              id="notifications-bulk-read-btn"
              size="sm"
              tijarahVariant="primary"
              onClick={handleBulkMarkRead}
              isLoading={isBulkOperating}
              className="text-xs font-semibold h-8.5 px-3"
              startContent={<CheckCheck className="w-3.5 h-3.5" />}
            >
              {t("bulkMarkRead") || "Tandai Dibaca"}
            </TijarahButton>

            <TijarahButton
              id="notifications-bulk-delete-btn"
              size="sm"
              tijarahVariant="danger"
              onClick={handleBulkDelete}
              isLoading={isBulkOperating}
              className="text-xs font-semibold h-8.5 px-3"
              startContent={<Trash2 className="w-3.5 h-3.5" />}
            >
              {t("bulkDelete") || "Hapus"}
            </TijarahButton>

            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors cursor-pointer"
              title="Batalkan pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* 6. Notification List Section */}
      <section id="notifications-list-section" aria-label="Daftar Notifikasi" className="space-y-3">
        {isLoading && notifications.length === 0 ? (
          /* Skeleton Loading Cards */
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl border border-border-subtle bg-surface/50 animate-pulse flex items-start gap-4"
              >
                <div className="w-5 h-5 rounded bg-border-subtle/50 shrink-0 mt-2" />
                <div className="w-10 h-10 rounded-xl bg-border-subtle/50 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border-subtle/60 rounded w-1/3" />
                  <div className="h-3 bg-border-subtle/40 rounded w-3/4" />
                  <div className="h-3 bg-border-subtle/30 rounded w-1/4 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Zero State / Empty Results */
          <TijarahCard tijarahVariant="default" className="py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary-sage/10 text-primary-sage flex items-center justify-center mx-auto mb-4 border border-primary-sage/20 shadow-xs">
              <Inbox className="w-8 h-8 opacity-70" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1.5">
              {searchQuery || unreadOnly || selectedCategory !== "ALL"
                ? "Tidak Ada Notifikasi Sesuai Filter"
                : "Belum Ada Notifikasi"}
            </h3>
            <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto mb-5 leading-relaxed">
              {searchQuery || unreadOnly || selectedCategory !== "ALL"
                ? t("noFilteredResults") ||
                  "Tidak ada notifikasi yang sesuai dengan filter atau kata kunci pencarian aktif Anda."
                : t("empty") ||
                  "Anda belum memiliki riwayat notifikasi baru. Aktivitas pesanan, limit kasbon, dan promo akan muncul di sini."}
            </p>

            {(searchQuery || unreadOnly || selectedCategory !== "ALL") && (
              <TijarahButton
                tijarahVariant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setUnreadOnly(false);
                  setSearchQuery("");
                }}
                className="text-xs font-semibold inline-flex"
                startContent={<Filter className="w-3.5 h-3.5" />}
              >
                {t("resetFilter") || "Reset Filter"}
              </TijarahButton>
            )}
          </TijarahCard>
        ) : (
          /* Rich Notification Cards */
          filteredNotifications.map((item) => {
            const meta = getCategoryMeta(item);
            const destinationUrl = meta.actionUrl;
            const isSelected = selectedIds.includes(item.id);

            return (
              <article
                key={item.id}
                id={`notification-card-${item.id}`}
                className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 ${
                  isSelected
                    ? "ring-2 ring-primary-sage/70 border-primary-sage bg-primary-sage/[0.09] dark:bg-primary-sage/[0.12] shadow-sm"
                    : !item.isRead
                    ? "border-primary-sage/40 bg-gradient-to-r from-primary-sage/[0.07] via-surface to-surface shadow-xs hover:border-primary-sage/60 ring-1 ring-primary-sage/20"
                    : "border-border-subtle bg-surface hover:bg-canvas/80 hover:border-border-subtle"
                }`}
              >
                {/* Select Checkbox + Category Icon Box */}
                <div className="flex items-center sm:items-start gap-3 shrink-0">
                  {/* Select Checkbox */}
                  <label
                    className="p-1 cursor-pointer select-none rounded-lg hover:bg-canvas transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggleSelect(item.id, e as any)}
                      aria-label={`Pilih notifikasi ${item.title}`}
                      className="rounded border-border-subtle text-primary-sage focus:ring-primary-sage h-4.5 w-4.5 accent-primary-sage cursor-pointer"
                    />
                  </label>

                  {/* Category Icon Badge */}
                  <div
                    className={`p-3 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      !item.isRead
                        ? "bg-surface border border-primary-sage/30 ring-2 ring-primary-sage/10"
                        : "bg-canvas border border-border-subtle text-text-muted"
                    }`}
                  >
                    {meta.icon}
                  </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Category Pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${meta.badgeBg}`}
                      >
                        {meta.name}
                      </span>

                      {/* Reference ID Pill if present */}
                      {item.referenceId && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-canvas border border-border-subtle text-text-muted">
                          #{item.referenceId.slice(0, 8)}
                        </span>
                      )}

                      {/* Unread dot */}
                      {!item.isRead && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-sage">
                          <span className="w-2 h-2 rounded-full bg-primary-sage ring-2 ring-primary-sage/30 animate-pulse" />
                          Baru
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-[11px] text-text-muted shrink-0">
                      <Clock className="w-3 h-3 text-text-muted/70" />
                      <span>{formatTimestamp(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2
                    className={`text-sm sm:text-base leading-snug ${
                      !item.isRead
                        ? "font-extrabold text-text-primary"
                        : "font-semibold text-text-primary"
                    }`}
                  >
                    {item.title}
                  </h2>

                  {/* Message */}
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed whitespace-pre-line">
                    {item.message}
                  </p>

                  {/* Action CTA & Footer Options */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle/50 mt-3">
                    {/* Primary Contextual Action Button (Redirects to /orders/[orderId] for ORDER_STATUS) */}
                    <div>
                      {destinationUrl ? (
                        <Link
                          href={destinationUrl}
                          onClick={() => {
                            if (!item.isRead) markAsRead(item.id);
                          }}
                        >
                          <TijarahButton
                            size="sm"
                            tijarahVariant={meta.buttonVariant}
                            className="text-xs font-semibold h-8 px-3"
                            endContent={
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            }
                          >
                            {meta.actionText}
                          </TijarahButton>
                        </Link>
                      ) : null}
                    </div>

                    {/* Secondary Actions: Mark Read / Delete */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center ml-auto">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => markAsRead(item.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-primary-sage p-1.5 rounded-lg hover:bg-canvas transition-colors cursor-pointer"
                          title={t("markAsRead") || "Tandai sudah dibaca"}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t("markAsRead") || "Tandai Dibaca"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteNotification(item.id)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                        title={t("delete") || "Hapus notifikasi"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t("delete") || "Hapus"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default NotificationsViewAllPage;
