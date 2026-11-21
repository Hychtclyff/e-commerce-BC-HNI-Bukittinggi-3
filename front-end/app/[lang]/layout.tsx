import { Metadata } from "next";
import { Providers } from "./(main)/providers";
import { isRTL } from "@heroui/react";
import { getMessages } from "next-intl/server";
import "@/styles/globals.css";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { AnalyticsRouteTracker } from "@/components/analytics/AnalyticsRouteTracker";
import { Suspense } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tijarah.vercel.app";

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "TIJARAH-3 | Platform E-Commerce BC HNI 3 Bukittinggi",
        template: "%s | TIJARAH-3",
    },
    description:
        "Platform e-commerce & back-office terpadu Business Center HNI 3 Bukittinggi. Produk herbal asli, auto-posting HSIS, kasbon mitra stokis.",
    openGraph: {
        type: "website",
        siteName: "TIJARAH-3",
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
    },
};

export async function generateStaticParams() {
    return [{ lang: "id" }, { lang: "en" }];
}

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const messages = await getMessages({ locale: lang });

    return (
        <html lang={lang} dir={isRTL(lang) ? "rtl" : "ltr"} suppressHydrationWarning>
            <body className="min-h-screen bg-canvas text-text-primary font-sans antialiased flex flex-col">
                <Providers
                    lang={lang}
                    messages={messages}
                    themeProps={{ attribute: "class", defaultTheme: "light" }}
                >
                    {children}
                </Providers>

                {/* ── Analytics Scripts (non-blocking) ── */}
                {/* GA4: inject gtag.js script */}
                <GoogleAnalytics />

                {/* Meta Pixel: inject fbevents.js script */}
                <MetaPixel />

                {/* SPA route change tracker — GA4 + Meta Pixel pageview */}
                <Suspense fallback={null}>
                    <AnalyticsRouteTracker />
                </Suspense>


            </body>
        </html>
    );
}