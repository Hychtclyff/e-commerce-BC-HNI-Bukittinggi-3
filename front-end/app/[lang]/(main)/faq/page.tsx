import React from "react";
import { getLocale } from "next-intl/server";
import { PolicyPageShell } from "@/components/molecules/PolicyPageShell";

export default async function FaqPage() {
  const locale = await getLocale();
  const isEn = locale === "en";

  return (
    <PolicyPageShell
      badge="FAQ"
      title={isEn ? "Frequently Asked Questions" : "Pertanyaan Umum (FAQ)"}
      subtitle={
        isEn
          ? "Answers to common questions about HNI product orders, agent pricing, payments, and shipping at BC HNI Bukittinggi 3."
          : "Jawaban atas pertanyaan yang sering diajukan seputar pemesanan produk HNI, harga agen, pembayaran, dan pengiriman di BC HNI Bukittinggi 3."
      }
      updatedAt={isEn ? "Updated Nov 2026" : "Diperbarui Nov 2026"}
      backLabel={isEn ? "Back to Home" : "Kembali ke Beranda"}
      sections={[
        {
          heading: isEn ? "1. How do I get HNI Agent Pricing & TP Points?" : "1. Bagaimana cara mendapatkan Harga Agen & Poin TP HNI?",
          body: [
            isEn
              ? "Register or log in to your Tijarah account, then open Profile -> HNI Agent Verification and link your valid HNI Member ID. Once verified, all eligible products automatically display agent prices and TP points."
              : "Daftar atau masuk ke akun Tijarah Anda, lalu buka menu Profil -> Verifikasi Agen HNI dan tautkan ID Mitra HNI Anda. Setelah terverifikasi, seluruh produk yang berlaku otomatis menampilkan harga agen dan poin TP.",
          ],
        },
        {
          heading: isEn ? "2. What payment methods are supported?" : "2. Metode pembayaran apa saja yang tersedia?",
          body: [
            isEn
              ? "We support instant online payments via Xendit (QRIS, Virtual Account BCA/Mandiri/BNI/BRI/BSI/Permata, E-Wallet), Cash at Store / COD, and B2B Kasbon (Tempo) for verified partners."
              : "Kami mendukung pembayaran online instan via Xendit (QRIS, Virtual Account BCA/Mandiri/BNI/BRI/BSI/Permata, E-Wallet), Bayar di Toko / COD, serta Kasbon B2B (Tempo) bagi mitra yang telah disetujui.",
          ],
        },
        {
          heading: isEn ? "3. How long before unpaid orders expire?" : "3. Berapa lama batas waktu pembayaran pesanan?",
          body: [
            isEn
              ? "Unpaid online orders expire automatically after 24 hours, and reserved stock will be restored to the store inventory."
              : "Pesanan online yang belum dibayar akan kedaluwarsa otomatis setelah 24 jam dan stok produk akan dikembalikan ke inventori toko.",
          ],
        },
      ]}
    />
  );
}
