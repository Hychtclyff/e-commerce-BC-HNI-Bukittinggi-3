import React from "react";
import { getLocale } from "next-intl/server";
import { PolicyPageShell } from "@/components/molecules/PolicyPageShell";

export default async function TermsPage() {
  const locale = await getLocale();
  const isEn = locale === "en";

  return (
    <PolicyPageShell
      badge="LEGAL"
      title={isEn ? "Terms & Conditions" : "Syarat & Ketentuan"}
      subtitle={
        isEn
          ? "Terms governing purchases, agent transactions, and B2B credit usage on Tijarah BC HNI Bukittinggi 3."
          : "Ketentuan penggunaan layanan belanja, transaksi keagenan, dan fasilitas B2B di Tijarah BC HNI Bukittinggi 3."
      }
      updatedAt={isEn ? "Effective Nov 2026" : "Berlaku Nov 2026"}
      backLabel={isEn ? "Back to Home" : "Kembali ke Beranda"}
      sections={[
        {
          heading: isEn ? "1. Orders & Pricing" : "1. Pemesanan & Harga Produk",
          body: [
            isEn
              ? "Product prices follow official HNI catalog pricing (Consumer Price and verified Agent Price). Stock availability is reserved upon checkout creation."
              : "Harga produk mengikuti ketentuan resmi katalog HNI (Harga Konsumen dan Harga Agen terverifikasi). Stok produk dialokasikan saat checkout berhasil dibuat.",
          ],
        },
        {
          heading: isEn ? "2. B2B Kasbon / Credit Facility" : "2. Fasilitas Kasbon / Kredit B2B",
          body: [
            isEn
              ? "Kasbon credit limits are granted selectively to verified agents/partners and must be settled before the agreed due date."
              : "Limit kasbon diberikan secara selektif kepada agen/mitra terverifikasi dan wajib dilunasi sebelum tanggal jatuh tempo yang tercantum pada invoice.",
          ],
        },
      ]}
    />
  );
}
