import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import ShopPage from "@/modules/shop";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tijarah.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isID = locale === "id";

  const pageTitle = isID
    ? "Belanja Herba & Kasir Checkout B2B | TIJARAH-3"
    : "Shop & B2B Checkout | TIJARAH-3";

  const pageDesc = isID
    ? "Pusat belanja online produk herbal resmi BC HNI 3 Bukittinggi. Nikmati harga agen, alokasi poin HSIS, voucher diskon subsidi ongkir travel L300, dan pembayaran tempo Kasbon B2B (H+14)."
    : "Official online store for BC HNI 3 Bukittinggi herbal products. Enjoy agent pricing, HSIS points, shipping subsidies, and B2B credit payments (D+14).";

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `/${locale}/shop`,
      languages: { id: "/id/shop", en: "/en/shop" },
    },
    openGraph: {
      type: "website",
      locale: isID ? "id_ID" : "en_US",
      url: `${BASE_URL}/${locale}/shop`,
      siteName: "TIJARAH-3",
      title: pageTitle,
      description: pageDesc,
    },
  };
}

export default function Page() {
  return <ShopPage />;
}
