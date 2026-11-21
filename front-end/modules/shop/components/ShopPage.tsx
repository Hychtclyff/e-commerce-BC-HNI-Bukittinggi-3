"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, ShieldCheck, ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { ShopCatalogSection } from "./organisms/ShopCatalogSection";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { useCart } from "../hooks/useCart";
import { initialShopProducts, shopApi } from "../api/shop.api";
import { ShopProduct } from "../types/shop.types";
import { useProfile } from "@/modules/profile/hooks/useProfile";
import { formatCurrency } from "@/utils/formatters";
import { Link } from "@/lib/i18n/navigation";

export function ShopPage() {
  const locale = useLocale();
  const isEn = locale === "en";
  const [products, setProducts] = useState<ShopProduct[]>(initialShopProducts);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const productHeroSlides = isEn
    ? [
        {
          pills: ["100% Authentic HNI", "Warehouse Live Stock"],
          line1: "Pure Halal",
          line2Bold: "Herbal Catalog",
          subtitle:
            "Explore daily wellness supplements, pure honey, herbal oils, and halal family essentials directly from BC HNI 3 Bukittinggi.",
        },
        {
          pills: ["Dual Pricing", "Auto TP Points"],
          line1: "Transparent",
          line2Bold: "Agent & Retail Price",
          subtitle:
            "Registered HNI partners automatically unlock Agent Pricing (HA) and instant HSIS TP point tracking on every checkout.",
        },
        {
          pills: ["Fast Fulfillment", "Pickup & Delivery"],
          line1: "Ready For",
          line2Bold: "Same-Day Pickup",
          subtitle:
            "Order online and pick up directly at Jl. Panorama No. 18 or choose regional courier shipping tailored to your destination.",
        },
      ]
    : [
        {
          pills: ["100% Produk Resmi HNI", "Stok Gudang Riil"],
          line1: "Katalog Resmi",
          line2Bold: "Herba Halal Pilihan",
          subtitle:
            "Temukan suplemen herba, madu murni, minyak sinergi, hingga kebutuhan harian halal langsung dari gudang BC HNI 3 Bukittinggi.",
        },
        {
          pills: ["Harga Transparan", "Poin TP Otomatis"],
          line1: "Harga Konsumen &",
          line2Bold: "Harga Agen HNI",
          subtitle:
            "Mitra HNI terdaftar otomatis menikmati Harga Agen (HA) beserta pencatatan Poin TP ke HSIS pada setiap transaksi.",
        },
        {
          pills: ["Ambil di Gerai", "Pengiriman Regional"],
          line1: "Belanja Praktis",
          line2Bold: "Layanan Cepat Gerai",
          subtitle:
            "Pesan online sekarang untuk diambil langsung di Jl. Panorama No. 18 atau dikirim aman ke alamat tujuan Anda.",
        },
      ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % productHeroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [productHeroSlides.length]);

  useEffect(() => {
    let isMounted = true;
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const data = await shopApi.getProducts();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      } catch (err) {
        console.warn("[ShopPage] Gagal memuat produk dari server:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const { hniProfile } = useProfile();
  const isAgent = Boolean(hniProfile && hniProfile.isVerified);

  const { totalCount, getSubtotal, getTotalPoints, addToCart, openCartSheet } = useCart();

  const subtotal = getSubtotal(isAgent);
  const totalPoints = getTotalPoints(isAgent);

  const handleAddToCartWithFeedback = (product: ShopProduct) => {
    addToCart(product, 1);
  };

  const currentSlide = productHeroSlides[activeSlide] || productHeroSlides[0];

  return (
    <div className="flex flex-col gap-0 pb-12">
      {/* 1. Full-Bleed Product Hero Carousel (replaces old rounded-3xl card) */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-6 overflow-hidden min-h-[360px] sm:min-h-[420px] flex flex-col justify-between text-white">
        <img
          src="/images/bc3-storefront.jpg"
          alt="Katalog Produk Herba BC HNI 3 Bukittinggi"
          style={{
            maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
          }}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          style={{
            maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
          }}
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/40"
        />

        <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-between flex-grow">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold tracking-wider uppercase text-white/80">
            <span>TIJARAH • {isEn ? "OFFICIAL HERBAL STORE" : "ETALASE RESMI BC HNI 3"}</span>
            {isAgent ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold text-white text-[11px] font-bold normal-case">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isEn ? "Agent Price" : "Harga Agen"}: {hniProfile?.hniMemberName} ({hniProfile?.hniMemberId})
              </span>
            ) : (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-[11px] font-medium text-white normal-case transition-colors"
              >
                {isEn
                  ? "Consumer Price • Link HNI ID for Agent Price"
                  : "Harga Konsumen • Tautkan ID HNI di Profil untuk Harga Agen"}
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end my-auto py-4">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {currentSlide.pills.map((pill) => (
                  <span
                    key={pill}
                    className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/95"
                  >
                    {pill}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-5xl leading-[1.1] tracking-tight">
                <span className="block font-light text-white/90">{currentSlide.line1}</span>
                <span className="block font-black text-white">{currentSlide.line2Bold}</span>
              </h1>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-md">
                {currentSlide.subtitle}
              </p>
            </div>
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {productHeroSlides.map((_, idx) => (
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

      {/* 2. Cart Bar & Catalog */}
      <div className="py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border-subtle p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-sage/15 text-primary-sage flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-text-primary">
                {isEn
                  ? `Shopping Cart (${totalCount} items)`
                  : `Keranjang Belanja (${totalCount} Barang)`}
              </h3>
              <span className="text-xs text-text-muted">
                Total:{" "}
                <strong className="text-primary-sage font-bold">{formatCurrency(subtotal)}</strong>
                {isAgent && totalPoints > 0 && ` • ${totalPoints} TP`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="outline"
              onClick={openCartSheet}
              className="text-xs font-bold py-2 px-4 rounded-lg"
            >
              {isEn ? "View Cart" : "Buka Keranjang"}
            </TijarahButton>

            {totalCount > 0 && (
              <Link href="/checkout">
                <TijarahButton
                  type="button"
                  size="sm"
                  tijarahVariant="primary"
                  className="text-xs font-bold py-2 px-5 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </TijarahButton>
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-72 rounded-xl border border-border-subtle bg-surface animate-pulse"
              />
            ))}
          </div>
        ) : (
          <ShopCatalogSection
            products={products}
            isAgent={isAgent}
            onAddToCart={handleAddToCartWithFeedback}
          />
        )}
      </div>
    </div>
  );
}

export default ShopPage;
