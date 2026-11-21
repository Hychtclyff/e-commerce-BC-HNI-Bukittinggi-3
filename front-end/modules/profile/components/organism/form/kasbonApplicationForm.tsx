"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, UserCheck, Calendar, Info } from "lucide-react";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import useProfile from "@/modules/profile/hooks/useProfile";
import { CreditApplicationPayload } from "@/modules/profile/types/profile.types";

interface KasbonApplicationFormProps {
  onSubmit: (payload: CreditApplicationPayload) => Promise<any>;
  isLoading?: boolean;
  onSuccess?: () => void;
}

export const KasbonApplicationForm: React.FC<KasbonApplicationFormProps> = ({
  onSubmit,
  isLoading = false,
  onSuccess,
}) => {
  const t = useTranslations("kasbonPanel");
  const tCommon = useTranslations("commonBtn");
  const { hniProfile, user } = useProfile();

  const [purpose, setPurpose] = useState<string>("Restock Rutin Produk Herbal HNI");
  const [altPhone, setAltPhone] = useState<string>("");
  const [agreement, setAgreement] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!agreement) {
      setErrorMsg(t("agreementRequired"));
      return;
    }

    try {
      await onSubmit({
        requestedLimit: 2000000,
        purpose,
        alternativePhone: altPhone || undefined,
        agreementAccepted: true,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal mengajukan kasbon. Silakan coba lagi.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {errorMsg && (
        <TijarahAlert
          tijarahVariant="danger"
          title="Perhatian"
          description={errorMsg}
          className="mb-1"
        />
      )}

      {/* 1. Ringkasan Data Agen Terhubung (Tidak ribet karna data agen sudah ada) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-primary-sage/30 bg-primary-sage/5 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-primary-sage/20">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary-sage" />
            <h4 className="text-sm font-bold text-text-primary">
              {t("agentSummaryTitle")}
            </h4>
          </div>
          <TijarahBadge tijarahVariant="success" className="text-[11px] font-semibold">
            {hniProfile?.isVerified ? "Agen Terkurasi" : "Data Agen HNI"}
          </TijarahBadge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-text-muted block">{t("agentId")}</span>
            <span className="font-mono font-bold text-sm text-primary-sage">
              {hniProfile?.hniMemberId || "Belum Terhubung"}
            </span>
          </div>

          <div>
            <span className="text-text-muted block">{t("agentName")}</span>
            <span className="font-semibold text-text-primary truncate block">
              {hniProfile?.hniMemberName || user?.fullName || "-"}
            </span>
          </div>

          <div>
            <span className="text-text-muted block">Pangkat / Status</span>
            <span className="font-semibold text-text-primary">
              {hniProfile?.titleStatus || "Mitra Agen"}
            </span>
          </div>

          <div>
            <span className="text-text-muted block">No. WhatsApp Utama</span>
            <span className="font-semibold text-text-primary">
              {user?.phoneNumber || "-"}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-text-muted pt-1 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-primary-sage shrink-0" />
          <span>{t("formDesc")}</span>
        </p>
      </div>

      {/* 2. Parameter Plafon & Tenor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <TijarahInput
            id="kasbon-requested-limit"
            label={t("requestedLimit")}
            value="Rp 2.000.000"
            disabled
            className="font-bold text-primary-sage font-mono"
            startContent={<CreditCard className="w-4 h-4 text-primary-sage" />}
          />
          <span className="text-[11px] text-text-muted mt-1 block">
            {t("requestedLimitHelp")}
          </span>
        </div>

        <div>
          <TijarahInput
            id="kasbon-tenor"
            label={t("tenorLabel")}
            value="H+14 (14 Hari Kalender)"
            disabled
            className="font-medium text-text-primary"
            startContent={<Calendar className="w-4 h-4 text-accent-gold" />}
          />
          <span className="text-[11px] text-text-muted mt-1 block">
            {t("tenorHelp")}
          </span>
        </div>
      </div>

      {/* 3. Tujuan Pengajuan & Kontak Alternatif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("purposeLabel")}
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm sm:text-base border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-primary-sage transition-colors"
          >
            <option value={t("purposeOption1")}>{t("purposeOption1")}</option>
            <option value={t("purposeOption2")}>{t("purposeOption2")}</option>
            <option value={t("purposeOption3")}>{t("purposeOption3")}</option>
          </select>
        </div>

        <TijarahInput
          id="kasbon-alt-phone"
          label={t("altPhoneLabel")}
          placeholder={t("altPhonePlaceholder")}
          value={altPhone}
          onChange={(e) => setAltPhone(e.target.value)}
        />
      </div>

      {/* 4. Persetujuan Akad Syariah (Qardh B2B) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-accent-gold/40 bg-accent-gold/5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent-gold" />
          <h4 className="text-sm font-bold text-text-primary">
            {t("agreementTitle")}
          </h4>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={agreement}
            onChange={(e) => setAgreement(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-sage focus:ring-primary-sage cursor-pointer"
          />
          <span className="text-xs sm:text-sm text-text-primary leading-relaxed group-hover:text-primary-sage transition-colors">
            {t("agreementDesc")}
          </span>
        </label>
      </div>

      {/* 5. Submit Button */}
      <div className="flex items-center justify-end pt-2">
        <TijarahButton
          id="submit-kasbon-application-btn"
          type="submit"
          isLoading={isLoading}
          isDisabled={!agreement || isLoading}
          tijarahVariant="primary"
          className="font-bold py-3 px-8 text-base shadow-md flex items-center gap-2"
        >
          <span>{isLoading ? t("submittingBtn") : t("submitBtn")}</span>
          <ArrowRight className="w-5 h-5" />
        </TijarahButton>
      </div>
    </form>
  );
};

export default KasbonApplicationForm;
