// components/analytics/GoogleAnalytics.tsx
// Inject GA4 script — route tracking ditangani oleh AnalyticsRouteTracker
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

/**
 * Inject Google Analytics 4 gtag.js script ke halaman.
 * Tidak akan render jika GA_MEASUREMENT_ID kosong atau invalid.
 *
 * Tempatkan di root layout (di luar <Suspense>) agar script dimuat global.
 * Untuk SPA pageview tracking, gunakan <AnalyticsRouteTracker /> bersama ini.
 */
export function GoogleAnalytics() {
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") return null;

    return (
        <>
            {/* Google tag (gtag.js) — afterInteractive agar tidak blokir LCP */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script
                id="google-analytics-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${GA_MEASUREMENT_ID}', {
                            page_path: window.location.pathname,
                            send_page_view: false
                        });
                    `,
                }}
            />
        </>
    );
}
