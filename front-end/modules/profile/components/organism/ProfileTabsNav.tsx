"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ProfileTabType } from "../../types/profile.types";
import { ScrollShadow } from "@heroui/react";
import { TijarahButton } from "@/components/atom/tijarahButton";
import {
  LayoutDashboard,
  User,
  Leaf,
  CreditCard,
  MapPin,
  ShoppingBag,
  Ticket,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";

interface ProfileTabsNavProps {
  activeTab: ProfileTabType;
  onSelectTab: (tab: ProfileTabType) => void;
  onLogout?: () => void;
}

export function ProfileTabsNav({ activeTab, onSelectTab, onLogout }: ProfileTabsNavProps) {
  const t = useTranslations();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const tabs: { id: ProfileTabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: t("tabOverview"), icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "personal", label: t("tabPersonal"), icon: <User className="w-4 h-4" /> },
    { id: "hni", label: t("tabHni"), icon: <Leaf className="w-4 h-4" /> },
    { id: "kasbon", label: t("tabKasbon"), icon: <CreditCard className="w-4 h-4" /> },
    { id: "addresses", label: t("tabAddresses"), icon: <MapPin className="w-4 h-4" /> },
    { id: "orders", label: t("tabOrders"), icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "vouchers", label: t("tabVouchers"), icon: <Ticket className="w-4 h-4" /> },
    { id: "notifications", label: t("tabNotifications"), icon: <Bell className="w-4 h-4" /> },
    { id: "settings", label: t("tabSettings"), icon: <Settings className="w-4 h-4" /> },
  ];

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };

  return (
    <div className="w-full bg-surface border border-border-subtle rounded-2xl p-1.5 shadow-sm">
      <div className="w-full flex items-center justify-between gap-2 py-0.5">
        <ScrollShadow orientation="horizontal" className="flex items-center gap-1.5 scrollbar-hide flex-1 min-w-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-primary-sage text-white shadow-md scale-[1.02]"
                    : "text-text-muted hover:text-text-primary hover:bg-canvas"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </ScrollShadow>

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-status-danger bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors whitespace-nowrap shrink-0 ml-1 sm:ml-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t("logout")}</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/30 text-status-danger flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">{t("logoutTitle")}</h3>
            <p className="text-xs text-text-muted">{t("logoutDesc")}</p>
            <div className="flex justify-center gap-3 mt-2">
              <TijarahButton tijarahVariant="ghost" size="sm" onClick={() => setShowLogoutConfirm(false)}>
                {t("cancel")}
              </TijarahButton>
              <TijarahButton tijarahVariant="danger" size="sm" onClick={handleConfirmLogout} className="font-bold">
                {t("logoutConfirm")}
              </TijarahButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
