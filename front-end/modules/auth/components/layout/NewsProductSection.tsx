"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { newsProductsData, NewsProductItem } from "./data/newsProducts";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahButton } from "@/components/atom/tijarahButton";
import Image from "next/image";

export const NewsProductSection: React.FC = () => {
    const t = useTranslations("NewsProduct");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const totalItems = newsProductsData.length;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % totalItems);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
    };

    // Auto-move carousel setiap 4 detik jika tidak di-hover
    useEffect(() => {
        if (!isPaused) {
            timerRef.current = setInterval(() => {
                nextSlide();
            }, 4000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused, currentIndex]);

    const handleCopyCode = (code: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        }
    };

    const currentItem: NewsProductItem = newsProductsData[currentIndex];

    return (
        <div
            className="w-full select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <TijarahCard
                tijarahVariant="elevated"
                className="relative overflow-hidden border border-border-subtle bg-surface/90 backdrop-blur-md shadow-xl transition-all duration-300 hover:shadow-2xl"
            >
                {/* Visual Background Ornaments */}
                <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-accent-gold/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-primary-sage/10 blur-2xl pointer-events-none" />

                <TijarahCard.Header className="relative p-4 border-b border-border-subtle/50 flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl shrink-0">🎁</span>
                        <div>
                            <h2 className="text-sm font-bold text-text-primary">
                                {t("sectionTitle")}
                            </h2>
                            <p className="text-xs text-text-muted mt-0.5">
                                {t("sectionSubtitle")}
                            </p>
                        </div>
                    </div>

                    {/* Badge Varian Komponen */}
                    <div className="shrink-0 absolute top-4 right-4">
                        <TijarahBadge tijarahVariant={currentItem.badgeVariant}>
                            {t(currentItem.badgeKey)}
                        </TijarahBadge>
                    </div>
                </TijarahCard.Header>

                <TijarahCard.Body className="py-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                        {/* Gambar Produk Carousel */}
                        <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-border-subtle">
                            <Image
                                width={100}
                                height={100}
                                src={currentItem.image}
                                alt={t(currentItem.titleKey)}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                            {currentItem.price && (
                                <div className="absolute bottom-1.5 left-1.5 bg-neutral-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-semibold">
                                    {currentItem.price}
                                </div>
                            )}
                        </div>

                        {/* Konten & Deskripsi */}
                        <div className="flex flex-col justify-between flex-1 w-full min-w-0 gap-2 text-left">
                            <div>
                                <h3 className="text-sm font-bold text-text-primary leading-snug line-clamp-1">
                                    {t(currentItem.titleKey)}
                                </h3>
                                <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                                    {t(currentItem.descriptionKey)}
                                </p>
                            </div>

                            {/* Tombol Salin Kode Promo */}
                            {currentItem.promoCode && (
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <div className="px-2.5 py-1 bg-surface border border-dashed border-border-subtle rounded-lg text-xs font-mono font-bold text-primary-sage">
                                        {currentItem.promoCode}
                                    </div>
                                    <TijarahButton
                                        tijarahVariant="ghost"
                                        size="sm"
                                        onClick={() => handleCopyCode(currentItem.promoCode!)}
                                        className="text-xs py-1 px-2.5 h-7"
                                    >
                                        {copiedCode === currentItem.promoCode ? t("codeCopied") : t("copyCodeBtn")}
                                    </TijarahButton>
                                </div>
                            )}
                        </div>
                    </div>
                </TijarahCard.Body>

                {/* Carousel Footer & Controls */}
                <TijarahCard.Footer className="pt-2 pb-3 border-t border-border-subtle/50 flex items-center justify-between">
                    {/* Indicator Dots */}
                    <div className="flex items-center gap-1.5">
                        {newsProductsData.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === currentIndex
                                        ? "w-5 bg-primary-sage"
                                        : "w-1.5 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400"
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {/* Navigasi Prev/Next */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={prevSlide}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-muted hover:text-text-primary transition-colors"
                            aria-label="Previous Slide"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={nextSlide}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-muted hover:text-text-primary transition-colors"
                            aria-label="Next Slide"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </TijarahCard.Footer>
            </TijarahCard>
        </div>
    );
};

// Alias for compatibility
export const NewsProduct = NewsProductSection;
export default NewsProductSection;
