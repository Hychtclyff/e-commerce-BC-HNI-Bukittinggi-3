"use client";

import React, { useState } from "react";
import { Ticket, Award, CheckCircle2, ArrowRight, Loader2, ShoppingBag, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { formatCurrency } from "@/utils/formatters";
import { getVoucherViolationReason } from "@/utils/voucherEligibility";
import { VoucherItem } from "../../types/shop.types";

export interface OrderSummaryCardProps {
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalPoints: number;
  grandTotal: number;
  selectedVoucher: VoucherItem | null;
  onOpenVoucherModal?: () => void;
  onRemoveVoucher: () => void;
  onExecuteCheckout: () => void;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  isAgent: boolean;
  vouchers?: VoucherItem[];
  onSelectVoucher?: (voucher: VoucherItem | null) => void;
  isLoadingVouchers?: boolean;
  shippingType?: string;
  paymentMethod?: string;
  onOpenItemsSheet?: () => void;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  subtotal,
  shippingCost,
  discountAmount,
  totalPoints,
  grandTotal,
  selectedVoucher,
  onOpenVoucherModal,
  onRemoveVoucher,
  onExecuteCheckout,
  isSubmitting = false,
  isDisabled = false,
  isAgent,
  vouchers = [],
  onSelectVoucher,
  isLoadingVouchers = false,
  shippingType,
  paymentMethod,
  onOpenItemsSheet,
}) => {
  const [agreeNoCancelReturn, setAgreeNoCancelReturn] = useState(false);
  const hasDropdown = typeof onSelectVoucher === "function";

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border-subtle bg-surface mac-shadow lg:sticky lg:top-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <h3 className="text-base font-extrabold text-text-primary">
          Ringkasan Pembayaran
        </h3>
        <div className="flex items-center gap-2">
          {onOpenItemsSheet && (
            <button
              type="button"
              onClick={onOpenItemsSheet}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-sage hover:underline cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ubah Qty (+/-)</span>
            </button>
          )}
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-text-muted hover:text-primary-sage"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tambah Produk</span>
          </Link>
        </div>
      </div>

      {/* Voucher Selector: TijarahSelect (Preferred) or Fallback Modal Trigger */}
      {hasDropdown ? (
        <div className="bg-canvas p-3.5 rounded-xl border border-border-subtle flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <Ticket className="w-4 h-4 text-accent-gold shrink-0" />
              <span>Pilih Diskon / Voucher Promo</span>
            </label>
            {isLoadingVouchers ? (
              <span className="flex items-center gap-1 text-[11px] text-primary-sage font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Memuat...
              </span>
            ) : selectedVoucher ? (
              <button
                type="button"
                onClick={onRemoveVoucher}
                className="text-[11px] font-semibold text-status-danger hover:underline cursor-pointer"
              >
                Hapus
              </button>
            ) : null}
          </div>

          <TijarahSelect
            aria-label="Pilih Diskon / Voucher Promo"
            selectedKey={selectedVoucher?.code || "NONE"}
            onSelectionChange={(keys) => {
              let code = "";
              if (typeof keys === "string" || typeof keys === "number") {
                code = String(keys);
              } else if (keys && typeof keys === "object") {
                const first = Array.from(keys)[0];
                if (first) code = String(first);
              }
              if (!code || code === "NONE") {
                onRemoveVoucher();
              } else {
                const found = vouchers.find((v) => v.code === code);
                if (found && onSelectVoucher) {
                  onSelectVoucher(found);
                }
              }
            }}
            placeholder={
              isLoadingVouchers
                ? "Memuat voucher dari database..."
                : vouchers.length === 0
                ? "Tidak ada voucher diskon tersedia"
                : "-- Pilih Diskon / Voucher Promo --"
            }
            isDisabled={isLoadingVouchers || vouchers.length === 0}
            className="w-full text-xs font-semibold"
          >
            <TijarahSelect.Item id="NONE" key="NONE" textValue="Tanpa Voucher / Diskon">
              <div className="flex items-center justify-between w-full py-1">
                <span className="text-xs font-semibold text-text-muted">
                  -- Tanpa Diskon / Voucher --
                </span>
              </div>
            </TijarahSelect.Item>
            {vouchers.map((v) => {
              const violationReason = getVoucherViolationReason(v as any, {
                subtotal,
                shippingType,
                paymentMethod,
              });
              const isEligible = !violationReason;
              const minText = `Min. ${formatCurrency(v.minPurchase)}`;
              const discountDesc =
                v.discountType === "FIXED"
                  ? `Potongan ${formatCurrency(v.discountValue)}`
                  : v.discountType === "PERCENTAGE"
                  ? `Diskon ${v.discountValue}%${v.maxDiscount ? ` (Maks. ${formatCurrency(v.maxDiscount)})` : ""}`
                  : `Subsidi Ongkir ${formatCurrency(v.discountValue)}`;

              return (
                <TijarahSelect.Item
                  id={v.code}
                  key={v.code}
                  textValue={`${v.code} - ${discountDesc}`}
                  isDisabled={!isEligible}
                >
                  <div className={`flex flex-col gap-0.5 py-1 w-full text-left ${!isEligible ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-primary-sage">
                        {v.code}
                      </span>
                      <span className="text-[11px] font-semibold text-status-success">
                        {discountDesc}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-muted gap-2">
                      <span className="truncate max-w-[180px]">{v.title}</span>
                      <span
                        className={
                          isEligible
                            ? "text-text-muted shrink-0"
                            : "text-status-danger font-semibold shrink-0"
                        }
                      >
                        {isEligible ? minText : violationReason}
                      </span>
                    </div>
                  </div>
                </TijarahSelect.Item>
              );
            })}
          </TijarahSelect>

          {/* Detail Informasi Voucher Terpilih */}
          {selectedVoucher && (
            <div className="p-2.5 rounded-xl bg-primary-sage/10 border border-primary-sage/25 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-primary-sage">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span className="font-mono tracking-wide">{selectedVoucher.code}</span>
                </div>
                <span className="text-[11px] font-extrabold text-status-success">
                  Hemat {formatCurrency(discountAmount)}
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-tight">
                {selectedVoucher.title || selectedVoucher.description}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Fallback Trigger Modal jika onSelectVoucher tidak dipassing */
        <div className="bg-canvas p-3 rounded-2xl border border-border-subtle flex items-center justify-between gap-3">
          {selectedVoucher ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <Ticket className="w-4 h-4 text-primary-sage shrink-0" />
                <div className="min-w-0">
                  <span className="font-mono text-xs font-bold text-primary-sage block">
                    {selectedVoucher.code}
                  </span>
                  <span className="text-[10px] text-status-success font-semibold">
                    Hemat {formatCurrency(discountAmount)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveVoucher}
                className="text-[11px] font-bold text-status-danger hover:underline cursor-pointer"
              >
                Hapus
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenVoucherModal}
              className="flex items-center justify-between w-full text-left text-xs font-semibold text-text-primary hover:text-primary-sage transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-accent-gold" />
                <span>Gunakan Voucher Promo / Subsidi</span>
              </span>
              <span className="text-primary-sage font-bold">Pilih ›</span>
            </button>
          )}
        </div>
      )}

      {/* Price Lines Breakdown */}
      <div className="flex flex-col gap-2.5 text-xs">
        <div className="flex justify-between text-text-muted">
          <span>Subtotal Produk</span>
          <span className="font-medium text-text-primary">
            {formatCurrency(subtotal)}
          </span>
        </div>

        <div className="flex justify-between text-text-muted">
          <span>Biaya Ongkos Kirim</span>
          <span className="font-medium text-text-primary">
            {shippingCost > 0 ? formatCurrency(shippingCost) : "Gratis (Rp 0)"}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-status-success font-semibold">
            <span>Diskon Voucher</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        {isAgent && totalPoints > 0 && (
          <div className="flex justify-between text-accent-gold font-bold pt-1">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Total Perolehan Poin
            </span>
            <span>{totalPoints} TP</span>
          </div>
        )}
      </div>

      {/* Grand Total & CTA */}
      <div className="pt-3 border-t border-border-subtle flex flex-col gap-3">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-xs text-text-muted font-medium block">
              Total Pembayaran
            </span>
            <span className="text-xs text-primary-sage font-semibold">
              (Termasuk PPN & Ongkir)
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-primary-sage">
            {formatCurrency(grandTotal)}
          </span>
        </div>

        <label className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-text-primary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreeNoCancelReturn}
            onChange={(e) => setAgreeNoCancelReturn(e.target.checked)}
            className="mt-0.5 accent-primary-sage shrink-0"
          />
          <span className="leading-relaxed">
            Saya memahami bahwa pesanan yang sudah dibuat <strong>tidak dapat dibatalkan maupun diretur</strong> (kebijakan transaksi final sementara).
          </span>
        </label>

        <TijarahButton
          id="checkout-submit-btn"
          type="button"
          onClick={onExecuteCheckout}
          isLoading={isSubmitting}
          isDisabled={isDisabled || subtotal <= 0 || !agreeNoCancelReturn}
          tijarahVariant="primary"
          className="w-full font-bold py-3 text-sm shadow-md flex items-center justify-center gap-2"
        >
          <span>Konfirmasi & Buat Pesanan</span>
          <ArrowRight className="w-4 h-4" />
        </TijarahButton>
      </div>
    </div>
  );
};
export default OrderSummaryCard;
