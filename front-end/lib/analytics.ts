// lib/analytics.ts
// ─── Satu sumber kebenaran untuk semua tracking analytics ───

// ── Config ──────────────────────────────────────────────────────────────────
export const GA_MEASUREMENT_ID =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const META_PIXEL_ID =
    process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export const IS_DEV = process.env.NODE_ENV === "development";

// ── TypeScript: deklarasi global window ──────────────────────────────────────
declare global {
    interface Window {
        gtag: (...args: unknown[]) => void;
        dataLayer: unknown[];
        fbq: (...args: unknown[]) => void;
        _fbq: unknown;
    }
}

// ── Google Analytics 4 ───────────────────────────────────────────────────────

/** Kirim pageview ke GA4 (SPA navigation) */
export function pageview(url: string): void {
    if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return;
    window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: url,
    });
}

/** Kirim custom event ke GA4 */
export function trackGAEvent(
    eventName: string,
    params?: Record<string, unknown>
): void {
    if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return;
    window.gtag("event", eventName, params);
}

/**
 * Alias `event()` — kompatibel dengan penggunaan lama AuthCTAButton, dll.
 * @deprecated Gunakan `trackGAEvent()` langsung untuk kode baru.
 */
export function event(
    actionOrOptions:
        | string
        | { action: string; category?: string; label?: string; value?: number },
    params?: Record<string, unknown>
): void {
    if (typeof actionOrOptions === "string") {
        // Pemanggilan baru: event("click_cta_register", { event_category: "..." })
        trackGAEvent(actionOrOptions, params);
    } else {
        // Pemanggilan lama: event({ action, category, label, value })
        trackGAEvent(actionOrOptions.action, {
            event_category: actionOrOptions.category,
            event_label: actionOrOptions.label,
            value: actionOrOptions.value,
        });
    }
}

// ── Meta Pixel ────────────────────────────────────────────────────────────────

/** Kirim custom event ke Meta Pixel */
export function trackMetaPixelEvent(
    eventName: string,
    params?: Record<string, unknown>
): void {
    if (typeof window === "undefined" || !window.fbq || !META_PIXEL_ID) return;
    window.fbq("track", eventName, params);
}
