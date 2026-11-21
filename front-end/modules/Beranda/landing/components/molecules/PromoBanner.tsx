"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

/**
 * PromoBanner - Banner promosi yang bergilir di atas Navbar.
 * Bisa di-dismiss dan status tersimpan di sessionStorage.
 */
export function PromoBanner() {
    const t = useTranslations("Landing");

    const messages = t.raw("promoMessages") as string[];
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Cek apakah user sudah dismiss di session ini
    useEffect(() => {
        const dismissed = sessionStorage.getItem("tijarah_promo_dismissed");
        if (!dismissed) setIsVisible(true);
    }, []);

    // Rotasi pesan setiap 4 detik
    useEffect(() => {
        if (!isVisible || messages.length <= 1) return;
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIdx((prev) => (prev + 1) % messages.length);
                setIsAnimating(false);
            }, 300);
        }, 4000);
        return () => clearInterval(interval);
    }, [isVisible, messages.length]);

    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        sessionStorage.setItem("tijarah_promo_dismissed", "1");
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className="w-full bg-gradient-to-r from-primary-dark via-primary-sage to-primary-dark text-white py-2.5 px-4 relative overflow-hidden"
            role="banner"
            aria-label="Promotional banner"
        >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />

            <div className="mx-auto max-w-[1280px] flex items-center justify-between gap-3">
                {/* Badge */}
                <span className="hidden sm:inline-flex shrink-0 text-[10px] font-bold tracking-widest uppercase bg-accent-gold text-white px-2 py-0.5 rounded-full">
                    {t("promoBadge")}
                </span>

                {/* Rotating message */}
                <p
                    className={`text-xs sm:text-sm font-medium text-center flex-1 transition-all duration-300 ${
                        isAnimating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
                    }`}
                >
                    {messages[currentIdx]}
                </p>

                {/* CTA + Close */}
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/register"
                        className="hidden sm:inline-flex text-[11px] font-semibold underline underline-offset-2 hover:text-accent-gold transition-colors whitespace-nowrap"
                        onClick={handleDismiss}
                    >
                        {t("promoCtaLabel")} →
                    </Link>
                    <button
                        aria-label="Dismiss promotional banner"
                        onClick={handleDismiss}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1 mt-1.5">
                {messages.map((_, i) => (
                    <button
                        key={i}
                        aria-label={`Go to promo message ${i + 1}`}
                        onClick={() => setCurrentIdx(i)}
                        className={`h-1 rounded-full transition-all duration-300 ${
                            i === currentIdx ? "w-4 bg-accent-gold" : "w-1 bg-white/40"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
