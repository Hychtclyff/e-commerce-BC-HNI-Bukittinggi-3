"use client";

import React from "react";
import { ShoppingBag, ArrowLeft, Trash2, ShieldAlert } from "lucide-react";
import { CartItemRow } from "../molecules/CartItemRow";
import { ShippingMethodSelector } from "../molecules/ShippingMethodSelector";
import { PaymentMethodSelector } from "../molecules/PaymentMethodSelector";
import { OrderSummaryCard } from "../molecules/OrderSummaryCard";
import { CartItem, ShippingType, PaymentMethodType, VoucherItem } from "../../types/shop.types";
import { AddressData } from "@/modules/profile/types/profile.types";
import { TijarahAlert } from "@/components/atom/tijarahAlert";

export interface CheckoutDrawerOrPanelProps {
  cartItems: CartItem[];
  isAgent: boolean;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  // Shipping Props
  shippingType: ShippingType;
  onSelectShippingType: (type: ShippingType) => void;
  addresses: AddressData[];
  selectedAddressId: string;
  onSelectAddressId: (id: string) => void;
  customAddressText: string;
  onChangeCustomAddress: (text: string) => void;
  courier: string;
  onSelectCourier: (courier: string) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  // Payment Props
  paymentMethod: PaymentMethodType;
  onSelectPaymentMethod: (method: PaymentMethodType) => void;
  // Summary & Checkout Props
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalPoints: number;
  grandTotal: number;
  selectedVoucher: VoucherItem | null;
  onOpenVoucherModal: () => void;
  onRemoveVoucher: () => void;
  onExecuteCheckout: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export const CheckoutDrawerOrPanel: React.FC<CheckoutDrawerOrPanelProps> = ({
  cartItems,
  isAgent,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  shippingType,
  onSelectShippingType,
  addresses,
  selectedAddressId,
  onSelectAddressId,
  customAddressText,
  onChangeCustomAddress,
  courier,
  onSelectCourier,
  notes,
  onChangeNotes,
  paymentMethod,
  onSelectPaymentMethod,
  subtotal,
  shippingCost,
  discountAmount,
  totalPoints,
  grandTotal,
  selectedVoucher,
  onOpenVoucherModal,
  onRemoveVoucher,
  onExecuteCheckout,
  isSubmitting,
  error,
}) => {
  if (cartItems.length === 0) {
    return (
      <div className="p-8 rounded-3xl border border-dashed border-border-subtle bg-surface text-center flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-3xl bg-primary-sage/10 text-primary-sage flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-text-primary">
          Keranjang Belanja Masih Kosong
        </h3>
        <p className="text-xs text-text-muted max-w-xs leading-relaxed">
          Pilih produk herbal HNI dari katalog di samping untuk memulai pemesanan dan checkout belanja.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <TijarahAlert
          tijarahVariant="danger"
          title="Gagal Checkout"
          description={error}
        />
      )}

      {/* 1. Cart Items List Card */}
      <div className="p-5 rounded-3xl border border-border-subtle bg-surface shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-1">
          <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary-sage" />
            <span>Keranjang ({cartItems.length} Produk)</span>
          </h3>

          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] font-semibold text-text-muted hover:text-status-danger flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        </div>

        <div className="flex flex-col divide-y divide-border-subtle/50">
          {cartItems.map((item) => (
            <CartItemRow
              key={item.product.id}
              item={item}
              isAgent={isAgent}
              onUpdateQty={onUpdateQty}
              onRemove={onRemoveItem}
            />
          ))}
        </div>
      </div>

      {/* 2. Shipping Options Card */}
      <div className="p-5 rounded-3xl border border-border-subtle bg-surface shadow-sm">
        <ShippingMethodSelector
          shippingType={shippingType}
          onSelectShippingType={onSelectShippingType}
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelectAddressId={onSelectAddressId}
          customAddressText={customAddressText}
          onChangeCustomAddress={onChangeCustomAddress}
          courier={courier}
          onSelectCourier={onSelectCourier}
          notes={notes}
          onChangeNotes={onChangeNotes}
        />
      </div>

      {/* 3. Payment Method Card */}
      <div className="p-5 rounded-3xl border border-border-subtle bg-surface shadow-sm">
        <PaymentMethodSelector
          paymentMethod={paymentMethod}
          onSelectPaymentMethod={onSelectPaymentMethod}
          isAgent={isAgent}
        />
      </div>

      {/* 4. Order Summary Card */}
      <OrderSummaryCard
        subtotal={subtotal}
        shippingCost={shippingCost}
        discountAmount={discountAmount}
        totalPoints={totalPoints}
        grandTotal={grandTotal}
        selectedVoucher={selectedVoucher}
        onOpenVoucherModal={onOpenVoucherModal}
        onRemoveVoucher={onRemoveVoucher}
        onExecuteCheckout={onExecuteCheckout}
        isSubmitting={isSubmitting}
        isAgent={isAgent}
      />
    </div>
  );
};
export default CheckoutDrawerOrPanel;
