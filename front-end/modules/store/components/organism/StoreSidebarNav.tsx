"use client";

import React from "react";
import type { StoreTabType, StoreMetrics } from "../../types/store.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import clsx from "clsx";
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  CreditCard,
  Ticket,
  Printer,
  BarChart3,
  Store,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Users,
  Cpu,
  RefreshCw,
  Truck,
  UserCheck,
  BookOpen,
  Sparkles,
  MapPin,
  Newspaper,
  ScanBarcode,
  FileText,
  Mail,
  ImageIcon,
  FileSpreadsheet,
  RotateCcw,
  ShieldAlert,
  Settings,
} from "lucide-react";

export interface IStoreSidebarNavProps {
  activeTab: StoreTabType;
  onSelectTab: (tab: StoreTabType) => void;
  metrics: StoreMetrics;
  isMobileHorizontal?: boolean;
}

export const StoreSidebarNav: React.FC<IStoreSidebarNavProps> = ({
  activeTab,
  onSelectTab,
  metrics,
  isMobileHorizontal = false,
}) => {
  const t = useTranslations("storeErp.sidebar");
  const locale = useLocale();
  const isEn = locale === "en";
  const authUser = useAuthStore((state) => state.user);

  const ownerName = authUser?.fullName || authUser?.name || t("managerTitle");

  interface MenuItem {
    id: StoreTabType;
    label: string;
    icon: React.ReactNode;
    counter?: number;
    badgeText?: string;
    badgeType?: "danger" | "warning" | "neutral";
  }

  // Group 1: Menu Utama ERP
  const mainMenuItems: MenuItem[] = [
    {
      id: "overview",
      label: t("overview"),
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    // {
    //   id: "cashier",
    //   label: t("cashier"),
    //   icon: <ScanBarcode className="w-4 h-4 shrink-0" />,
    //   counter:
    //     metrics.pendingPickupCount && metrics.pendingPickupCount > 0
    //       ? metrics.pendingPickupCount
    //       : undefined,
    //   badgeText:
    //     !metrics.pendingPickupCount || metrics.pendingPickupCount === 0
    //       ? "POS"
    //       : undefined,
    //   badgeType:
    //     metrics.pendingPickupCount && metrics.pendingPickupCount > 0
    //       ? "warning"
    //       : "neutral",
    // },
    {
      id: "inventory",
      label: t("inventory"),
      icon: <Boxes className="w-4 h-4 shrink-0" />,
      counter: metrics.lowStockCount > 0 ? metrics.lowStockCount : undefined,
      badgeType: "warning",
    },
    {
      id: "hsis",
      label: t("hsisIntegrationTask"),
      icon: <RefreshCw className="w-4 h-4 shrink-0" />,
    },
    {
      id: "orders",
      label: t("orders"),
      icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
      counter: metrics.pendingApprovalCount + metrics.pendingShipmentCount,
      badgeType: "danger",
    },
    {
      id: "credit",
      label: t("credit"),
      icon: <CreditCard className="w-4 h-4 shrink-0" />,
      badgeText:
        metrics.pendingCreditCount > 0
          ? `${metrics.pendingCreditCount}`
          : "H+14",
      badgeType: metrics.pendingCreditCount > 0 ? "warning" : "neutral",
    },
    {
      id: "vouchers",
      label: t("vouchers"),
      icon: <Ticket className="w-4 h-4 shrink-0" />,
    },
  ];

  // Group 2: Sistem & Konfigurasi
  const systemMenuItems: MenuItem[] = [
    {
      id: "templates",
      label: t("templates"),
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: "devices",
      label: t("devices"),
      icon: <Printer className="w-4 h-4 shrink-0" />,
    },
    {
      id: "agents",
      label: t("agents"),
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      id: "restock",
      label: t("restock"),
      icon: <Boxes className="w-4 h-4 shrink-0" />,
    },
  ];

  // Group 3: Operasional & Integrasi
  const operationalMenuItems: MenuItem[] = [
    {
      id: "deliveryMethod",
      label: t("deliveryMethod"),
      icon: <MapPin className="w-4 h-4 shrink-0" />,
    },
    {
      id: "esignature",
      label: t("esignature"),
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
    },
    {
      id: "productKnowledge",
      label: t("productKnowledge"),
      icon: <BookOpen className="w-4 h-4 shrink-0 text-accent-gold" />,
    },
    {
      id: "news",
      label: t("news"),
      icon: <Newspaper className="w-4 h-4 shrink-0" />,
    },
    {
      id: "contacts" as StoreTabType,
      label: useLocale() === "en" ? "Contact Management" : "Manajemen Kontak",
      icon: <Mail className="w-4 h-4 shrink-0" />,
    },
    {
      id: "media" as StoreTabType,
      label: useLocale() === "en" ? "Media & PDFs" : "Media & Dokumen PDF",
      icon: <ImageIcon className="w-4 h-4 shrink-0" />,
    },
    {
      id: "reports",
      label: t("reports"),
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      id: "returns" as StoreTabType,
      label: useLocale() === "en" ? "Order Returns" : "Retur & Komplain",
      icon: <RotateCcw className="w-4 h-4 shrink-0" />,
    },
    {
      id: "auditLogs" as StoreTabType,
      label: useLocale() === "en" ? "Audit Trail" : "Audit Aktivitas",
      icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
    },
    {
      id: "settings" as StoreTabType,
      label: useLocale() === "en" ? "Store Settings" : "Pengaturan Toko",
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  if (isMobileHorizontal) {
    const allItems = [
      ...mainMenuItems,
      ...systemMenuItems,
      ...operationalMenuItems,
    ];

    return (
      <div className="flex items-center gap-1 w-full">
        {allItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer border",
                isActive
                  ? "bg-primary-sage text-white border-primary-sage font-semibold shadow-2xs"
                  : "bg-surface text-text-muted border-border-subtle hover:text-text-primary hover:bg-canvas",
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {(item.counter !== undefined && item.counter > 0) ||
              item.badgeText ? (
                <span
                  className={clsx(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-semibold tabular-nums",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-canvas text-text-muted border border-border-subtle",
                  )}
                >
                  {item.counter ?? item.badgeText}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full justify-between select-none bg-canvas">
      <div className="flex flex-col gap-3 p-3 overflow-y-auto">
        {/* 1. Sidebar Header (Workspace Switcher Card Style) */}
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-surface border border-border-subtle shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-primary-sage text-white flex items-center justify-center font-bold text-xs shrink-0">
            <Store className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <span className="text-xs font-bold text-text-primary truncate block leading-tight">
              TIJARAH BC 3
            </span>
            <span className="text-[10px] text-text-muted truncate block leading-tight mt-0.5">
              Back-Office Workspace
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted rotate-90 shrink-0" />
        </div>

        {/* 2. Menu Navigation Group: MAIN */}
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[11px] font-medium text-text-muted">
            {t("menuMain")}
          </div>

          <div className="space-y-0.5">
            {mainMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              const hasBadge =
                (item.counter !== undefined && item.counter > 0) ||
                !!item.badgeText;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={clsx(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left cursor-pointer border",
                    isActive
                      ? "bg-[var(--badge-primary-bg)] text-[var(--badge-primary-text)] border-[var(--badge-primary-border)] font-semibold shadow-2xs"
                      : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface/70",
                  )}
                >
                  <span
                    className={clsx(
                      "shrink-0",
                      isActive ? "text-primary-sage" : "text-text-muted",
                    )}
                  >
                    {item.icon}
                  </span>

                  <span className="flex-1 truncate">{item.label}</span>

                  {hasBadge && (
                    <span
                      className={clsx(
                        "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 border tabular-nums",
                        isActive
                          ? "bg-primary-sage text-white border-primary-sage"
                          : item.badgeType === "danger"
                            ? "bg-[var(--badge-danger-bg)] text-status-danger border-status-danger/30"
                            : item.badgeType === "warning"
                              ? "bg-[var(--badge-warning-bg)] text-status-warning border-status-warning/30"
                              : "bg-surface text-text-muted border-border-subtle",
                      )}
                    >
                      {item.counter ?? item.badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Menu Navigation Group: SYSTEM & CONFIGURATION */}
        <div className="space-y-0.5 pt-2 border-t border-border-subtle">
          <div className="px-2.5 py-1 text-[11px] font-medium text-text-muted">
            {t("menuSystem")}
          </div>

          <div className="space-y-0.5">
            {systemMenuItems.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={clsx(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left cursor-pointer border",
                    isActive
                      ? "bg-[var(--badge-primary-bg)] text-[var(--badge-primary-text)] border-[var(--badge-primary-border)] font-semibold shadow-2xs"
                      : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface/70",
                  )}
                >
                  <span
                    className={clsx(
                      "shrink-0",
                      isActive ? "text-primary-sage" : "text-text-muted",
                    )}
                  >
                    {item.icon}
                  </span>

                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Menu Navigation Group: OPERATIONAL & INTEGRATIONS */}
        <div className="space-y-0.5 pt-2 border-t border-border-subtle">
          <div className="px-2.5 py-1 text-[11px] font-medium text-text-muted">
            {t("menuOperational")}
          </div>

          <div className="space-y-0.5">
            {operationalMenuItems.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={clsx(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left cursor-pointer border",
                    isActive
                      ? "bg-[var(--badge-primary-bg)] text-[var(--badge-primary-text)] border-[var(--badge-primary-border)] font-semibold shadow-2xs"
                      : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface/70",
                  )}
                >
                  <span
                    className={clsx(
                      "shrink-0",
                      isActive ? "text-primary-sage" : "text-text-muted",
                    )}
                  >
                    {item.icon}
                  </span>

                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Sidebar Footer */}
      <div className="p-3 border-t border-border-subtle space-y-2 shrink-0 bg-canvas">
        <Link
          href={`/${locale}/shop`}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary bg-surface/60 hover:bg-surface border border-border-subtle transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <ShoppingBag className="w-3.5 h-3.5 text-primary-sage shrink-0" />
            <span className="truncate">
              {t("backToShop")}
            </span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </Link>

        {/* User Card */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-surface border border-border-subtle shadow-2xs">
          <div className="w-6 h-6 rounded-md bg-[var(--badge-primary-bg)] border border-[var(--badge-primary-border)] text-[var(--badge-primary-text)] flex items-center justify-center font-bold text-[11px] shrink-0">
            {ownerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-text-primary truncate block leading-tight">
              {ownerName}
            </span>
            <span className="text-[10px] text-text-muted truncate block leading-tight">
              {t("ownerRole")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreSidebarNav;
