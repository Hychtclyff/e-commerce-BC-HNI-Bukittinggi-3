import React from "react";
import { getLocale } from "next-intl/server";
import { PolicyPageShell } from "@/components/molecules/PolicyPageShell";

export default async function ReturnsPolicyPage() {
  const locale = await getLocale();
  const isEn = locale === "en";

  return (
    <PolicyPageShell
      badge="RETURNS"
      title={isEn ? "Returns & Refund Policy" : "Kebijakan Retur & Pengembalian Dana"}
      subtitle={
        isEn
          ? "Guidelines for reporting damaged, defective, or incorrect items and requesting a return or refund."
          : "Panduan pengajuan komplain, penukaran barang rusak/tidak sesuai, dan pengembalian dana pesanan."
      }
      updatedAt={isEn ? "Updated Nov 2026" : "Diperbarui Nov 2026"}
      backLabel={isEn ? "Back to Home" : "Kembali ke Beranda"}
      sections={[
        {
          heading: isEn ? "1. Eligibility for Return" : "1. Syarat Pengajuan Retur",
          body: [
            isEn
              ? "You may submit a return/complaint request directly from your Order Detail page for SHIPPED or COMPLETED orders within 3x24 hours of receipt, accompanied by photo/video evidence."
              : "Anda dapat mengajukan retur/komplain langsung melalui halaman Detail Pesanan untuk pesanan berstatus DIKIRIM atau SELESAI maksimal 3x24 jam setelah barang diterima, disertai tautan bukti foto/video unboxing.",
          ],
        },
        {
          heading: isEn ? "2. Review & Refund Process" : "2. Proses Verifikasi & Pengembalian",
          body: [
            isEn
              ? "Our store team will review your request within 1-2 business days. Approved refunds are processed to your original payment method or store credit."
              : "Tim toko akan meninjau pengajuan Anda dalam 1-2 hari kerja. Pengembalian dana yang disetujui diproses ke rekening asal atau saldo kredit mitra.",
          ],
        },
      ]}
    />
  );
}
