"use client";

import React, { useState } from "react";
import { ProfileTabType, UserProfileData } from "../types/profile.types";
import { useProfile } from "../hooks/useProfile";
import { useUserAddresses } from "../hooks/useUserAddresses";
import { useKasbonCredit } from "../hooks/useKasbonCredit";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { ProfileHeader } from "./organism/ProfileHeader";
import { ProfileStatsCards } from "./organism/ProfileStatsCards";
import { ProfileTabsNav } from "./organism/ProfileTabsNav";
import { ProfileSidebarNav } from "./organism/ProfileSidebarNav";
import { OverviewPanel } from "./organism/panels/OverviewPanel";
import { PersonalPanel } from "./organism/panels/PersonalPanel";
import { HniPanel } from "./organism/panels/HniPanel";
import { KasbonPanel } from "./organism/panels/KasbonPanel";
import { AddressesPanel } from "./organism/panels/AddressesPanel";
import { OrdersPanel } from "./organism/panels/OrdersPanel";
import { VouchersPanel } from "./organism/panels/VouchersPanel";
import { SettingsPanel } from "./organism/panels/SettingsPanel";
import { NotificationsPanel } from "@/modules/notifications/components/NotificationsPanel";
import { TijarahCard } from "@/components/atom/tijarahCard";

const fallbackUser: UserProfileData = {
  id: "usr_default",
  email: "",
  emailVerified: false,
  fullName: "Pengguna",
  phoneNumber: "",
  userType: "agen",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  roles: [],
};

export function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTabType>("overview");
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const {
    user: profileUser,
    hniProfile,
    initialAddresses,
    initialCreditProfile,
    isLoading: isProfileLoading,
    isUpdating,
    updateProfile,
    saveHniProfile,
  } = useProfile();

  const user: UserProfileData = profileUser || (authUser ? {
    id: authUser.id,
    email: authUser.email,
    emailVerified: true,
    fullName: authUser.fullName || authUser.name || "Pengguna",
    phoneNumber: authUser.phone || "",
    userType: (authUser.role as any) || "agen",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    roles: [
      {
        id: "ur_1",
        roleId: "r_user",
        roleName: (authUser.role?.toUpperCase() as any) || "STOCKIST",
        assignedAt: new Date().toISOString(),
      },
    ],
  } : fallbackUser);

  const {
    addresses,
    addAddress,
    setPrimaryAddress,
    deleteAddress,
    isLoading: isAddrLoading,
    isError: isAddrError,
    error: addrError,
    refreshAddresses,
  } = useUserAddresses(initialAddresses);

  const {
    creditAccount,
    ledgerEntries,
    daysUntilDue,
    isLoading: isCreditLoading,
    isError: isCreditError,
    error: creditError,
    refreshKasbon,
    applyCredit,
  } = useKasbonCredit(initialCreditProfile);

  const primaryAddress = addresses.find((a) => a.isPrimary) || addresses[0] || null;

  const handleUpdatePersonal = async (data: { fullName?: string; email?: string; phoneNumber?: string }) => {
    return await updateProfile(data);
  };

  const handleSaveHni = async (data: any) => {
    const memberId = String(data?.hniMemberId || data?.memberId || "").trim();
    const memberName = String(data?.hniMemberName || data?.memberName || "").trim();
    return await saveHniProfile({
      hniMemberId: memberId,
      hniMemberName: memberName,
      uplineName: data?.uplineName || "",
      rank: data?.rank || "",
      rankMarketing: data?.rankMarketing || data?.rank || "",
      isVerified: data?.isVerified !== undefined ? data.isVerified : true,
    });
  };

  if (isProfileLoading && !profileUser && !authUser) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6 animate-pulse">
        <div className="h-44 w-full bg-surface/50 border border-border-subtle rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-surface/50 border border-border-subtle rounded-2xl" />
          <div className="h-28 bg-surface/50 border border-border-subtle rounded-2xl" />
          <div className="h-28 bg-surface/50 border border-border-subtle rounded-2xl" />
          <div className="h-28 bg-surface/50 border border-border-subtle rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* 1. Header Profile */}
      <ProfileHeader
        user={user}
        hniProfile={hniProfile}
        onUpdateAvatar={async (url) => {
          await updateProfile({ avatarUrl: url });
        }}
      />

      {/* 2. Key Metrics & Stats */}
      <ProfileStatsCards
        hniProfile={hniProfile}
        creditAccount={creditAccount}
      />

      {/* 3. Horizontal Navigation for Mobile / Tablet */}
      <div className="lg:hidden">
        <ProfileTabsNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLogout={logout}
        />
      </div>

      {/* 4. Main Body: Sidebar + Active Panel for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="hidden lg:block lg:col-span-1 sticky top-24">
          <ProfileSidebarNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            user={user}
            hniProfile={hniProfile}
            onLogout={logout}
          />
        </aside>

        <main className="lg:col-span-3 min-w-0">
          {activeTab === "overview" && (
            <OverviewPanel
              user={user}
              hniProfile={hniProfile}
              creditAccount={creditAccount}
              primaryAddress={primaryAddress}
              onNavigateTab={(tab) => setActiveTab(tab as ProfileTabType)}
            />
          )}

          {activeTab === "personal" && (
            <PersonalPanel
              user={user}
              onUpdate={handleUpdatePersonal}
              isUpdating={isUpdating}
            />
          )}

          {activeTab === "hni" && (
            <HniPanel
              hniProfile={hniProfile}
              onSubmitHni={handleSaveHni}
            />
          )}

          {activeTab === "kasbon" && (
            <KasbonPanel
              creditAccount={creditAccount}
              ledgerEntries={ledgerEntries}
              daysUntilDue={daysUntilDue}
              isLoading={isCreditLoading}
              isError={isCreditError}
              error={creditError}
              onRefresh={refreshKasbon}
              onApplyCredit={applyCredit}
            />
          )}

          {activeTab === "addresses" && (
            <AddressesPanel
              addresses={addresses}
              onAddAddress={addAddress}
              onSetPrimary={setPrimaryAddress}
              onDelete={deleteAddress}
              isLoading={isAddrLoading}
              isError={isAddrError}
              error={addrError}
              onRefresh={refreshAddresses}
            />
          )}

          {activeTab === "orders" && <OrdersPanel />}

          {activeTab === "vouchers" && <VouchersPanel />}

          {activeTab === "notifications" && <NotificationsPanel />}

          {activeTab === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

export default Profile;
