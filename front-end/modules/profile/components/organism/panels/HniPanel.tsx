"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { HniProfileData } from "../../../types/profile.types";
import { HniAgentCard } from "../../molecules/HniAgentCard";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { HniRegistrationForm } from "../form/hniRegistrationForm";
import { HniRegistrationFormData } from "@/modules/profile/schemas/hni.schema";
import { ShieldAlert, ShieldCheck, Pencil, ArrowLeft } from "lucide-react";

interface HniPanelProps {
  hniProfile?: HniProfileData | null;
  onSubmitHni?: (data: any) => Promise<any>;
  onAddAddress?: (payload: any) => Promise<any>;
}

export function HniPanel({ hniProfile, onSubmitHni }: HniPanelProps) {
  const t = useTranslations("hniPanel");
  const tCommon = useTranslations("commonBtn");

  const isVerified = hniProfile?.isVerified ?? false;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingVerified, setIsEditingVerified] = useState(false);

  const handleSubmitHni = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (onSubmitHni) {
        await onSubmitHni(data);
      }
      setIsEditingVerified(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {isVerified && !isEditingVerified ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">{t("title")}</h3>
            <TijarahButton
              type="button"
              tijarahVariant="outline"
              onClick={() => setIsEditingVerified(true)}
              className="text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{t("editHniBtn")}</span>
            </TijarahButton>
          </div>

          <HniAgentCard hni={hniProfile!} />

          <TijarahCard tijarahVariant="default" className="p-6 border border-border-subtle bg-primary-sage/5">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-primary-sage" />
              <h4 className="font-bold text-base text-text-primary">{t("benefitTitle")}</h4>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {t("benefitDesc")}
            </p>
          </TijarahCard>
        </>
      ) : (
        <TijarahCard tijarahVariant="default" className="p-6 sm:p-8 border border-accent-gold/40 bg-gradient-to-br from-surface to-accent-gold/5 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border-subtle">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-gold/15 text-accent-gold flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">
                  {isVerified ? t("membershipChangeBadge") : t("registrationBadge")}
                </span>
                <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
                  {isVerified ? t("editHeaderTitle") : t("activateHeaderTitle")}
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {isVerified ? t("editHeaderDesc") : t("activateHeaderDesc")}
                </p>
              </div>
            </div>

            {isVerified && isEditingVerified && (
              <TijarahButton
                type="button"
                tijarahVariant="ghost"
                onClick={() => setIsEditingVerified(false)}
                className="text-xs py-1.5 px-3 flex items-center gap-1 text-slate-500"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{tCommon("cancel")}</span>
              </TijarahButton>
            )}
          </div>

          <HniRegistrationForm
            hniProfile={hniProfile}
            onSubmit={handleSubmitHni}
            isLoading={isSubmitting}
          />
        </TijarahCard>
      )}
    </div>
  );
}

export default HniPanel;
