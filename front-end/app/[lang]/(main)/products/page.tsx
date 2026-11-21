import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import Products from "@/modules/Beranda/products";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tijarah.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const isID = locale === "id";

    const pageTitle = isID
        ? "Katalog Produk Herbal HNI | TIJARAH-3"
        : "HNI Herbal Product Catalog | TIJARAH-3";

    const pageDesc = isID
        ? "Jelajahi koleksi lengkap produk herbal HNI bersertifikat halal dengan harga transparan (HK & HA) dan alokasi poin HSIS. Spirulina, Madu, Kopi 7 Elemen, dan ratusan SKU lainnya."
        : "Browse the complete collection of halal-certified HNI herbal products with transparent pricing (HK & HA) and HSIS point allocation. Spirulina, Honey, Sevel Coffee, and hundreds more SKUs.";

    return {
        title: pageTitle,
        description: pageDesc,
        alternates: {
            canonical: `/${locale}/products`,
            languages: { id: "/id/products", en: "/en/products" },
        },
        openGraph: {
            type: "website",
            locale: isID ? "id_ID" : "en_US",
            url: `${BASE_URL}/${locale}/products`,
            siteName: "TIJARAH-3",
            title: pageTitle,
            description: pageDesc,
            images: [{ url: `${BASE_URL}/og-products.png`, width: 1200, height: 630 }],
        },
        twitter: { card: "summary_large_image", title: pageTitle, description: pageDesc },
    };
}

export default async function ProductsPage() {
    await getTranslations("Products");

    return (
        <Products />
    );
}
