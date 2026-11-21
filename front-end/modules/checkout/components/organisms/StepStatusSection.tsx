"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag, User, CheckCircle2 } from "lucide-react";
import { CheckoutReceiptCard } from "@/components/molecules/CheckoutReceiptCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { useCheckoutContext } from "../../context/CheckoutContext";
import { Link } from "@/lib/i18n/navigation";

import { PaymentDetailCard } from "../molecules/PaymentDetailCard";

export const StepStatusSection: React.FC = () => {
  const t = useTranslations("Checkout");
  const {
    orderReceipt,
    syncPaymentStatus,
    isSyncingPayment,
    isAutoChecking,
    resetCheckout,
  } = useCheckoutContext();

  if (!orderReceipt) {
    return (
      <div className="py-16 text-center text-xs text-text-muted">
        {t("statusNoActiveOrder")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-4xl mx-auto">
      {/* 1. Payment Detail Card (Virtual Account / QRIS / E-Wallet / Kasbon / Manual Bank) */}
      <PaymentDetailCard
        receipt={orderReceipt}
        onSyncStatus={syncPaymentStatus}
        isSyncing={isSyncingPayment}
        isAutoChecking={isAutoChecking}
      />

      {orderReceipt.paymentStatus === "PAID" && (
        <div className="p-4 rounded-2xl border border-status-success/30 bg-status-success/10 flex items-center gap-3 text-status-success">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="text-xs font-semibold">
            {t("statusPaidBanner", { orderNumber: orderReceipt.orderNumber })}
          </div>
        </div>
      )}

      {/* 2. Unified Official Purchase Receipt & Lifecycle Status Card */}
      <div className="w-full">
        <CheckoutReceiptCard receipt={orderReceipt} />
      </div>

      {/* 3. Post-Order Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 border-t border-border-subtle print:hidden">
        <Link href="/shop" onClick={resetCheckout} className="w-full sm:w-auto">
          <TijarahButton
            type="button"
            tijarahVariant="primary"
            className="w-full sm:w-auto font-bold py-2.5 px-6 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t("statusShopAgain")}</span>
          </TijarahButton>
        </Link>

        <Link href="/profile" className="w-full sm:w-auto">
          <TijarahButton
            type="button"
            tijarahVariant="outline"
            className="w-full sm:w-auto font-bold py-2.5 px-6 flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>{t("statusViewProfileOrders")}</span>
          </TijarahButton>
        </Link>
      </div>
    </div>
  );
};
export default StepStatusSection;
