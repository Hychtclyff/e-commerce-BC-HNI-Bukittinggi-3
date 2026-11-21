"use client";

import React, { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/axios/client";
import { ProductCard } from "@/components/molecules/ProductCard";
import { useProfile } from "@/modules/profile/hooks/useProfile";
import { useCart } from "@/modules/shop/hooks/useCart";
import { initialShopProducts } from "@/modules/shop/api/shop.api";
import { TijarahButton } from "@/components/atom/tijarahButton";

interface HighlightProduct {
  id: string;
  sku?: string;
  name: string;
  category?: string;
  normalPrice: number;
  agentPrice: number;
  tpPoints: number;
  stock: number;
  imageUrl?: string | null;
  description?: string;
  soldCount?: number;
}

export const Products = () => {
  const t = useTranslations("Landing");
  const locale = useLocale();
  const isEn = locale === "en";
  const [highlights, setHighlights] = useState<HighlightProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const { hniProfile } = useProfile();
  const isAgent = Boolean(hniProfile && hniProfile.isVerified);
  const { addToCart } = useCart();

  useEffect(() => {
    let active = true;
    apiClient
      .get<{ data: HighlightProduct[] }>("/products/highlights?limit=10")
      .then((res) => {
        if (active && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setHighlights(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayProducts: HighlightProduct[] =
    highlights.length > 0
      ? highlights
      : loaded
        ? initialShopProducts.slice(0, 6).map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            normalPrice: p.normalPrice,
            agentPrice: p.agentPrice,
            tpPoints: p.tpPoints,
            stock: p.stock,
            imageUrl: p.imageUrl,
            description: p.description,
          }))
        : [];

  const scrollCarousel = (direction: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(300, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: direction === "next" ? step : -step, behavior: "smooth" });
  };

  return (
    <section id="featured-products" className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-sage mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isEn ? "Best-Selling & Core Products" : "Produk Terlaris & Unggulan"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
            {t("featuredSectionTitle")}
          </h2>
          <p className="text-sm text-text-muted mt-1">{t("featuredSectionSubtitle")}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-end">
          <TijarahButton
            type="button"
            tijarahVariant="outline"
            size="sm"
            aria-label={isEn ? "Previous products" : "Produk sebelumnya"}
            onClick={() => scrollCarousel("prev")}
            className="h-9 w-9 p-0 min-w-0 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </TijarahButton>
          <TijarahButton
            type="button"
            tijarahVariant="outline"
            size="sm"
            aria-label={isEn ? "Next products" : "Produk berikutnya"}
            onClick={() => scrollCarousel("next")}
            className="h-9 w-9 p-0 min-w-0 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </TijarahButton>
          <Link
            href="/shop"
            className="ml-2 text-sm text-primary-sage hover:text-primary-dark hover:underline font-semibold whitespace-nowrap"
          >
            {t("viewAll")} &rarr;
          </Link>
        </div>
      </div>

      {!loaded && highlights.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-80 rounded-xl border border-border-subtle bg-surface animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 scrollbar-none"
        >
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="w-[265px] sm:w-[285px] lg:w-[calc(25%-15px)] shrink-0 snap-start"
            >
              <ProductCard
                id={product.id}
                name={product.name}
                category={product.category || "HNI Herbal"}
                agentPrice={Number(product.agentPrice) || 0}
                normalPrice={Number(product.normalPrice) || 0}
                tpPoints={Number(product.tpPoints) || 0}
                stock={Number(product.stock) || 0}
                imageUrl={product.imageUrl || undefined}
                description={product.description}
                isAgent={isAgent}
                onAddToCart={() =>
                  addToCart(
                    {
                      id: product.id,
                      sku: product.sku || product.id,
                      name: product.name,
                      category: product.category || "HNI Herbal",
                      agentPrice: Number(product.agentPrice) || 0,
                      normalPrice: Number(product.normalPrice) || 0,
                      tpPoints: Number(product.tpPoints) || 0,
                      stock: Number(product.stock) || 0,
                      imageUrl: product.imageUrl || undefined,
                    } as any,
                    1
                  )
                }
              />
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-text-muted italic">{t("disclaimer")}</p>
    </section>
  );
};

export default Products;
