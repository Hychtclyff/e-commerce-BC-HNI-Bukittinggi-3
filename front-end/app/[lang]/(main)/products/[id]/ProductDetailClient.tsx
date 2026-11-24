"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Check,
  Star,
  Trash2,
  Heart,
  BadgeCheck,
} from "lucide-react";
import { ShopProduct } from "@/modules/shop/types/shop.types";
import { shopApi } from "@/modules/shop/api/shop.api";
import { useCartStore } from "@/modules/shop/store/cart.store";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { formatCurrency } from "@/utils/formatters";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { showToast } from "@/utils/toast";

interface IProductDetailClientProps {
  product: ShopProduct;
}

export default function ProductDetailClient({ product }: IProductDetailClientProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAgent = Boolean(user?.isAgent || user?.role === "AGENT" || user?.hniMemberId);

  const cartItems = useCartStore((state) => state.cartItems);
  const addToCart = useCartStore((state) => state.addToCart);
  const updateQty = useCartStore((state) => state.updateQty);
  const openCartSheet = useCartStore((state) => state.openCartSheet);

  const isFraction = Boolean(product.isFraction);
  const effectiveIsAgent = isFraction || product.allowAgentPrice === false ? false : isAgent;

  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const cartQty = cartItem ? cartItem.qty : 0;

  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  // Wishlist, Reviews, and Related Products state
  const [wishlisted, setWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    totalReviews: number;
    reviews: any[];
  }>({ averageRating: 0, totalReviews: 0, reviews: [] });
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadEngagement = useCallback(async () => {
    try {
      const [rev, rel] = await Promise.all([
        shopApi.getProductReviews(product.id),
        shopApi.getRelatedProducts(product.id),
      ]);
      setReviewsData(rev);
      setRelatedProducts(Array.isArray(rel) ? rel : []);
    } catch {
      // Ignore silent fetch errors
    }

    if (user?.id) {
      try {
        const wList = await shopApi.getWishlist();
        if (Array.isArray(wList)) {
          setWishlisted(wList.some((w: any) => w.id === product.id));
        }
      } catch {
        // Ignore
      }
    }
  }, [product.id, user?.id]);

  useEffect(() => {
    loadEngagement();
  }, [loadEngagement]);

  const handleToggleWishlist = async () => {
    if (!user?.id) {
      showToast.error("Login Diperlukan", "Silakan masuk untuk menyimpan produk ke wishlist.");
      router.push("/login");
      return;
    }
    setTogglingWishlist(true);
    try {
      const res = await shopApi.toggleWishlist(product.id);
      setWishlisted(Boolean(res.wishlisted));
      showToast.success(
        res.wishlisted ? "Disimpan ke Wishlist" : "Dihapus dari Wishlist",
        product.name
      );
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Tidak dapat memperbarui wishlist.");
    } finally {
      setTogglingWishlist(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      showToast.error("Login Diperlukan", "Silakan masuk untuk menulis ulasan.");
      return;
    }
    setSubmittingReview(true);
    try {
      await shopApi.createProductReview(product.id, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewComment("");
      showToast.success("Ulasan Terkirim", "Terima kasih atas penilaian Anda.");
      await loadEngagement();
    } catch (err: any) {
      showToast.error("Gagal Mengirim Ulasan", err?.message || "Terjadi kesalahan.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const activePrice = effectiveIsAgent ? product.agentPrice : product.normalPrice;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    router.push("/checkout");
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Breadcrumb & Tombol Kembali */}
      <div className="flex items-center gap-2 mb-6 text-xs text-text-muted">
        <Link href="/products" className="hover:text-primary-sage flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Katalog</span>
        </Link>
        <span>/</span>
        <span className="text-text-primary truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Gambar Produk */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-2xl bg-canvas border border-border-subtle overflow-hidden flex items-center justify-center">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-text-muted gap-2">
                <ShoppingBag className="w-20 h-20 stroke-[1.2]" />
                <span className="text-xs uppercase font-semibold tracking-wider">HNI Official SKU</span>
              </div>
            )}
            <div className="absolute top-4 left-4">
              {isFraction ? (
                <TijarahBadge tijarahVariant="warning" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  Eceran (0 TP)
                </TijarahBadge>
              ) : (
                <TijarahBadge tijarahVariant={effectiveIsAgent ? "success" : "secondary"}>
                  {effectiveIsAgent ? "Harga Mitra Agen" : "Harga Konsumen"}
                </TijarahBadge>
              )}
            </div>
          </div>

          {/* Jaminan Layanan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-border-subtle bg-surface flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-primary-sage shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold text-text-primary">100% Original</p>
                <p className="text-[10px] text-text-muted">Resmi Halal MUI & BPOM</p>
              </div>
            </div>
            <div className="p-3 rounded-xl border border-border-subtle bg-surface flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-primary-sage shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold text-text-primary">Stok Siap Kirim</p>
                <p className="text-[10px] text-text-muted">Gudang BC 3 Bukittinggi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informasi Produk & Form Aksi */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                {product.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary mt-1 tracking-tight">
                {product.name}
              </h1>

              {/* Rating & Sold */}
              <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                {product.rating && (
                  <span className="flex items-center gap-1 font-semibold text-status-warning">
                    <Star className="w-3.5 h-3.5 fill-status-warning text-status-warning" />
                    {product.rating}
                  </span>
                )}
                {product.sold && (
                  <>
                    <span>&bull;</span>
                    <span>{product.sold} terjual</span>
                  </>
                )}
                <span>&bull;</span>
                <span className={product.stock > 0 ? "text-status-success font-medium" : "text-status-danger font-medium"}>
                  {product.stock > 0 ? `Tersedia: ${product.stock} pcs` : "Stok Habis"}
                </span>
              </div>
            </div>

            {/* Kotak Harga & Poin HSIS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-canvas border border-border-subtle flex flex-col gap-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-primary-sage tracking-tight">
                  {formatCurrency(activePrice)}
                </span>
                {effectiveIsAgent && product.normalPrice > product.agentPrice && (
                  <span className="text-sm text-text-muted line-through font-medium">
                    {formatCurrency(product.normalPrice)}
                  </span>
                )}
              </div>

              {!isFraction && effectiveIsAgent && product.tpPoints > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent-gold mt-1">
                  <Sparkles className="w-4 h-4 text-accent-gold" />
                  <span>Dapatkan alokasi {product.tpPoints * quantity} TP HSIS resmi untuk pesanan ini</span>
                </div>
              )}

              {isFraction && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  <span>* Produk kemasan eceran satuan (non-agen & 0 TP)</span>
                </div>
              )}
            </div>

            {/* Deskripsi */}
            <div className="flex flex-col gap-2 pt-2">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                Deskripsi Produk
              </h2>
              <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                {product.description || "Produk herbal dan suplemen alami berkualitas tinggi dari jaringan resmi HNI (Herbal Network International), diproduksi sesuai standar higienis dan kaidah syariah."}
              </p>
            </div>
          </div>

          {/* Kontrol Kuantitas & Pembelian */}
          <div className="mt-8 pt-6 border-t border-border-subtle flex flex-col gap-4">
            {/* Status Keranjang Saat Ini */}
            {cartQty > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary-sage/10 border border-primary-sage/20 text-xs text-primary-sage">
                <span>Sudah ada <strong>{cartQty} item</strong> di keranjang Anda</span>
                <button
                  type="button"
                  onClick={openCartSheet}
                  className="font-bold underline hover:text-primary-dark transition-colors"
                >
                  Lihat Keranjang
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-text-primary">Jumlah Beli:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-border-subtle rounded-xl bg-canvas p-1 h-9">
                  <TijarahButton
                    type="button"
                    tijarahVariant="soft"
                    isIconOnly
                    isDisabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="!w-7 !h-7 !min-w-7 !p-0 rounded-lg !bg-surface !border-border-subtle/80 flex items-center justify-center !text-text-primary hover:!bg-status-danger/10 hover:!text-status-danger transition-colors disabled:opacity-40 cursor-pointer"
                    aria-label="Kurangi jumlah"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </TijarahButton>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, "");
                      const val = cleaned === "" ? 1 : parseInt(cleaned, 10);
                      setQuantity(Math.min(product.stock, Math.max(1, val)));
                    }}
                    onKeyDown={(e) => {
                      if (
                        !/[0-9]/.test(e.key) &&
                        !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className="w-12 text-center text-sm font-bold text-text-primary bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-sage rounded py-0.5 tabular-nums"
                    aria-label="Jumlah beli produk"
                  />
                  <TijarahButton
                    type="button"
                    tijarahVariant="soft"
                    isIconOnly
                    isDisabled={quantity >= product.stock}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="!w-7 !h-7 !min-w-7 !p-0 rounded-lg !bg-surface !border-border-subtle/80 flex items-center justify-center !text-text-primary hover:!bg-primary-sage hover:!text-white transition-colors disabled:opacity-40 cursor-pointer"
                    aria-label="Tambah jumlah"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </TijarahButton>
                </div>

                {cartQty > 0 && (
                  <TijarahButton
                    type="button"
                    tijarahVariant="danger"
                    isIconOnly
                    onClick={() => {
                      updateQty(product.id, 0);
                      setQuantity(1);
                    }}
                    className="!w-9 !h-9 !min-w-9 !p-0 rounded-xl !bg-status-danger/10 !border !border-status-danger/25 flex items-center justify-center !text-status-danger hover:!bg-status-danger hover:!text-white transition-all cursor-pointer shadow-none active:scale-95"
                    title="Reset kuantitas dari keranjang"
                    aria-label="Reset keranjang ke 0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </TijarahButton>
                )}
              </div>
              <span className="text-xs text-text-muted">Maks. {product.stock} pcs</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <TijarahButton
                type="button"
                onClick={handleAddToCart}
                isDisabled={isOutOfStock}
                tijarahVariant="outline"
                className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-primary-sage text-primary-sage hover:bg-primary-sage hover:text-white"
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-status-success" />
                    <span>Ditambahkan!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Masukkan ke Keranjang</span>
                  </>
                )}
              </TijarahButton>

              <TijarahButton
                type="button"
                onClick={handleBuyNow}
                isDisabled={isOutOfStock}
                tijarahVariant="primary"
                className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>Beli Sekarang</span>
              </TijarahButton>

              <TijarahButton
                type="button"
                onClick={handleToggleWishlist}
                isDisabled={togglingWishlist}
                tijarahVariant="outline"
                isIconOnly
                aria-label="Simpan ke Wishlist"
                className={`!w-12 !h-12 shrink-0 rounded-xl flex items-center justify-center border transition-colors ${
                  wishlisted
                    ? "!border-rose-500 !bg-rose-500/10 !text-rose-600"
                    : "!border-border-subtle !text-text-muted hover:!text-rose-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
              </TijarahButton>
            </div>
          </div>
        </div>
      </div>

      {/* Ulasan & Rating Pembeli */}
      <section className="mt-12 pt-10 border-t border-border-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Ulasan & Rating Pembeli</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {reviewsData.totalReviews > 0
                ? `Rata-rata ${reviewsData.averageRating} / 5 dari ${reviewsData.totalReviews} ulasan`
                : "Belum ada ulasan untuk produk ini. Jadilah yang pertama memberi ulasan."}
            </p>
          </div>
          {reviewsData.totalReviews > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-bold text-text-primary">{Number(reviewsData.averageRating || 0).toFixed(1)}</span>
              <span className="text-xs text-text-muted">/ 5.0</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Ulasan */}
          <form
            onSubmit={handleSubmitReview}
            className="lg:col-span-4 rounded-2xl border border-border-subtle bg-surface p-5 space-y-4 h-fit"
          >
            <h3 className="text-sm font-bold text-text-primary">Tulis Ulasan Anda</h3>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                  aria-label={`Beri ${star} bintang`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= reviewRating ? "fill-amber-500 text-amber-500" : "text-border-subtle"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Bagikan pengalaman Anda menggunakan produk ini..."
              className="w-full rounded-xl border border-border-subtle bg-canvas px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary-sage focus:outline-none"
            />
            <TijarahButton
              type="submit"
              tijarahVariant="primary"
              isLoading={submittingReview}
              className="w-full py-2.5 text-xs font-bold rounded-xl"
            >
              Kirim Ulasan
            </TijarahButton>
          </form>

          {/* Daftar Ulasan */}
          <div className="lg:col-span-8 space-y-3">
            {reviewsData.reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-subtle bg-canvas/50 p-8 text-center text-xs text-text-muted">
                Belum ada ulasan pembeli.
              </div>
            ) : (
              reviewsData.reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-border-subtle bg-surface p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">{rev.userName}</span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                          <BadgeCheck className="w-3 h-3" /> Pembeli Terverifikasi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Number(rev.rating) ? "fill-amber-500 text-amber-500" : "text-border-subtle"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-text-muted leading-relaxed">{rev.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Produk Terkait */}
      {relatedProducts.length > 0 && (
        <section className="mt-12 pt-10 border-t border-border-subtle space-y-5">
          <h2 className="text-xl font-bold text-text-primary">Produk Terkait Lainnya</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedProducts.map((rel: any) => (
              <Link
                key={rel.id}
                href={`/products/${rel.id}`}
                className="group rounded-2xl border border-border-subtle bg-surface p-3 hover:border-primary-sage transition-all flex flex-col gap-2"
              >
                <div className="aspect-square rounded-xl bg-canvas overflow-hidden flex items-center justify-center">
                  {rel.imageUrl ? (
                    <img
                      src={rel.imageUrl}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-text-muted/40" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-primary line-clamp-2 group-hover:text-primary-sage">
                    {rel.name}
                  </p>
                  <p className="text-xs font-bold text-primary-sage font-mono">
                    {formatCurrency(Number(effectiveIsAgent && rel.allowAgentPrice !== false ? rel.agentPrice : (rel.normalPrice ?? rel.regularPrice ?? 0)))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
