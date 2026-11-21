"use client";

import React, { useEffect, useState } from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { storeApi } from "../../../api/store.api";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  User,
  Mail,
  Phone,
  Shield,
  ShoppingBag,
  MapPin,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ isOpen, onClose, userId }) => {
  const [detail, setDetail] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"PROFILE" | "ADDRESSES" | "ORDERS">("PROFILE");

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      storeApi
        .getSystemUserDetail(userId)
        .then((data) => {
          setDetail(data);
        })
        .catch((err) => {
          console.error("Gagal memuat detail pengguna:", err);
        })
        .finally(() => setIsLoading(false));
    } else {
      setDetail(null);
      setActiveTab("PROFILE");
    }
  }, [isOpen, userId]);

  const user = detail?.user;
  const addresses = detail?.addresses || [];
  const orders = detail?.orders || [];
  const metrics = detail?.metrics || { totalOrders: 0, completedOrders: 0, totalSpent: 0, totalPoints: 0 };

  const getUserTypeBadge = (type: string) => {
    const map: Record<string, { variant: "primary" | "secondary" | "success" | "warning"; label: string }> = {
      agen: { variant: "primary", label: "Mitra / Agen HNI" },
      customer: { variant: "secondary", label: "Pelanggan Umum" },
      admin: { variant: "success", label: "Administrator Toko" },
      staff: { variant: "warning", label: "Staf Toko" },
      kasir: { variant: "warning", label: "Kasir Toko" },
    };
    const c = map[type.toLowerCase()] || { variant: "secondary", label: type };
    return <TijarahBadge tijarahVariant={c.variant}>{c.label}</TijarahBadge>;
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? user.fullName : "Detail Pengguna Sistem"}
      description={`ID Pengguna: ${userId || "-"}`}
      maxWidth="3xl"
      showCloseIcon
    >
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-sage animate-spin" />
          <p className="text-xs font-semibold text-text-muted">Memuat data pengguna & riwayat...</p>
        </div>
      ) : !user ? (
        <div className="py-12 text-center text-text-muted text-xs">Data pengguna tidak ditemukan.</div>
      ) : (
        <div className="flex flex-col gap-5 pt-2">
          {/* Quick Header Ribbon */}
          <div className="flex items-center justify-between p-3.5 bg-canvas/60 rounded-xl border border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-sage/15 text-primary-sage flex items-center justify-center font-black text-base shrink-0">
                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <span className="font-bold text-text-primary text-sm block">{user.fullName}</span>
                <span className="text-xs text-text-muted">{user.email || user.phoneNumber || "Pengguna Terdaftar"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getUserTypeBadge(user.userType)}
              <TijarahBadge tijarahVariant={user.isActive ? "success" : "secondary"}>
                {user.isActive ? "Aktif" : "Nonaktif"}
              </TijarahBadge>
            </div>
          </div>

          {/* Quick Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-canvas/60 rounded-xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-text-muted block">Total Belanja</span>
              <span className="text-sm font-black text-primary-sage mt-0.5 block">
                {formatCurrency(metrics.totalSpent)}
              </span>
            </div>
            <div className="p-3 bg-canvas/60 rounded-xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-text-muted block">Total Pesanan</span>
              <span className="text-sm font-black text-text-primary mt-0.5 block">
                {metrics.totalOrders} Pesanan
              </span>
            </div>
            <div className="p-3 bg-canvas/60 rounded-xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-text-muted block">Selesai / Terkirim</span>
              <span className="text-sm font-black text-status-success mt-0.5 block">
                {metrics.completedOrders} Selesai
              </span>
            </div>
            <div className="p-3 bg-canvas/60 rounded-xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-text-muted block">Poin TP Akumulasi</span>
              <span className="text-sm font-black text-amber-500 mt-0.5 block">
                {metrics.totalPoints} TP
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-border-subtle pb-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("PROFILE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "PROFILE"
                  ? "bg-primary-sage text-white shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profil & HNI
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ADDRESSES")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "ADDRESSES"
                  ? "bg-primary-sage text-white shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Alamat Tersimpan ({addresses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ORDERS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "ORDERS"
                  ? "bg-primary-sage text-white shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Riwayat Pesanan ({orders.length})
            </button>
          </div>

          {/* Tab 1: Profil & Keanggotaan HNI */}
          {activeTab === "PROFILE" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Akun Dasar */}
              <div className="p-4 bg-canvas/40 rounded-xl border border-border-subtle flex flex-col gap-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary-sage" />
                  Informasi Akun
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                    <span className="text-text-muted">Nama Lengkap</span>
                    <span className="font-bold text-text-primary">{user.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                    <span className="text-text-muted flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                    <span className="font-medium text-text-primary">{user.email || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                    <span className="text-text-muted flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Nomor HP
                    </span>
                    <span className="font-medium text-text-primary">{user.phoneNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                    <span className="text-text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Tanggal Registrasi
                    </span>
                    <span className="text-text-primary">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-text-muted">Status Akun</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        user.isActive ? "text-status-success" : "text-status-danger"
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Nonaktif
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Keanggotaan HNI */}
              <div className="p-4 bg-canvas/40 rounded-xl border border-border-subtle flex flex-col gap-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary-sage" />
                  Keanggotaan Mitra HNI
                </h4>
                {user.hniProfile ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                      <span className="text-text-muted">ID Member HNI</span>
                      <span className="font-mono font-black text-primary-sage">
                        {user.hniProfile.hniMemberId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                      <span className="text-text-muted">Nama Terdaftar HNI</span>
                      <span className="font-bold text-text-primary">
                        {user.hniProfile.hniMemberName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                      <span className="text-text-muted">Pangkat / Rank</span>
                      <span className="font-black text-text-primary px-2 py-0.5 bg-canvas rounded-md border border-border-subtle">
                        {user.hniProfile.rank}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                      <span className="text-text-muted">Upline / BC Afiliasi</span>
                      <span className="font-medium text-text-primary">
                        {user.hniProfile.uplineName || "Pusat / Langsung"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-text-muted">Verifikasi HSIS</span>
                      <span className="font-bold text-status-success flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-text-muted text-xs">
                    Pengguna ini belum terdaftar sebagai agen atau anggota kemitraan HNI.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Alamat Tersimpan */}
          {activeTab === "ADDRESSES" && (
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="py-8 text-center text-text-muted text-xs bg-canvas/30 rounded-xl border border-dashed border-border-subtle">
                  Belum ada alamat pengiriman yang tersimpan untuk pengguna ini.
                </div>
              ) : (
                addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className={`p-3.5 rounded-xl border text-xs transition-colors ${
                      addr.isPrimary
                        ? "bg-primary-sage/5 border-primary-sage/30"
                        : "bg-canvas/40 border-border-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary-sage" />
                        {addr.recipientName}{" "}
                        <span className="text-text-muted font-normal">({addr.phoneNumber})</span>
                      </span>
                      {addr.isPrimary && (
                        <TijarahBadge tijarahVariant="primary">Alamat Utama</TijarahBadge>
                      )}
                    </div>
                    <p className="text-text-muted leading-relaxed">
                      {addr.fullAddress}, {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Riwayat Pesanan */}
          {activeTab === "ORDERS" && (
            <div className="overflow-x-auto border border-border-subtle rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-canvas/60 text-text-muted text-[10px] uppercase font-bold">
                    <th className="py-2.5 px-3">No. Pesanan</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Metode Bayar</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Total Belanja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-text-muted text-xs">
                        Belum ada riwayat transaksi belanja.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-canvas/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-text-primary">
                          {ord.orderNumber}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted">{formatDate(ord.createdAt)}</td>
                        <td className="py-2.5 px-3 text-text-muted">{ord.paymentMethod}</td>
                        <td className="py-2.5 px-3">
                          <TijarahBadge
                            tijarahVariant={
                              ord.orderStatus === "COMPLETED" || ord.orderStatus === "DELIVERED"
                                ? "success"
                                : ord.orderStatus === "CANCELLED"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {ord.orderStatus}
                          </TijarahBadge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-text-primary">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border-subtle">
            <TijarahButton type="button" heroVariant="outline" size="sm" onClick={onClose} className="font-bold">
              Tutup
            </TijarahButton>
          </div>
        </div>
      )}
    </TijarahModal>
  );
};
