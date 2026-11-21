import React from "react";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { StoreDashboard } from "@/modules/store/StoreDashboard";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isID = locale === "id";
  return {
    title: isID
      ? "ERP Toko & Back-Office | TIJARAH-3"
      : "Store ERP & Back-Office | TIJARAH-3",
    description: isID
      ? "Sistem manajemen stok, kasir POS, pesanan, dan kasbon mitra BC HNI 3 Bukittinggi."
      : "Executive Back-Office, POS Cashier & Vendor Order Management for BC HNI 3 Bukittinggi.",
  };
}

export default function StorePage() {
  return <StoreDashboard />;
}
