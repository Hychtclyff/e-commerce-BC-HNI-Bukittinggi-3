import { Metadata } from "next";
import { Button, Card, Chip } from "@heroui/react";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import Landing from "@/modules/Beranda/landing";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tijarah.vercel.app";

// --- Dynamic SEO Metadata ---
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const isID = locale === "id";

    const title = isID
        ? "TIJARAH-3 | Platform E-Commerce Herbal Resmi BC HNI 3 Bukittinggi"
        : "TIJARAH-3 | Official Herbal E-Commerce Platform BC HNI 3 Bukittinggi";

    const description = isID
        ? "Belanja produk herbal HNI asli dengan harga transparan (HK & HA), auto-posting poin HSIS, dan pengiriman cepat se-Sumatera Barat."
        : "Shop authentic HNI herbal products with transparent pricing (HK & HA), auto-posting HSIS points, and fast delivery across West Sumatra.";

    return {
        title,
        description,
        metadataBase: new URL(BASE_URL),
        alternates: {
            canonical: `/${locale}`,
            languages: {
                "id": "/id",
                "en": "/en",
            },
        },
        openGraph: {
            type: "website",
            locale: isID ? "id_ID" : "en_US",
            url: `${BASE_URL}/${locale}`,
            siteName: "TIJARAH-3",
            title,
            description,
            images: [
                {
                    url: `${BASE_URL}/og-default.png`,
                    width: 1200,
                    height: 630,
                    alt: "TIJARAH-3 — BC HNI 3 Bukittinggi",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [`${BASE_URL}/og-default.png`],
        },
        keywords: [
            "HNI HPAI", "BC HNI 3 Bukittinggi", "produk herbal", "e-commerce herbal",
            "mitra agen HNI", "stokis HNI", "harga agen HA", "poin TP HSIS",
            "ekspedisi Sumbar", "herba halal", "TIJARAH",
        ],
        robots: {
            index: true,
            follow: true,
        },
    };
}



export default async function HomePage() {
    const t = await getTranslations("Landing");

    return (
        <Landing />
    );
}