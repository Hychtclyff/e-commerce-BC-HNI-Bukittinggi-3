# 🎨 Spesifikasi Frontend: Fitur Voucher, Diskon Checkout & Menu Notifikasi

> Dokumen spesifikasi teknis UI/UX, komponen reusable, integrasi i18n dwibahasa, serta manajemen state untuk fitur **Voucher Diskon Checkout** dan **Menu Notifikasi Pelanggan** pada aplikasi B2B **TIJARAH (BC HNI 3 Bukittinggi)**.

---

## 💎 1. Estetika & Standar Desain UI/UX

1. **Voucher & Diskon Checkout**:
   - **VoucherSelectorModal / Drawer**: Modal elegan dengan efek glassmorphism, daftar voucher promo berwarna emerald/teal dengan border khusus kupon (*ticket badge cutouts*).
   - **Visual Subtotal Breakdown**: Baris rincian potongan voucher dengan badge hijau menyala (misal: `- Rp 10.000 (DISKONHNI10K)`).
   - **Input Manual Kode Promo**: Input text dengan tombol *"Gunakan / Apply"* yang memberikan feedback instan (Toast notification / Shake error pada invalid code).
2. **Menu & Dropdown Notifikasi**:
   - **Navbar Notification Bell (`NotificationBell.tsx`)**:
     - Lonceng icon dengan **Unread Badge** merah berdenyut (*animated pulse*).
     - **Dropdown Popover (`NotificationDropdown.tsx`)**: Popover melayang modern yang menampilkan 5 notifikasi terbaru, indikator titik biru (*unread indicator*), filter cepat (`Semua`, `Belum Dibaca`), serta tombol *"Tandai Semua Dibaca"*.
   - **Halaman Pusat Notifikasi (`/profile/notifications`)**:
     - Halaman penuh yang responsif, dilengkapi tab filter kategori (`Semua`, `Pesanan`, `Kasbon B2B`, `Promo`), pencarian kata kunci, serta tombol hapus/baca.
3. **Responsive & Dark Mode**:
   - Menggunakan Tailwind v4 CSS variables & kustomisasi warna HSL (`dark:bg-slate-900`, `dark:border-slate-800`, `dark:text-slate-100`).
   - Dwibahasa (ID / EN) via dictionary Next.js (`id.json` / `en.json` atau `useTranslations`).

---

## 🧱 2. Arsitektur Komponen Reusable Frontend

```
front-end/
├── components/
│   ├── molecules/
│   │   ├── NotificationBell.tsx       // Lonceng Navbar + Badge Counter + Popover Dropdown
│   │   ├── NotificationItem.tsx       // Item Kartu Notifikasi (Icon Kategori, Waktu, Read Status)
│   │   ├── VoucherCard.tsx            // Kartu Kupon Promo (Title, Diskon, Min. Belanja, Claim Button)
│   │   └── VoucherSelectorModal.tsx   // Modal / Drawer Pilihan Voucher pada Halaman Checkout
├── modules/
│   ├── notifications/
│   │   ├── api/notifications.api.ts   // Axios/Fetch Client Endpoints Notifikasi
│   │   ├── hooks/useNotifications.ts  // TanStack Query Hook (polling/refetch unread count & list)
│   │   └── components/
│   │       └── NotificationsPanel.tsx // Panel Pengaturan & Daftar Notifikasi di Profile Page
│   └── vouchers/
│       ├── api/vouchers.api.ts        // API Client Validasi & Claim Voucher
│       └── hooks/useVouchers.ts       // Hook Manajemen State Voucher Checkout
```

---

## 💻 3. Spesifikasi Komponen & Kode Implementation Guide

### 3.1. Navbar Notification Bell (`NotificationBell.tsx`)

