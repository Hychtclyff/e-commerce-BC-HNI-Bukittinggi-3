import { Metadata } from "next";
import { Button, Card, Chip } from "@heroui/react";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { HeroSection } from "@/modules/Beranda/landing/components/organisms/heroSection";
import { CTASection } from "@/modules/Beranda/landing/components/organisms/CTASection";
import { Products } from "../organisms/productSection";
import { NewsHighlightSection } from "../organisms/newsSection";
import { FaqSection } from "../organisms/faqSection";
import { LandingReveal } from "../atoms/LandingReveal";

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
                    alt: "TIJARAH-3 - BC HNI 3 Bukittinggi",
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

// Data produk unggulan


export const Landing = async () => {
    const t = await getTranslations("Landing");
    const locale = await getLocale();
    const isID = locale === "id";

    return (
        <div className="flex flex-col gap-0 pb-0">
            {/* 1. BRAND HERO SECTION */}
            <LandingReveal delayMs={0}>
                <HeroSection />
            </LandingReveal>

            {/* 1b. BRAND HIGHLIGHTS BAR (Menyambut langsung fade Hero di bg-canvas) */}
            <LandingReveal delayMs={40}>
                <section className="py-10 sm:py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-sage">
                                {isID ? "Jaminan Keaslian" : "Authenticity"}
                            </span>
                            <h3 className="text-base sm:text-lg font-extrabold text-text-primary">
                                {isID ? "100% Produk Herba Resmi HNI" : "100% Official HNI Herbal"}
                            </h3>
                            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                                {isID
                                    ? "Langsung dari gudang Business Center 3 Bukittinggi dengan segel utuh."
                                    : "Sourced directly from Business Center 3 Bukittinggi warehouse."}
                            </p>
                        </div>
                        <div className="space-y-1.5 md:border-x md:border-border-subtle/60 md:px-6">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-sage">
                                {isID ? "Transparansi Harga" : "Transparent Pricing"}
                            </span>
                            <h3 className="text-base sm:text-lg font-extrabold text-text-primary">
                                {isID ? "Harga Konsumen & Agen + Poin TP" : "Consumer & Agent Price + TP"}
                            </h3>
                            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                                {isID
                                    ? "Tautkan ID HNI di profil untuk harga agen dan pencatatan poin HSIS."
                                    : "Link your HNI ID in profile for agent pricing and HSIS points."}
                            </p>
                        </div>
                        <div className="space-y-1.5 md:pl-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-sage">
                                {isID ? "Layanan Fleksibel" : "Flexible Fulfillment"}
                            </span>
                            <h3 className="text-base sm:text-lg font-extrabold text-text-primary">
                                {isID ? "Ambil di Gerai & Pengiriman Regional" : "Store Pickup & Regional Delivery"}
                            </h3>
                            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                                {isID
                                    ? "Ambil langsung di Jl. Panorama No. 18 atau kirim ke seluruh wilayah."
                                    : "Pick up at Jl. Panorama No. 18 or ship directly to your address."}
                            </p>
                        </div>
                    </div>
                </section>
            </LandingReveal>

            {/* 2. HIGHLIGHT PRODUCTS CAROUSEL */}
            <LandingReveal delayMs={60}>
                <div className="py-8 sm:py-12">
                    <Products />
                </div>
            </LandingReveal>

            {/* 3. LATEST NEWS & HERBAL EDUCATION (Symmetrical canvas -> sage -> canvas band) */}
            <LandingReveal delayMs={80}>
                <div className="w-screen relative left-1/2 -translate-x-1/2 bg-gradient-to-b from-canvas via-primary-sage/[0.06] to-canvas py-14 sm:py-16">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                        <NewsHighlightSection />
                    </div>
                </div>
            </LandingReveal>

            {/* 4. FAQ SECTION (ACCORDION + ILLUSTRATION) */}
            <LandingReveal delayMs={80}>
                <div className="py-10 sm:py-14">
                    <FaqSection />
                </div>
            </LandingReveal>

            {/* 5. FULL-WIDTH CTA (from-canvas langsung menyambut FAQ tanpa garis pemisah) */}
            <LandingReveal delayMs={80}>
                <CTASection />
            </LandingReveal>
        </div>
    );
}