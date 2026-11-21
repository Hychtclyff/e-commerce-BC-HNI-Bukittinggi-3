"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const locale = useLocale();
  const isEn = locale === "en";
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = isEn
    ? [
        {
          pills: ["Official BC HNI 3", "Trusted Herbal Care"],
          line1: "Empowering",
          line2Bold: "Natural Health",
          line3: "Inspiring",
          line3Bold: "Trust",
          subtitle:
            "Authentic halal herbal solutions directly from Business Center HNI 3 Bukittinggi—transparent Consumer & Agent pricing with automatic HSIS point recording.",
          ctaLabel: "See Our Products",
          ctaHref: "/shop",
        },
        {
          pills: ["Halal Certified", "Real-Time Stock"],
          line1: "Authentic",
          line2Bold: "Herbal Quality",
          line3: "For Every",
          line3Bold: "Family",
          subtitle:
            "Every product is sourced directly from our Bukittinggi warehouse with guaranteed seal integrity, clear expiry tracking, and instant digital receipts.",
          ctaLabel: "Browse Catalog",
          ctaHref: "/shop",
        },
        {
          pills: ["Bukittinggi Hub", "Partner Ecosystem"],
          line1: "Seamless",
          line2Bold: "Partner Network",
          line3: "Built For",
          line3Bold: "Growth",
          subtitle:
            "Connecting HNI agents and retail customers with fast counter pickup, regional courier delivery, and transparent TP point tracking.",
          ctaLabel: "About BC 3",
          ctaHref: "/about",
        },
      ]
    : [
        {
          pills: ["Produk Halal Resmi", "Layanan Terpercaya"],
          line1: "Menghadirkan",
          line2Bold: "Herba Alami",
          line3: "Membangun",
          line3Bold: "Kepercayaan",
          subtitle:
            "Solusi herba halal resmi langsung dari Business Center HNI 3 Bukittinggi—harga Konsumen & Agen transparan dengan pencatatan Poin TP HSIS otomatis.",
          ctaLabel: "Lihat Produk Kami",
          ctaHref: "/shop",
        },
        {
          pills: ["Sertifikasi Halal", "Stok Gudang Riil"],
          line1: "Kualitas",
          line2Bold: "Terjaga Resmi",
          line3: "Untuk Setiap",
          line3Bold: "Keluarga",
          subtitle:
            "Seluruh produk bersumber langsung dari gudang BC 3 Bukittinggi dengan jaminan keaslian segel dan nota digital terverifikasi.",
          ctaLabel: "Belanja Sekarang",
          ctaHref: "/shop",
        },
        {
          pills: ["Gerai Bukittinggi", "Ekosistem Mitra"],
          line1: "Sinergi",
          line2Bold: "Mitra & Agen",
          line3: "Tumbuh Lebih",
          line3Bold: "Berkah",
          subtitle:
            "Menghubungkan agen HNI dan pelanggan retail dengan layanan ambil di gerai maupun pengiriman ekspedisi regional yang cepat.",
          ctaLabel: "Tentang BC 3",
          ctaHref: "/about",
        },
      ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[activeSlide] || slides[0];

  return (
    <section
      id="hero"
      className="relative w-screen left-1/2 -translate-x-1/2 -mt-6 overflow-hidden min-h-[540px] sm:min-h-[620px] lg:min-h-[680px] flex flex-col justify-between text-white"
    >
      {/* Full-bleed background photo with subtle 10% bottom feather */}
      <img
        src="/images/bc3-storefront.jpg"
        alt="Business Center HNI 3 Bukittinggi"
        style={{
          maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
        }}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 scale-[1.02]"
      />

      {/* Editorial dark scrim matching photo feather */}
      <div
        style={{
          maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
        }}
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/35"
      />

      <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10 lg:py-12 flex flex-col justify-between flex-grow">

      {/* Top Spacer / Brand Eyebrow */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-white/80">
        <span>TIJARAH • BC HNI 3 BUKITTINGGI</span>
        <span className="hidden sm:inline">Jl. Panorama No. 18, Bukittinggi</span>
      </div>

      {/* Main Split Editorial Content (Pharmik-inspired) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end my-auto py-6">
        {/* Left: Pills + Large Light/Bold Headline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {current.pills.map((pill) => (
              <span
                key={pill}
                className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/95"
              >
                {pill}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[54px] leading-[1.08] tracking-tight">
            <span className="block font-light text-white/90">{current.line1}</span>
            <span className="block font-black text-white">{current.line2Bold}</span>
            <span className="block font-light text-white/90">
              {current.line3}{" "}
              <strong className="font-black text-white">{current.line3Bold}</strong>
            </span>
          </h1>
        </div>

        {/* Right: Concise Description + Single Crisp CTA */}
        <div className="lg:col-span-5 space-y-4 lg:pb-1">
          <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-md">
            {current.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={current.ctaHref}>
              <TijarahButton
                tijarahVariant="primary"
                size="md"
                className="rounded-xl px-5 h-10 text-xs sm:text-sm font-bold shadow-md flex items-center gap-2"
              >
                <span>{current.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </TijarahButton>
            </Link>

            <Link
              href="/contact"
              className="px-4 h-10 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs sm:text-sm font-semibold text-white inline-flex items-center transition-colors"
            >
              {isEn ? "Contact Us" : "Hubungi Kami"}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Slide Indicator Pills */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 pt-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Slide ${idx + 1}`}
            onClick={() => setActiveSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === activeSlide ? "w-7 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
      </div>
    </section>
  );
}

export default HeroSection;
