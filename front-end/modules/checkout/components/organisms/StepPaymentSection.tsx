"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PaymentMethodSelector } from "@/modules/shop/components/molecules/PaymentMethodSelector";
import { OrderSummaryCard } from "@/modules/shop/components/molecules/OrderSummaryCard";
import { KasbonPlafonBadge } from "@/components/molecules/KasbonPlafonBadge";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import { useCheckoutContext } from "../../context/CheckoutContext";
import { shopApi } from "@/modules/shop/api/shop.api";
import { VoucherItem } from "@/types/checkout.types";

export const StepPaymentSection: React.FC = () => {
  const t = useTranslations("Checkout");
  const {
    prevStep,
    shippingType,
    paymentMethod,
    setPaymentMethod,
    isAgent,
    subtotal,
    shippingCost,
    discountAmount,
    totalPoints,
    grandTotal,
    selectedVoucher,
    setSelectedVoucher,
    kasbonEligible,
    kasbonAvailableBalance,
    isCalculating,
    processCheckout,
    isSubmitting,
    error,
    setIsItemsSheetOpen,
  } = useCheckoutContext();

  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState<boolean>(true);

  useEffect(() => {
    if (shippingType !== "PICKUP" && paymentMethod === "CASH_STORE") {
      setPaymentMethod("QRIS");
    }
  }, [shippingType, paymentMethod, setPaymentMethod]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingVouchers(true);
    shopApi
      .getVouchers()
      .then((data) => {
        if (isMounted) setVouchers(data || []);
      })
      .catch((err) => {
        console.error("Gagal memuat voucher:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingVouchers(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <TijarahAlert
          tijarahVariant="danger"
          title={t("paymentErrorTitle")}
          description={error}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Payment Methods (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <TijarahCard tijarahVariant="default" className="p-4 sm:p-6 rounded-xl border border-border-subtle">
            <div className="pb-4 border-b border-border-subtle mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-text-primary">
                  {t("paymentCardTitle")}
                </h3>
                {isCalculating && (
                  <span className="flex items-center gap-1.5 text-xs text-primary-sage font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t("paymentCalculating")}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {t("paymentCardDesc")}
              </p>
            </div>

            {/* Plafon Kasbon Indicator: hanya tampil jika sudah terverifikasi / eligible kasbon */}
            {kasbonEligible && (
              <div className="mb-4">
                <KasbonPlafonBadge
                  isEligible={kasbonEligible}
                  availableBalance={kasbonAvailableBalance}
                  totalOrderAmount={grandTotal}
                  dueDateDays={14}
                />
              </div>
            )}

            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              onSelectPaymentMethod={setPaymentMethod}
              isAgent={isAgent}
              kasbonEligible={kasbonEligible}
              creditLimitAvailable={kasbonAvailableBalance}
              shippingType={shippingType}
            />

            <div className="flex items-center justify-between pt-6 border-t border-border-subtle mt-6">
              <TijarahButton
                type="button"
                tijarahVariant="ghost"
                size="sm"
                onClick={prevStep}
                className="text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("paymentBackToShipping")}</span>
              </TijarahButton>
            </div>
          </TijarahCard>
        </div>

        {/* Right Column: Order Summary with Dropdown Voucher (5 Cols) */}
        <div className="lg:col-span-5">
          <OrderSummaryCard
            subtotal={subtotal}
            shippingCost={shippingCost}
            discountAmount={discountAmount}
            totalPoints={totalPoints}
            grandTotal={grandTotal}
            vouchers={vouchers}
            selectedVoucher={selectedVoucher}
            onSelectVoucher={setSelectedVoucher}
            onRemoveVoucher={() => setSelectedVoucher(null)}
            isLoadingVouchers={isLoadingVouchers}
            onExecuteCheckout={processCheckout}
            isSubmitting={isSubmitting}
            isAgent={isAgent}
            shippingType={shippingType}
            paymentMethod={paymentMethod}
            onOpenItemsSheet={() => setIsItemsSheetOpen(true)}
          />
        </div>
      </div>
    </div>
  );
};
export default StepPaymentSection;