```tsx
"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Package, CreditCard, Tag, Info } from "lucide-react";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { useTranslations } from "next-intl";

export const NotificationBell: React.FC = () => {
  const t = useTranslations("notifications");
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ORDER_STATUS":
        return <Package className="w-4 h-4 text-emerald-500" />;
      case "B2B_KASBON":
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case "PROMO_VOUCHER":
        return <Tag className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Lonceng Icon + Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 z-50">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-500" />
              {t("title")}
              {unreadCount > 0 && (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} {t("unread")}
                </span>
              )}
            </h3>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {t("empty")}
              </div>
            ) : (
              notifications.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`py-3 px-2 rounded-xl transition-colors cursor-pointer flex gap-3 ${
                    !item.isRead
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-1">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

### 3.2. Modal Selector Voucher pada Checkout (`VoucherSelectorModal.tsx`)

```tsx
"use client";

import React, { useState } from "react";
import { Ticket, Check, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface VoucherItem {
  code: string;
  title: string;
  discountType: "FIXED" | "PERCENTAGE" | "SHIPPING_SUBSIDY";
  discountValue: number;
  minPurchase: number;
  description: string;
}

interface VoucherSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  appliedCode?: string;
  onSelectVoucher: (code: string) => void;
}

export const VoucherSelectorModal: React.FC<VoucherSelectorModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  appliedCode,
  onSelectVoucher,
}) => {
  const t = useTranslations("vouchers");
  const [inputCode, setInputCode] = useState("");

  const availableVouchers: VoucherItem[] = [
    {
      code: "DISKONHNI10K",
      title: "Diskon Belanja Rp 10.000",
      discountType: "FIXED",
      discountValue: 10000,
      minPurchase: 50000,
      description: "Potongan Rp 10.000 untuk transaksi minimal Rp 50.000",
    },
    {
      code: "AGENHNI15",
      title: "Diskon Agen HNI 15%",
      discountType: "PERCENTAGE",
      discountValue: 15,
      minPurchase: 100000,
      description: "Khusus Agen HNI aktif. Maksimal potongan Rp 30.000",
    },
    {
      code: "FREEONGKIRBC3",
      title: "Gratis Ongkir BC3 Bukittinggi",
      discountType: "SHIPPING_SUBSIDY",
      discountValue: 15000,
      minPurchase: 0,
      description: "Subsidi ongkir Rp 15.000 tanpa minimal belanja",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
            <Ticket className="w-5 h-5 text-emerald-500" />
            <span>{t("modalTitle")}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manual Voucher Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder={t("inputPlaceholder")}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs uppercase font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => {
              if (inputCode) {
                onSelectVoucher(inputCode);
                onClose();
              }
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
          >
            {t("applyBtn")}
          </button>
        </div>

        {/* Voucher Cards */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {availableVouchers.map((v) => {
            const isEligible = subtotal >= v.minPurchase;
            const isSelected = appliedCode === v.code;

            return (
              <div
                key={v.code}
                onClick={() => {
                  if (isEligible) {
                    onSelectVoucher(v.code);
                    onClose();
                  }
                }}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30"
                    : isEligible
                    ? "border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-white dark:bg-slate-900"
                    : "border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{v.title}</span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> {t("active")}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{v.description}</p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/50">
                      {v.code}
                    </span>
                  </div>
                </div>

                {!isEligible && (
                  <p className="text-[10px] text-rose-500 font-medium mt-2">
                    {t("minPurchaseWarning", { min: v.minPurchase.toLocaleString("id-ID") })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

---

## 🌐 4. Kamus Bahasa (i18n Dictionaries)

### `public/locales/id.json`
```json
{
  "notifications": {
    "title": "Notifikasi",
    "unread": "Belum Dibaca",
    "markAllRead": "Tandai Semua Dibaca",
    "empty": "Belum ada notifikasi terbaru."
  },
  "vouchers": {
    "modalTitle": "Pilih Voucher Promo",
    "inputPlaceholder": "Masukkan Kode Promo",
    "applyBtn": "Gunakan",
    "active": "Terpakai",
    "minPurchaseWarning": "Min. belanja Rp {min} untuk menggunakan voucher ini"
  }
}
```

### `public/locales/en.json`
```json
{
  "notifications": {
    "title": "Notifications",
    "unread": "Unread",
    "markAllRead": "Mark All as Read",
    "empty": "No new notifications."
  },
  "vouchers": {
    "modalTitle": "Select Promo Voucher",
    "inputPlaceholder": "Enter Promo Code",
    "applyBtn": "Apply",
    "active": "Active",
    "minPurchaseWarning": "Min. purchase Rp {min} to apply this voucher"
  }
}
```
