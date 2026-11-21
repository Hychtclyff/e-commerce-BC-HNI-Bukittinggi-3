import React from "react";
import { Store, Package, Tag, ShoppingBag, BarChart3, Settings } from "lucide-react";
import { TijarahCard, TijarahCardHeader, TijarahCardTitle, TijarahCardDescription, TijarahCardContent } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";

export function StoreDashboardPage() {
  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* 1. Header Dashboard Toko */}
      <div className="p-6 sm:p-8 rounded-3xl mac-glass border border-border-subtle mac-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-sage/15 text-primary-sage flex items-center justify-center shrink-0">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary-sage">
                Business Center HNI 3 Bukittinggi
              </span>
              <TijarahBadge tijarahVariant="success">Live Active</TijarahBadge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight mt-0.5">
              Dashboard Toko & Vendor
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TijarahButton tijarahVariant="primary" className="text-xs font-bold py-2.5 px-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>+ Tambah Produk Baru</span>
          </TijarahButton>
        </div>
      </div>

      {/* 2. Statistik Cepat Toko */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TijarahCard tijarahVariant="elevated" className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Total Produk</span>
            <Package className="w-5 h-5 text-primary-sage" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-text-primary">124 SKU</div>
            <span className="text-xs text-status-success font-semibold">Semua stok aktif di gudang</span>
          </div>
        </TijarahCard>

        <TijarahCard tijarahVariant="elevated" className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Pesanan Masuk</span>
            <ShoppingBag className="w-5 h-5 text-accent-gold" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-text-primary">8 Pending</div>
            <span className="text-xs text-text-muted font-medium">Membutuhkan verifikasi stok</span>
          </div>
        </TijarahCard>

        <TijarahCard tijarahVariant="elevated" className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Kupon Aktif</span>
            <Tag className="w-5 h-5 text-primary-sage" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-text-primary">5 Kupon</div>
            <span className="text-xs text-primary-sage font-semibold">Diskon & Subsidi aktif</span>
          </div>
        </TijarahCard>

        <TijarahCard tijarahVariant="elevated" className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Omset Bulan Ini</span>
            <BarChart3 className="w-5 h-5 text-status-success" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-primary-sage">Rp 48.500.000</div>
            <span className="text-xs text-status-success font-semibold">+12% dari bulan lalu</span>
          </div>
        </TijarahCard>
      </div>

      {/* 3. Manajemen Tab / Fitur Utama Toko */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Manajemen Produk & Stok (2 span) */}
        <div className="lg:col-span-2 space-y-6">
          <TijarahCard tijarahVariant="default">
            <TijarahCardHeader className="flex flex-row items-center justify-between">
              <div>
                <TijarahCardTitle>Manajemen Barang & Stok</TijarahCardTitle>
                <TijarahCardDescription>Daftar produk herba HNI yang terdaftar di etalase BC3.</TijarahCardDescription>
              </div>
              <TijarahButton tijarahVariant="outline" size="sm" className="text-xs font-bold">
                Kelola Semua
              </TijarahButton>
            </TijarahCardHeader>
            <TijarahCardContent>
              <div className="text-center py-12 text-text-muted text-xs">
                Modul manajemen barang & inventaris aktif. Gunakan tombol Tambah Produk Baru di atas untuk menambah SKU herba baru.
              </div>
            </TijarahCardContent>
          </TijarahCard>

          <TijarahCard tijarahVariant="default">
            <TijarahCardHeader className="flex flex-row items-center justify-between">
              <div>
                <TijarahCardTitle>Manajemen Pesanan & Konfirmasi</TijarahCardTitle>
                <TijarahCardDescription>Verifikasi fisik stok dan setujui pesanan pelanggan/agen.</TijarahCardDescription>
              </div>
              <TijarahButton tijarahVariant="outline" size="sm" className="text-xs font-bold">
                Lihat Pesanan Masuk
              </TijarahButton>
            </TijarahCardHeader>
            <TijarahCardContent>
              <div className="text-center py-12 text-text-muted text-xs">
                Belum ada pesanan tertunda yang memerlukan verifikasi mendesak.
              </div>
            </TijarahCardContent>
          </TijarahCard>
        </div>

        {/* Kolom Kanan: Manajemen Kupon & Template Resi (1 span) */}
        <div className="space-y-6">
          <TijarahCard tijarahVariant="default">
            <TijarahCardHeader>
              <TijarahCardTitle>Manajemen Kupon & Promo</TijarahCardTitle>
              <TijarahCardDescription>Atur diskon dan voucher belanja.</TijarahCardDescription>
            </TijarahCardHeader>
            <TijarahCardContent className="space-y-3">
              <div className="p-3 rounded-xl bg-canvas border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-text-primary block">DISKONHEMAT3</span>
                  <span className="text-[11px] text-text-muted">Potongan Rp 15.000</span>
                </div>
                <TijarahBadge tijarahVariant="success">Aktif</TijarahBadge>
              </div>
              <div className="p-3 rounded-xl bg-canvas border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-text-primary block">SUBSIDIOGKIR</span>
                  <span className="text-[11px] text-text-muted">Subsidi Travel L300</span>
                </div>
                <TijarahBadge tijarahVariant="success">Aktif</TijarahBadge>
              </div>
            </TijarahCardContent>
          </TijarahCard>

          <TijarahCard tijarahVariant="default">
            <TijarahCardHeader>
              <TijarahCardTitle>Template Resi & Faktur</TijarahCardTitle>
              <TijarahCardDescription>Pratinjau struktur faktur resmi BC3.</TijarahCardDescription>
            </TijarahCardHeader>
            <TijarahCardContent>
              <div className="p-3 rounded-xl bg-primary-sage/10 border border-primary-sage/30 text-xs space-y-2">
                <span className="font-bold text-primary-sage block">✓ Format Resmi BC HNI 3</span>
                <p className="text-text-muted leading-relaxed">
                  Semua nota dan resi pesanan otomatis menyertakan QR verifikasi, detail item dari database, serta perhitungan poin HSIS.
                </p>
              </div>
            </TijarahCardContent>
          </TijarahCard>
        </div>
      </div>
    </div>
  );
}

export default StoreDashboardPage;
