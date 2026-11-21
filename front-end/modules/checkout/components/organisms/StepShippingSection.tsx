"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ShoppingBag, ArrowLeft, AlertCircle } from "lucide-react";
import { ShippingMethodSelector } from "@/modules/shop/components/molecules/ShippingMethodSelector";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { useCheckoutContext } from "../../context/CheckoutContext";
import { Link } from "@/lib/i18n/navigation";
import { formatCurrency } from "@/utils/formatters";

export const StepShippingSection: React.FC = () => {
  const t = useTranslations("Checkout");
  const {
    shippingType,
    setShippingType,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    customAddressText,
    setCustomAddressText,
    courier,
    setCourier,
    notes,
    setNotes,
    nextStep,
    totalCount,
    subtotal,
    setIsItemsSheetOpen,
    deliveryMethods,
    isShippingValid,
    isCustomAddressRequired,
    shippingValidationError,
  } = useCheckoutContext();

  const courierOptions = deliveryMethods.map((m) => ({
    id: m.code,
    name: m.name,
    desc: m.description,
    cost: m.baseCost,
    etd: m.estimatedTime,
  }));

  const canProceed = totalCount > 0 && isShippingValid;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Review Items Strip (flat, no extra card) */}
      <div className="py-3 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-4 h-4 text-primary-sage shrink-0" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-text-primary">
              {t("shippingBannerTitle", { count: totalCount })}
            </span>
            <span className="text-text-muted ml-2">
              {t("shippingBannerSubtotal")}{" "}
              <strong className="text-primary-sage font-bold">{formatCurrency(subtotal)}</strong>
            </span>
          </div>
        </div>

        <TijarahButton
          type="button"
          size="sm"
          tijarahVariant="outline"
          onClick={() => setIsItemsSheetOpen(true)}
          className="text-xs font-semibold py-1.5 px-4 w-full sm:w-auto rounded-lg"
        >
          {t("shippingViewItemsBtn")}
        </TijarahButton>
      </div>

      {/* 2. Shipping Options Card */}
      <TijarahCard tijarahVariant="default" className="p-4 sm:p-6 rounded-xl border border-border-subtle">
        <div className="pb-4 border-b border-border-subtle mb-4">
          <h3 className="text-base font-bold text-text-primary">
            {t("shippingCardTitle")}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {t("shippingCardDesc")}
          </p>
        </div>

        <ShippingMethodSelector
          shippingType={shippingType}
          onSelectShippingType={setShippingType}
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelectAddressId={setSelectedAddressId}
          customAddressText={customAddressText}
          onChangeCustomAddress={setCustomAddressText}
          courier={courier}
          onSelectCourier={setCourier}
          notes={notes}
          onChangeNotes={setNotes}
          courierOptions={courierOptions}
          isCustomAddressRequired={isCustomAddressRequired}
        />

        {/* Inline Validation Feedback */}
        {shippingValidationError && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 flex items-start gap-2.5 text-xs text-text-primary"
          >
            <AlertCircle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
            <span className="font-medium">{shippingValidationError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between pt-5 border-t border-border-subtle mt-5 gap-3">
          <Link href="/shop" className="w-full sm:w-auto">
            <TijarahButton
              type="button"
              tijarahVariant="ghost"
              size="sm"
              className="w-full sm:w-auto text-xs font-semibold flex items-center justify-center gap-1.5 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("shippingBackToShop")}</span>
            </TijarahButton>
          </Link>

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            onClick={nextStep}
            isDisabled={!canProceed}
            className="w-full sm:w-auto font-bold text-xs sm:text-sm py-2.5 px-6 flex items-center justify-center gap-2 rounded-lg"
          >
            <span>{t("shippingNextToPayment")}</span>
            <ArrowRight className="w-4 h-4" />
          </TijarahButton>
        </div>
      </TijarahCard>
    </div>
  );
};
export default StepShippingSection;
