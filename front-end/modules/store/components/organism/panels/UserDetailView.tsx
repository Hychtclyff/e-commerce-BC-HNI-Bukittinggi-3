"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
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
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Package,
} from "lucide-react";

interface UserDetailViewProps {
  userId: string;
  onBack: () => void;
}

export const UserDetailView: React.FC<UserDetailViewProps> = ({ userId, onBack }) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const [detail, setDetail] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"PROFILE" | "ADDRESSES" | "ORDERS">("PROFILE");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    setExpandedOrderIds({});
    storeApi
      .getSystemUserDetail(userId)
      .then((data) => setDetail(data))
      .catch((err) => console.error("Gagal memuat detail pengguna:", err))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const toggleOrderAccordion = (orderId: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const user = detail?.user;
  const addresses = detail?.addresses || [];
  const orders = detail?.orders || [];
  const metrics = detail?.metrics || {
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    totalPoints: 0,
  };

  const getUserTypeBadge = (type: string) => {
    const map: Record<string, { variant: "primary" | "secondary" | "success" | "warning"; label: string }> = {
      agen: { variant: "primary", label: isEn ? "HNI Agent" : "Mitra / Agen HNI" },
      customer: { variant: "secondary", label: isEn ? "Retail Customer" : "Pelanggan Umum" },
      admin: { variant: "success", label: isEn ? "Store Admin" : "Administrator Toko" },
      staff: { variant: "warning", label: isEn ? "Store Staff" : "Staf Toko" },
      kasir: { variant: "warning", label: isEn ? "Cashier" : "Kasir Toko" },
    };
    const c = map[String(type || "").toLowerCase()] || { variant: "secondary", label: type };
    return <TijarahBadge tijarahVariant={c.variant}>{c.label}</TijarahBadge>;
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Bar */}
      <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="h-8 px-2.5 rounded-lg border border-border-subtle bg-canvas hover:bg-surface text-xs font-medium text-text-primary inline-flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEn ? "Back to Users" : "Kembali ke Daftar"}</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-text-primary truncate">
              {user ? user.fullName : isEn ? "User Detail" : "Detail Pengguna"}
            </h2>
            <p className="text-[11px] font-mono text-text-muted truncate">ID: {userId}</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2 shrink-0">
            {getUserTypeBadge(user.userType)}
            <TijarahBadge tijarahVariant={user.isActive ? "success" : "secondary"}>
              {user.isActive ? (isEn ? "Active" : "Aktif") : isEn ? "Inactive" : "Nonaktif"}
            </TijarahBadge>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="bg-surface border border-border-subtle rounded-xl py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-primary-sage animate-spin" />
          <p className="text-xs font-medium text-text-muted">
            {isEn ? "Loading user profile & order history..." : "Memuat data pengguna & riwayat transaksi..."}
          </p>
        </div>
      ) : !user ? (
        <div className="bg-surface border border-border-subtle rounded-xl py-12 text-center text-xs text-text-muted">
          {isEn ? "User data not found." : "Data pengguna tidak ditemukan."}
        </div>
      ) : (
        <>
          {/* Aligned 4-Column Metric Strip */}
          <div className="bg-surface border border-border-subtle rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
            <div className="px-4 py-3">
              <span className="text-[11px] font-medium text-text-muted block">
                {isEn ? "Total Spent" : "Total Belanja"}
              </span>
              <span className="text-base font-bold text-primary-sage tabular-nums mt-0.5 block">
                {formatCurrency(metrics.totalSpent)}
              </span>
            </div>
            <div className="px-4 py-3">
              <span className="text-[11px] font-medium text-text-muted block">
                {isEn ? "Total Orders" : "Total Pesanan"}
              </span>
              <span className="text-base font-bold text-text-primary tabular-nums mt-0.5 block">
                {metrics.totalOrders}
              </span>
            </div>
            <div className="px-4 py-3">
              <span className="text-[11px] font-medium text-text-muted block">
                {isEn ? "Completed Orders" : "Selesai / Terkirim"}
              </span>
              <span className="text-base font-bold text-status-success tabular-nums mt-0.5 block">
                {metrics.completedOrders}
              </span>
            </div>
            <div className="px-4 py-3">
              <span className="text-[11px] font-medium text-text-muted block">
                {isEn ? "Accumulated TP Points" : "Poin TP Akumulasi"}
              </span>
              <span className="text-base font-bold text-accent-gold tabular-nums mt-0.5 block">
                {metrics.totalPoints} TP
              </span>
            </div>
          </div>

          {/* Tabs + Content */}
          <div className="bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-border-subtle pb-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("PROFILE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === "PROFILE"
                    ? "bg-primary-sage text-white"
                    : "text-text-muted hover:text-text-primary bg-canvas"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{isEn ? "Profile & HNI" : "Profil & HNI"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ADDRESSES")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === "ADDRESSES"
                    ? "bg-primary-sage text-white"
                    : "text-text-muted hover:text-text-primary bg-canvas"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isEn ? `Addresses (${addresses.length})` : `Alamat Tersimpan (${addresses.length})`}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ORDERS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === "ORDERS"
                    ? "bg-primary-sage text-white"
                    : "text-text-muted hover:text-text-primary bg-canvas"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isEn ? `Order History (${orders.length})` : `Riwayat Pembelanjaan (${orders.length})`}</span>
              </button>
            </div>

            {/* Tab 1: Profile & HNI */}
            {activeTab === "PROFILE" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl border border-border-subtle bg-canvas/40 space-y-2.5 text-xs">
                  <h4 className="font-semibold text-text-primary flex items-center gap-1.5 pb-2 border-b border-border-subtle">
                    <Shield className="w-4 h-4 text-primary-sage" />
                    <span>{isEn ? "Account Information" : "Informasi Akun"}</span>
                  </h4>
                  <div className="flex justify-between py-1 border-b border-border-subtle/50">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </span>
                    <span className="font-medium text-text-primary">{user.email || "-"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-subtle/50">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {isEn ? "Phone" : "No. Telepon"}
                    </span>
                    <span className="font-mono font-medium text-text-primary">{user.phoneNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {isEn ? "Registered" : "Terdaftar Sejak"}
                    </span>
                    <span className="font-medium text-text-primary">{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border-subtle bg-canvas/40 space-y-2.5 text-xs">
                  <h4 className="font-semibold text-text-primary flex items-center gap-1.5 pb-2 border-b border-border-subtle">
                    <Award className="w-4 h-4 text-accent-gold" />
                    <span>{isEn ? "HNI Membership" : "Keanggotaan HNI"}</span>
                  </h4>
                  {user.hniProfile ? (
                    <>
                      <div className="flex justify-between py-1 border-b border-border-subtle/50">
                        <span className="text-text-muted">ID Member HNI</span>
                        <span className="font-mono font-bold text-primary-sage">
                          {user.hniProfile.hniMemberId}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border-subtle/50">
                        <span className="text-text-muted">{isEn ? "Rank" : "Pangkat"}</span>
                        <span className="font-semibold text-text-primary">{user.hniProfile.rank}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border-subtle/50">
                        <span className="text-text-muted">Upline / BC</span>
                        <span className="font-medium text-text-primary">
                          {user.hniProfile.uplineName || (isEn ? "Direct / Central" : "Pusat / Langsung")}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-text-muted">{isEn ? "HSIS Verification" : "Verifikasi HSIS"}</span>
                        <span className="font-semibold text-status-success flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isEn ? "Verified" : "Terverifikasi"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="py-4 text-center text-text-muted">
                      {isEn
                        ? "This user is not registered as an HNI member/agent."
                        : "Pengguna ini belum terdaftar sebagai anggota/agen HNI."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Saved Addresses */}
            {activeTab === "ADDRESSES" && (
              <div className="space-y-2.5">
                {addresses.length === 0 ? (
                  <p className="py-8 text-center text-xs text-text-muted">
                    {isEn ? "No saved addresses." : "Belum ada alamat tersimpan."}
                  </p>
                ) : (
                  addresses.map((addr: any) => (
                    <div
                      key={addr.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        addr.isPrimary
                          ? "bg-primary-sage/5 border-primary-sage/30"
                          : "bg-canvas/40 border-border-subtle"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-text-primary">
                          {addr.recipientName}{" "}
                          <span className="text-text-muted font-normal">({addr.phoneNumber})</span>
                        </span>
                        {addr.isPrimary && (
                          <TijarahBadge tijarahVariant="primary">
                            {isEn ? "Primary" : "Alamat Utama"}
                          </TijarahBadge>
                        )}
                      </div>
                      <p className="text-text-muted">
                        {addr.fullAddress}, {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Order History with Product Detail Accordion */}
            {activeTab === "ORDERS" && (
              <div className="overflow-x-auto border border-border-subtle rounded-xl">
                <table className="w-full min-w-[680px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-canvas/80 text-text-muted text-[10px] uppercase font-semibold">
                      <th className="py-2.5 px-3 w-8" />
                      <th className="py-2.5 px-3">{isEn ? "Order No." : "No. Pesanan"}</th>
                      <th className="py-2.5 px-3">{isEn ? "Date" : "Tanggal"}</th>
                      <th className="py-2.5 px-3">{isEn ? "Payment" : "Metode Bayar"}</th>
                      <th className="py-2.5 px-3">{isEn ? "Status" : "Status"}</th>
                      <th className="py-2.5 px-3 text-right">{isEn ? "Items" : "Produk"}</th>
                      <th className="py-2.5 px-3 text-right">{isEn ? "Total" : "Total Belanja"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-text-muted">
                          {isEn ? "No order history." : "Belum ada riwayat pembelanjaan."}
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord: any) => {
                        const isExpanded = !!expandedOrderIds[ord.id];
                        const items: any[] = ord.items || [];
                        return (
                          <React.Fragment key={ord.id}>
                            <tr
                              onClick={() => toggleOrderAccordion(ord.id)}
                              className="hover:bg-canvas/50 transition-colors cursor-pointer"
                            >
                              <td className="py-3 px-3 text-text-muted">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-primary-sage" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-text-primary">
                                {ord.orderNumber}
                              </td>
                              <td className="py-3 px-3 text-text-muted whitespace-nowrap">
                                {formatDate(ord.createdAt)}
                              </td>
                              <td className="py-3 px-3 text-text-muted">{ord.paymentMethod}</td>
                              <td className="py-3 px-3">
                                <TijarahBadge
                                  tijarahVariant={
                                    ord.orderStatus === "COMPLETED" || ord.orderStatus === "DELIVERED"
                                      ? "success"
                                      : ord.orderStatus === "CANCELLED" || ord.orderStatus === "REJECTED"
                                      ? "danger"
                                      : "warning"
                                  }
                                >
                                  {ord.orderStatus}
                                </TijarahBadge>
                              </td>
                              <td className="py-3 px-3 text-right text-text-muted tabular-nums">
                                {items.length} {isEn ? "items" : "item"}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-text-primary tabular-nums whitespace-nowrap">
                                {formatCurrency(ord.totalAmount)}
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-canvas/50">
                                <td colSpan={7} className="px-4 py-3">
                                  <div className="border border-border-subtle rounded-lg bg-surface overflow-hidden">
                                    <div className="px-3 py-2 bg-canvas/60 border-b border-border-subtle flex items-center gap-1.5 text-[11px] font-semibold text-text-primary">
                                      <Package className="w-3.5 h-3.5 text-primary-sage" />
                                      <span>{isEn ? "Purchased Products Detail" : "Detail Produk Dibeli"}</span>
                                    </div>
                                    {items.length === 0 ? (
                                      <p className="p-3 text-xs text-text-muted">
                                        {isEn ? "No product items recorded." : "Tidak ada detail produk tercatat."}
                                      </p>
                                    ) : (
                                      <table className="w-full text-left text-[11px]">
                                        <thead>
                                          <tr className="border-b border-border-subtle text-text-muted uppercase text-[10px]">
                                            <th className="py-2 px-3">SKU</th>
                                            <th className="py-2 px-3">{isEn ? "Product" : "Nama Produk"}</th>
                                            <th className="py-2 px-3 text-right">Qty</th>
                                            <th className="py-2 px-3 text-right">{isEn ? "Unit Price" : "Harga Satuan"}</th>
                                            <th className="py-2 px-3 text-right">TP</th>
                                            <th className="py-2 px-3 text-right">Subtotal</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-subtle">
                                          {items.map((it: any) => (
                                            <tr key={it.id}>
                                              <td className="py-2 px-3 font-mono text-primary-sage">
                                                {it.sku || "-"}
                                              </td>
                                              <td className="py-2 px-3 font-medium text-text-primary">
                                                {it.productName}
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono tabular-nums">
                                                {it.qty}
                                              </td>
                                              <td className="py-2 px-3 text-right tabular-nums">
                                                {formatCurrency(it.unitPrice)}
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono tabular-nums text-accent-gold">
                                                {it.tpPoints || 0}
                                              </td>
                                              <td className="py-2 px-3 text-right font-semibold tabular-nums">
                                                {formatCurrency(it.totalPrice)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserDetailView;
