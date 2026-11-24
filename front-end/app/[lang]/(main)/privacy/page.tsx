import React from "react";
import { getLocale } from "next-intl/server";
import { PolicyPageShell } from "@/components/molecules/PolicyPageShell";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const isEn = locale === "en";

  return (
    <PolicyPageShell
      badge="PRIVACY"
      title={isEn ? "Privacy Policy" : "Kebijakan Privasi"}
      subtitle={
        isEn
          ? "How Tijarah BC HNI Bukittinggi 3 collects, protects, and uses your personal and transaction data."
          : "Bagaimana Tijarah BC HNI Bukittinggi 3 mengumpulkan, melindungi, dan menggunakan data pribadi serta transaksi Anda."
      }
      updatedAt={isEn ? "Effective Nov 2026" : "Berlaku Nov 2026"}
      backLabel={isEn ? "Back to Home" : "Kembali ke Beranda"}
      sections={[
        {
          heading: isEn ? "1. Data We Collect" : "1. Data yang Kami Kumpulkan",
          body: [
            isEn
              ? "We collect account details (name, email, phone number), shipping addresses, HNI Member ID (for point & agent verification), and order history solely to fulfill your orders."
              : "Kami mengumpulkan data akun (nama, email, nomor HP), alamat pengiriman, ID Mitra HNI (untuk verifikasi agen & poin), dan riwayat pesanan semata-mata untuk memproses transaksi Anda.",
          ],
        },
        {
          heading: isEn ? "2. Payment Security" : "2. Keamanan Pembayaran",
          body: [
            isEn
              ? "Online payments are processed securely through Xendit. Tijarah does not store your card or banking credentials."
              : "Pembayaran online diproses secara aman melalui gateway Xendit. Tijarah tidak menyimpan kredensial kartu atau perbankan Anda.",
          ],
        },
      ]}
    />
  );
}
