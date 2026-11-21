"use client";

import React, { useState, useEffect } from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect, TijarahSelectItem } from "@/components/atom/tijarahSelect";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { User, Mail, Phone, Lock, Award, Shield, Check } from "lucide-react";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null; // null jika buat baru
  onSubmit: (payload: any) => Promise<void>;
  isLoading?: boolean;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading = false,
}) => {
  const isEditing = !!user;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<string>("customer");
  const [isActive, setIsActive] = useState<boolean>(true);

  // Field HNI
  const [isHniMember, setIsHniMember] = useState(false);
  const [hniMemberId, setHniMemberId] = useState("");
  const [hniMemberName, setHniMemberName] = useState("");
  const [rank, setRank] = useState("AB");
  const [uplineName, setUplineName] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phoneNumber || "");
      setPassword("");
      setUserType(user.userType || "customer");
      setIsActive(user.isActive ?? true);

      if (user.hniProfile) {
        setIsHniMember(true);
        setHniMemberId(user.hniProfile.hniMemberId || "");
        setHniMemberName(user.hniProfile.hniMemberName || user.fullName || "");
        setRank(user.hniProfile.rank || "AB");
        setUplineName(user.hniProfile.uplineName || "");
      } else {
        setIsHniMember(false);
        setHniMemberId("");
        setHniMemberName("");
        setRank("AB");
        setUplineName("");
      }
    } else {
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setPassword("Tijarah123!");
      setUserType("customer");
      setIsActive(true);
      setIsHniMember(false);
      setHniMemberId("");
      setHniMemberName("");
      setRank("AB");
      setUplineName("");
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const payload: any = {
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      userType,
      isActive,
    };

    if (!isEditing && password.trim()) {
      payload.password = password.trim();
    }

    if (isHniMember && hniMemberId.trim()) {
      payload.hniMemberId = hniMemberId.trim();
      payload.hniMemberName = hniMemberName.trim() || fullName.trim();
      payload.rank = rank;
      payload.uplineName = uplineName.trim() || undefined;
    }

    await onSubmit(payload);
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Data Pengguna Sistem" : "Daftarkan Pengguna Baru"}
      description={
        isEditing
          ? "Perbarui informasi profil, hak akses akun, dan data keanggotaan HNI."
          : "Tambahkan pengguna baru untuk akses sistem, transaksi kasir, atau mitra agen."
      }
      maxWidth="2xl"
      showCloseIcon
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Identitas Pengguna */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary-sage" />
            Identitas Pengguna
          </h4>

          <div>
            <label className="text-xs font-bold text-text-primary block mb-1">
              Nama Lengkap <span className="text-status-danger">*</span>
            </label>
            <TijarahInput
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Ahmad Fadilah"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">Email</label>
              <TijarahInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@gmail.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">Nomor WhatsApp / HP</label>
              <TijarahInput
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="081234567890"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Kata Sandi Awal <span className="text-status-danger">*</span>
              </label>
              <TijarahInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
              <p className="text-[10px] text-text-muted mt-1">Default sandi awal: Tijarah123!</p>
            </div>
          )}
        </div>

        {/* Tipe Akun & Status */}
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary-sage" />
            Tipe Akun & Hak Akses
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">Tipe Pengguna</label>
              <TijarahSelect
                value={userType}
                onChange={(val) => {
                  const s = String(val || "customer");
                  setUserType(s);
                  if (s === "agen") setIsHniMember(true);
                }}
              >
                <TijarahSelectItem id="customer">Pelanggan Umum (Customer)</TijarahSelectItem>
                <TijarahSelectItem id="agen">Mitra / Agen HNI (Member)</TijarahSelectItem>
                <TijarahSelectItem id="kasir">Kasir Toko (POS Staff)</TijarahSelectItem>
                <TijarahSelectItem id="staff">Staf Operasional / Gudang</TijarahSelectItem>
                <TijarahSelectItem id="admin">Administrator Toko</TijarahSelectItem>
              </TijarahSelect>
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">Status Keaktifan</label>
              <TijarahSelect
                value={isActive ? "true" : "false"}
                onChange={(val) => setIsActive(String(val) === "true")}
              >
                <TijarahSelectItem id="true">Aktif (Dapat Login & Belanja)</TijarahSelectItem>
                <TijarahSelectItem id="false">Nonaktif / Ditangguhkan</TijarahSelectItem>
              </TijarahSelect>
            </div>
          </div>
        </div>

        {/* Data Kemitraan HNI */}
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary-sage" />
              Kemitraan Agen HNI
            </h4>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-primary">
              <input
                type="checkbox"
                checked={isHniMember}
                onChange={(e) => setIsHniMember(e.target.checked)}
                className="rounded border-border-subtle text-primary-sage focus:ring-primary-sage"
              />
              Terdaftar sebagai Mitra HNI
            </label>
          </div>

          {isHniMember && (
            <div className="p-3.5 bg-canvas/60 rounded-xl border border-border-subtle space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    Nomor ID Member HNI <span className="text-status-danger">*</span>
                  </label>
                  <TijarahInput
                    value={hniMemberId}
                    onChange={(e) => setHniMemberId(e.target.value)}
                    placeholder="Contoh: 01093705"
                    required={isHniMember}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">Pangkat / Rank</label>
                  <TijarahSelect value={rank} onChange={(v) => setRank(String(v || "AB"))}>
                    <TijarahSelectItem id="AB">AB - Agen Baru</TijarahSelectItem>
                    <TijarahSelectItem id="SC">SC - Senior Consultant</TijarahSelectItem>
                    <TijarahSelectItem id="MM">MM - Manager</TijarahSelectItem>
                    <TijarahSelectItem id="SM">SM - Senior Manager</TijarahSelectItem>
                    <TijarahSelectItem id="EM">EM - Executive Manager</TijarahSelectItem>
                    <TijarahSelectItem id="ED">ED - Executive Director</TijarahSelectItem>
                    <TijarahSelectItem id="LED">LED - Loyal Executive Director</TijarahSelectItem>
                  </TijarahSelect>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">Nama Sesuai HNI</label>
                  <TijarahInput
                    value={hniMemberName}
                    onChange={(e) => setHniMemberName(e.target.value)}
                    placeholder={fullName || "Sesuai kartu anggota"}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">Upline / BC Afiliasi</label>
                  <TijarahInput
                    value={uplineName}
                    onChange={(e) => setUplineName(e.target.value)}
                    placeholder="Contoh: BC HNI BUKITTINGGI 3"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
          <TijarahButton type="button" heroVariant="outline" size="sm" onClick={onClose} isDisabled={isLoading}>
            Batal
          </TijarahButton>
          <TijarahButton
            type="submit"
            tijarahVariant="primary"
            size="sm"
            isDisabled={isLoading}
            className="font-bold flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? "Simpan Perubahan" : "Daftarkan Pengguna"}</span>
          </TijarahButton>
        </div>
      </form>
    </TijarahModal>
  );
};
