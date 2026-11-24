import React from "react";
import { getLocale } from "next-intl/server";
import { PolicyPageShell } from "@/components/molecules/PolicyPageShell";

export default async function ShippingInfoPage() {
  const locale = await getLocale();
  const isEn = locale === "en";

  return (
    <PolicyPageShell
      badge="SHIPPING"
      title={isEn ? "Shipping Information" : "Informasi Pengiriman"}
      subtitle={
        isEn
          ? "Available delivery options, regional travel couriers, and store pickup at BC HNI Bukittinggi 3."
          : "Pilihan layanan pengiriman, kurir travel regional, dan pengambilan langsung di toko BC HNI Bukittinggi 3."
      }
      updatedAt={isEn ? "Updated Nov 2026" : "Diperbarui Nov 2026"}
      backLabel={isEn ? "Back to Home" : "Kembali ke Beranda"}
      sections={[
        {
          heading: isEn ? "1. Store Pickup & Local Delivery" : "1. Ambil di Toko & Kurir Lokal",
          body: [
            isEn
              ? "Customers in Bukittinggi and surrounding areas can choose Store Pickup (zero shipping fee) or regional travel/courier services calculated dynamically at checkout."
              : "Pelanggan di area Bukittinggi dan sekitarnya dapat memilih Ambil di Toko (gratis ongkir) atau layanan kurir/travel regional yang dihitung otomatis saat checkout.",
          ],
        },
        {
          heading: isEn ? "2. Order Processing Time" : "2. Waktu Proses Pesanan",
          body: [
            isEn
              ? "Paid orders confirmed before 15:00 WIB are processed and dispatched on the same business day."
              : "Pesanan lunas yang terkonfirmasi sebelum pukul 15.00 WIB akan diproses dan dikirim pada hari kerja yang sama.",
          ],
        },
      ]}
    />
  );
}
