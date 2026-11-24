"use client";

import React, { useState } from "react";
import { ProfileTabType, UserProfileData, HniProfileData } from "../../types/profile.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { useProfileTranslation } from "../../hooks/useProfileTranslation";
import {
  LayoutDashboard,
  User as UserIcon,
  Leaf,
  CreditCard,
  MapPin,
  ShoppingBag,
  Ticket,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import useProfile from "../../hooks/useProfile";

interface ProfileSidebarNavProps {
  activeTab: ProfileTabType;
  onSelectTab: (tab: ProfileTabType) => void;
  user: UserProfileData;
  hniProfile?: HniProfileData | null;
  onLogout?: () => void;
}

export function ProfileSidebarNav({
  activeTab,
  onSelectTab,
  user,
  hniProfile,
  onLogout,
}: ProfileSidebarNavProps) {
  const { t, isEn } = useProfileTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);


  const canCredit = !!hniProfile && hniProfile.isVerified && (hniProfile.rank === "AC" || hniProfile.rank === "DC");

  const tabs: { id: ProfileTabType; label: string; icon: React.ReactNode; badge?: string, available: boolean }[] = [
    { id: "overview", label: t("tabOverview", "Ringkasan"), icon: <LayoutDashboard className="w-4 h-4" />, available: true },
    { id: "personal", label: t("tabPersonal", "Data Diri"), icon: <UserIcon className="w-4 h-4" />, available: true },
    { id: "hni", label: t("tabHni", "Keanggotaan HNI"), icon: <Leaf className="w-4 h-4" />, badge: hniProfile?.isVerified ? "✓" : "!", available: true },
    // { id: "kasbon", label: t("tabKasbon", "Kasbon / Kredit B2B"), icon: <CreditCard className="w-4 h-4" />, badge: "H+14", available: canCredit },
    { id: "addresses", label: t("tabAddresses", "Alamat Pengiriman"), icon: <MapPin className="w-4 h-4" />, available: true },
    { id: "orders", label: t("tabOrders", "Pesanan Saya"), icon: <ShoppingBag className="w-4 h-4" />, available: true },
    { id: "vouchers", label: t("tabVouchers", "Voucher & Promo"), icon: <Ticket className="w-4 h-4" />, available: true },
    { id: "notifications", label: "Pusat Notifikasi", icon: <Bell className="w-4 h-4" />, available: true },
    { id: "settings", label: t("tabSettings", "Pengaturan Akun"), icon: <Settings className="w-4 h-4" />, available: true },
  ];

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };

  return (
    <TijarahCard tijarahVariant="default" className="p-4 border border-border-subtle shadow-md flex flex-col gap-4">
      {/* Sidebar Top Mini User Card */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-canvas border border-border-subtle/80">
        <div className="w-11 h-11 rounded-xl bg-primary-sage text-white font-extrabold flex items-center justify-center text-lg shrink-0 shadow">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover rounded-xl" />
          ) : (
            user.fullName?.charAt(0).toUpperCase() || "U"
          )}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-sm text-text-primary truncate">{user.fullName}</h4>
          <span className="text-[11px] text-text-muted truncate block">{user.email}</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col gap-1">
        {tabs.filter((tab) => tab.available).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${isActive
                ? "bg-primary-sage text-white shadow-md font-bold"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
                }`}
            >
              <div className="flex items-center gap-2.5">
                {tab.icon}
                <span>{tab.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {tab.badge && !isActive && (
                  <span className="text-[10px] bg-accent-gold/15 text-accent-gold font-bold px-1.5 py-0.5 rounded-md">
                    {tab.badge}
                  </span>
                )}
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? "rotate-90 text-white" : "opacity-40"}`} />
              </div>
            </button>
          );
        })}

        <div className="my-2 border-t border-border-subtle" />

        {/* Sidebar Logout Button */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-status-danger bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4" />
            <span>{t("logout", isEn ? "Log Out" : "Keluar")}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/30 text-status-danger flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">{t("logout", "Keluar dari Akun")}</h3>
            <p className="text-xs text-text-muted">{t("confirmLogout", "Apakah Anda yakin ingin keluar dari akun TIJARAH-3 Anda?")}</p>
            <div className="flex justify-center gap-3 mt-2">
              <TijarahButton tijarahVariant="ghost" size="sm" onClick={() => setShowLogoutConfirm(false)}>
                Batal
              </TijarahButton>
              <TijarahButton tijarahVariant="danger" size="sm" onClick={handleConfirmLogout} className="font-bold">
                {t("logout", "Ya, Keluar")}
              </TijarahButton>
            </div>
          </div>
        </div>
      )}
    </TijarahCard>
  );
}
