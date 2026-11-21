import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import CheckoutPage from "@/modules/checkout";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tijarah.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isID = locale === "id";

  const pageTitle = isID
    ? "Checkout & Pembayaran B2B | TIJARAH-3"
    : "B2B Checkout & Payment | TIJARAH-3";

  const pageDesc = isID
    ? "Selesaikan transaksi belanja produk herbal HNI dengan opsi pengiriman Travel L300, diskon voucher, dan fasilitas tempo Kasbon B2B (H+14) di BC HNI 3 Bukittinggi."
    : "Complete your HNI herbal product order with L300 travel shipping, voucher discounts, and B2B credit terms (D+14) at BC HNI 3 Bukittinggi.";

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `/${locale}/checkout`,
      languages: { id: "/id/checkout", en: "/en/checkout" },
    },
    openGraph: {
      type: "website",
      locale: isID ? "id_ID" : "en_US",
      url: `${BASE_URL}/${locale}/checkout`,
      siteName: "TIJARAH-3",
      title: pageTitle,
      description: pageDesc,
    },
  };
}

export default function Page() {
  return <CheckoutPage />;
}
