"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatCurrency } from "@/utils/formatters";
import { useCartStore } from "@/modules/shop/store/cart.store";
import { ShopProduct } from "@/modules/shop/types/shop.types";
import { Link } from "@/lib/i18n/navigation";

export interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  agentPrice: number;
  normalPrice: number;
  tpPoints: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  isAgent: boolean;
  onAddToCart?: (productId: string) => void;
  isLoading?: boolean;
  isFraction?: boolean;
  isSeparable?: boolean;
  allowAgentPrice?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  category,
  agentPrice,
  normalPrice,
  tpPoints,
  stock,
  imageUrl,
  description,
  isAgent,
  onAddToCart,
  isLoading = false,
  isFraction = false,
  isSeparable = false,
  allowAgentPrice = true,
}) => {
  const t = useTranslations("catalog");
  const effectiveIsAgent = isFraction || allowAgentPrice === false ? false : isAgent;
  const activePrice = effectiveIsAgent ? agentPrice : normalPrice;
  const isOutOfStock = stock <= 0;

  const cartItems = useCartStore((state) => state.cartItems);
  const addToCart = useCartStore((state) => state.addToCart);
  const updateQty = useCartStore((state) => state.updateQty);

  const cartItem = cartItems.find((item) => item.product.id === id);
  const currentQty = cartItem ? cartItem.qty : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(id);
    } else {
      const productObj: ShopProduct = {
        id,
        name,
        category,
        agentPrice,
        normalPrice,
        tpPoints: isFraction ? 0 : tpPoints,
        stock,
        imageUrl,
        description,
        isFraction,
        isSeparable,
        allowAgentPrice,
      };
      addToCart(productObj, 1);
    }
  };

  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentQty < stock) {
      updateQty(id, currentQty + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQty(id, currentQty - 1);
  };

  return (
    <div
      className="group relative flex flex-col justify-between rounded-xl border border-border-subtle bg-surface transition-all duration-300 hover:border-primary-sage/50 shadow-none overflow-hidden"
    >
      {/* 1. Area Media Foto Produk Full-Bleed (Sesuai Referensi) */}
      <Link href={`/products/${id}`} className="block relative w-full aspect-[4/3] bg-canvas overflow-hidden border-b border-border-subtle/40">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImgError(true)}
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-1 bg-canvas">
            <ShoppingBag className="w-10 h-10 stroke-[1.2]" />
            <span className="text-[10px] uppercase font-semibold tracking-wider">HNI Official</span>
          </div>
        )}

        {/* Floating Badge Kiri Atas */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
          {isFraction ? (
            <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs">
              Eceran (0 TP)
            </span>
          ) : (
            <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-surface/90 text-text-primary backdrop-blur-md border border-border-subtle/60 shadow-xs">
              {effectiveIsAgent ? t("agentPriceBadge") : t("normalPriceBadge")}
            </span>
          )}
        </div>

        {/* Floating Badge Poin Kanan Atas */}
        {!isFraction && effectiveIsAgent && tpPoints > 0 && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-accent-gold text-white shadow-xs">
              {tpPoints} {t("tpPointsLabel")}
            </span>
          </div>
        )}
      </Link>

      {/* 2. Area Konten Teks & Tipografi (Sesuai Referensi) */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          {/* Baris 1: Judul di Kiri & Harga di Kanan */}
          <div className="flex items-baseline justify-between gap-2">
            <Link href={`/products/${id}`} className="min-w-0 flex-1">
              <h3 className="font-semibold text-text-primary text-sm sm:text-base leading-snug line-clamp-1 hover:text-primary-sage transition-colors">
                {name}
              </h3>
            </Link>
            <span className="font-bold text-text-primary text-sm sm:text-base tracking-tight shrink-0 text-right">
              {formatCurrency(activePrice)}
            </span>
          </div>

          {/* Baris 2: Deskripsi Singkat Mengalir di Bawah Judul */}
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
            {description || "Produk herbal dan suplemen alami resmi HNI teruji higienis dan bersertifikat halal."}
          </p>
        </div>

        {/* Baris 3: Kategori/Diskon di Kiri & Tombol Aksi Kapsul di Kanan Bawah */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle/40 mt-auto">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider truncate">
              {category}
            </span>
            {effectiveIsAgent && normalPrice > agentPrice && (
              <span className="text-[11px] text-text-muted line-through font-medium">
                {formatCurrency(normalPrice)}
              </span>
            )}
          </div>

          {/* Action CTA: Tombol Kapsul Beli atau Stepper Terpadu */}
          {currentQty > 0 ? (
            <div className="flex items-center bg-canvas border border-border-subtle rounded-full p-0.5 gap-1 h-9">
              <TijarahButton
                type="button"
                tijarahVariant={currentQty === 1 ? "danger" : "soft"}
                isIconOnly
                onClick={handleDecrement}
                className="!w-7 !h-7 !min-w-7 !p-0 rounded-full !bg-surface !text-text-primary hover:!bg-status-danger/10 hover:!text-status-danger !border-border-subtle/80 cursor-pointer shrink-0"
                title={currentQty === 1 ? "Hapus dari keranjang" : "Kurangi"}
                aria-label="Kurangi kuantitas"
              >
                <Minus className="w-3 h-3" />
              </TijarahButton>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentQty}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, "");
                  const parsed = cleaned === "" ? 0 : parseInt(cleaned, 10);
                  const clamped = Math.min(stock, parsed);
                  updateQty(id, clamped);
                }}
                className="w-8 text-center text-xs font-bold text-text-primary bg-transparent focus:outline-none tabular-nums"
                aria-label="Kuantitas produk"
              />

              <TijarahButton
                type="button"
                tijarahVariant="soft"
                isIconOnly
                onClick={handleIncrement}
                isDisabled={currentQty >= stock}
                className="!w-7 !h-7 !min-w-7 !p-0 rounded-full !bg-surface !border-border-subtle/80 !text-text-primary hover:!bg-primary-sage hover:!text-white disabled:opacity-40 cursor-pointer shrink-0"
                title="Tambah"
                aria-label="Tambah kuantitas"
              >
                <Plus className="w-3 h-3" />
              </TijarahButton>

              {/* Button Remove from Cart */}
              <TijarahButton
                type="button"
                tijarahVariant="danger"
                isIconOnly
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQty(id, 0);
                }}
                className="!w-7 !h-7 !min-w-7 !p-0 rounded-full !bg-status-danger/10 !text-status-danger hover:!bg-status-danger hover:!text-white"
                title="Hapus dari keranjang"
                aria-label="Hapus dari keranjang"
              >
                <Trash2 className="w-3 h-3" />
              </TijarahButton>
            </div>
          ) : (
            <TijarahButton
              type="button"
              onClick={handleAdd}
              isDisabled={isOutOfStock || isLoading}
              isLoading={isLoading}
              tijarahVariant={isOutOfStock ? "soft" : "primary"}
              className="rounded-full px-5 py-1.5 h-8 text-xs font-semibold cursor-pointer shadow-none flex items-center gap-1.5 shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? "Habis" : "Beli"}</span>
            </TijarahButton>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProductCard;
