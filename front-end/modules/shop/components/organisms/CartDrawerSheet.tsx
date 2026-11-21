"use client";

import React from "react";
import { ShoppingBag, ArrowRight, Trash2, Sparkles, ShoppingCart } from "lucide-react";
import { TijarahSheet } from "@/components/atom/tijarahSheet";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { CartItemRow } from "../molecules/CartItemRow";
import { useCart } from "../../hooks/useCart";
import { useProfile } from "@/modules/profile/hooks/useProfile";
import { formatCurrency } from "@/utils/formatters";
import { Link, useRouter } from "@/lib/i18n/navigation";

export interface CartDrawerSheetProps {
  // Opsional jika ingin override state lokal, jika tidak diberikan akan memakai store global
  isOpen?: boolean;
  onClose?: () => void;
}

export const CartDrawerSheet: React.FC<CartDrawerSheetProps> = ({
  isOpen: customIsOpen,
  onClose: customOnClose,
}) => {
  const router = useRouter();
  const {
    cartItems,
    isCartSheetOpen,
    closeCartSheet,
    updateQty,
    removeFromCart,
    clearCart,
    totalCount,
    getSubtotal,
    getTotalPoints,
  } = useCart();

  const { hniProfile } = useProfile();
  const isAgent = Boolean(hniProfile && hniProfile.isVerified);

  const activeIsOpen = customIsOpen !== undefined ? customIsOpen : isCartSheetOpen;
  const handleClose = customOnClose || closeCartSheet;

  const subtotal = getSubtotal(isAgent);
  const totalPoints = getTotalPoints(isAgent);

  const handleGoToCheckout = () => {
    handleClose();
    router.push("/checkout");
  };

  const handleGoToShop = () => {
    handleClose();
    router.push("/shop");
  };

  return (
    <TijarahSheet
      isOpen={activeIsOpen}
      onClose={handleClose}
      side="right"
      size="md"
      title={
        <div className="flex items-center gap-2">
          <span>Keranjang Belanja</span>
          {totalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-sage/15 text-primary-sage">
              {totalCount} item
            </span>
          )}
        </div>
      }
      description={
        isAgent
          ? `Harga Mitra Agen Aktif (${hniProfile?.hniMemberName})`
          : "Harga Konsumen • Hubungkan ID HNI di Profil untuk Harga Agen"
      }
      icon={<ShoppingBag className="w-5 h-5" />}
      footer={
        cartItems.length > 0 ? (
          <div className="space-y-4">
            {/* Calculation summary */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-text-muted">
                <span>Total Barang</span>
                <span className="font-semibold text-text-primary">{totalCount} pcs</span>
              </div>

              {isAgent && totalPoints > 0 && (
                <div className="flex items-center justify-between text-accent-gold font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Total Poin TP
                  </span>
                  <span>{totalPoints} TP</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-sm">
                <span className="font-extrabold text-text-primary">Subtotal</span>
                <span className="text-base font-black text-primary-sage">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2">
              <TijarahButton
                type="button"
                tijarahVariant="primary"
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold shadow-md shadow-primary-sage/20"
                onClick={handleGoToCheckout}
              >
                <span>Lanjut ke Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </TijarahButton>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors text-center cursor-pointer"
              >
                Lanjutkan Belanja
              </button>
            </div>
          </div>
        ) : null
      }
    >
      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-canvas border border-border-subtle flex items-center justify-center mb-4 text-text-muted shadow-xs">
            <ShoppingCart className="w-10 h-10 opacity-40 text-primary-sage" />
          </div>
          <h4 className="text-base font-bold text-text-primary">
            Keranjang Belanja Masih Kosong
          </h4>
          <p className="text-xs text-text-muted mt-2 max-w-xs leading-relaxed">
            Anda belum memilih produk. Jelajahi aneka produk herba halal dan kebutuhan harian di katalog kami.
          </p>
          <TijarahButton
            type="button"
            tijarahVariant="outline"
            className="mt-6 flex items-center gap-2 text-xs font-bold"
            onClick={handleGoToShop}
          >
            <span>Mulai Belanja di Katalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </TijarahButton>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header Action */}
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60 text-xs">
            <span className="font-semibold text-text-muted">Daftar Produk Pilihan</span>
            <button
              type="button"
              onClick={clearCart}
              className="flex items-center gap-1 text-[11px] font-bold text-status-danger hover:underline cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Kosongkan Keranjang
            </button>
          </div>

          {/* List items */}
          <div className="divide-y divide-border-subtle/50">
            {cartItems.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                isAgent={isAgent}
                onUpdateQty={updateQty}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          {/* Membership note */}
          {!isAgent && (
            <div className="p-3 rounded-2xl bg-canvas border border-border-subtle text-[11px] text-text-muted mt-4">
              💡 <strong>Ingin harga lebih hemat?</strong> Sambungkan ID Member HNI Anda di{" "}
              <Link href="/profile" onClick={handleClose} className="text-primary-sage font-bold underline">
                halaman profil
              </Link>{" "}
              untuk langsung mendapatkan potongan Harga Agen & perolehan Poin TP.
            </div>
          )}
        </div>
      )}
    </TijarahSheet>
  );
};
