"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { UserProfileData } from "../../../types/profile.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { IdentityForm } from "../form/identityForm";

interface PersonalPanelProps {
  user: UserProfileData;
  onUpdate: (data: { fullName?: string; email?: string; phoneNumber?: string }) => Promise<any>;
  isUpdating: boolean;
}

export function PersonalPanel({ user, onUpdate, isUpdating }: PersonalPanelProps) {
  const t = useTranslations();

  return (
    <TijarahCard tijarahVariant="default" className="p-4 sm:p-8 border border-border-subtle max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-text-primary">{t("personalSecurityTitle")}</h3>
          <p className="text-xs text-text-muted mt-1">
            {t("profileSubtitle")}
          </p>
        </div>

        {user.emailVerified ? (
          <TijarahBadge tijarahVariant="success" className="text-xs px-3 py-1 flex items-center gap-1.5 font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" /> {t("verifiedBadge")}
          </TijarahBadge>
        ) : (
          <TijarahBadge tijarahVariant="warning" className="text-xs px-3 py-1 flex items-center gap-1.5 font-bold shrink-0">
            <AlertCircle className="w-4 h-4" /> {t("unverifiedBadge")}
          </TijarahBadge>
        )}
      </div>

      <IdentityForm user={user} onUpdate={onUpdate} isUpdating={isUpdating} />
    </TijarahCard>
  );
}
export default PersonalPanel;
