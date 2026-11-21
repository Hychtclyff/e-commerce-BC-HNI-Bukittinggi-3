"use client";

import React, { useState } from "react";
import { UserProfileData, HniProfileData } from "../../types/profile.types";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { MediaUploader } from "@/modules/media/components/MediaUploader";
import { useProfileTranslation, ProfileDictKey } from "../../hooks/useProfileTranslation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Building2,
  Sparkles,
} from "lucide-react";

interface ProfileHeaderProps {
  user: UserProfileData;
  hniProfile?: HniProfileData | null;
  onUpdateAvatar?: (url: string) => void;
}

export function ProfileHeader({ user, hniProfile, onUpdateAvatar }: ProfileHeaderProps) {
  const { t } = useProfileTranslation();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarInput, setAvatarInput] = useState(user.avatarUrl || "");

  const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0].roleName : "CUSTOMER";

  const roleKeyMap: Record<string, { key: ProfileDictKey; fallback: string; variant: "success" | "warning" | "secondary" | "danger" }> = {
    OWNER: { key: "roleOwner", fallback: "Pemilik BC", variant: "warning" },
    ADMIN: { key: "roleAdmin", fallback: "Admin Toko", variant: "secondary" },
    STOCKIST: { key: "roleStockist", fallback: "Stokis BC 3", variant: "success" },
    CASHIER: { key: "roleCashier", fallback: "Kasir Toko", variant: "secondary" },
    AGENT: { key: "roleAgent", fallback: "Mitra Agen HNI", variant: "success" },
    CUSTOMER: { key: "roleCustomer", fallback: "Konsumen Umum", variant: "secondary" },
  };

  const roleMeta = roleKeyMap[primaryRole] || { key: "roleCustomer", fallback: primaryRole, variant: "secondary" };
  const roleLabel = t(roleMeta.key, roleMeta.fallback);

  const handleSaveAvatar = () => {
    if (onUpdateAvatar && avatarInput) {
      onUpdateAvatar(avatarInput);
    }
    setShowAvatarModal(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-xl"
    >
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary-sage/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-accent-gold/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
        {/* Avatar Container with Hover Overlay Uploader */}
        <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-primary-sage to-accent-gold p-1 shadow-lg">
            <div className="relative w-full h-full rounded-[22px] bg-surface flex items-center justify-center text-4xl font-extrabold text-primary-sage overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover rounded-[22px]"
                />
              ) : (
                <User className="w-12 h-12 text-primary-sage" />
              )}

              {/* Camera Hover Overlay */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                <Camera className="w-5 h-5" />
                <span>{t("changeAvatar", "Ganti Foto")}</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-2 -right-2 bg-status-success text-white p-1.5 rounded-full border-2 border-surface shadow-md">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* User Info Details */}
        <div className="flex-1 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {user.fullName}
            </h1>
            <TijarahBadge tijarahVariant={roleMeta.variant} className="text-xs px-3 py-1 font-bold">
              {roleLabel}
            </TijarahBadge>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-text-muted font-medium">
            {/* Email with Verification Badge */}
            <span className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 min-w-0">
              <Mail className="w-4 h-4 text-primary-sage shrink-0" />
              <span className="break-all">{user.email}</span>
              {user.isActive ? (
                <TijarahBadge tijarahVariant="success" className="text-[10px] px-1.5 py-0 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" /> {t("emailVerified", "Terverifikasi")}
                </TijarahBadge>
              ) : (
                <TijarahBadge tijarahVariant="warning" className="text-[10px] px-1.5 py-0 flex items-center gap-1 shrink-0">
                  <AlertCircle className="w-3 h-3" /> {t("emailUnverified", "Belum Verifikasi")}
                </TijarahBadge>
              )}
            </span>

            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-primary-sage shrink-0" />
              <span>{user.phoneNumber || "-"}</span>
            </span>
          </div>

          {hniProfile && (
            <div className="mt-2 pt-3 border-t border-border-subtle/60 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs">
              <span className="bg-accent-gold/10 text-accent-gold border border-accent-gold/30 rounded-lg px-2.5 py-1 font-mono font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> {t("hniIdLabel", "ID HNI:")} {hniProfile.hniMemberId}
              </span>
              <span className="text-text-muted font-medium flex items-center gap-1">
                {t("hniRankLabel", "Pangkat:")} <strong className="text-text-primary">{hniProfile.titleStatus || "Mitra"}</strong>
              </span>
              <span className="text-text-muted font-medium flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary-sage" /> BC: <strong className="text-text-primary">{hniProfile.agencyName || "BC 3 Bukittinggi"}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Change Modal UI */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-text-primary">{t("changePhotoTitle", "Ganti Foto Profil")}</h3>
            <p className="text-xs text-text-muted">{t("photoUrlPlaceholder", "Tarik & lepas foto profil baru Anda atau unggah dari perangkat.")}</p>
            <MediaUploader
              category="PROFILE"
              entityId={user.id}
              accept="image"
              value={avatarInput}
              onChange={setAvatarInput}
              label=""
              allowManualUrl
              compact
            />
            <div className="flex justify-end gap-2 mt-2">
              <TijarahButton tijarahVariant="ghost" size="sm" onClick={() => setShowAvatarModal(false)}>
                {t("cancel", "Batal")}
              </TijarahButton>
              <TijarahButton tijarahVariant="primary" size="sm" onClick={handleSaveAvatar} className="font-bold">
                {t("savePhotoBtn", "Simpan Foto")}
              </TijarahButton>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
