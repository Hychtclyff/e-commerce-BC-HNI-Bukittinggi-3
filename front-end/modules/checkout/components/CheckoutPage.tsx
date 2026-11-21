"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CheckoutProvider, useCheckoutContext } from "../context/CheckoutContext";
import { CheckoutBreadcrumb } from "./molecules/CheckoutBreadcrumb";
import { CheckoutItemsPreviewSheet } from "./molecules/CheckoutItemsPreviewSheet";
import { StepShippingSection } from "./organisms/StepShippingSection";
import { StepPaymentSection } from "./organisms/StepPaymentSection";
import { StepStatusSection } from "./organisms/StepStatusSection";

function CheckoutContent() {
  const t = useTranslations("Checkout");
  const { step, setStep, orderReceipt } = useCheckoutContext();

  return (
    <div className="w-full min-h-screen py-5 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6">
      {/* 1. Editorial Header with Stepper (no card wrapper) */}
      <div className="pb-4 border-b border-border-subtle flex flex-col gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-primary-sage">
                {t("brandTag")}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-sage/10 text-primary-sage whitespace-nowrap">
                {t("stepBadge", { step })}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-text-primary tracking-tight mt-1">
              {step === 1 && t("step1Title")}
              {step === 2 && t("step2Title")}
              {step === 3 && (orderReceipt ? t("step3TitleWithOrder", { orderNumber: orderReceipt.orderNumber }) : t("step3Title"))}
            </h1>
          </div>
          <div className="text-xs text-text-muted font-medium sm:text-right">
            {step === 1 && t("step1Subtitle")}
            {step === 2 && t("step2Subtitle")}
            {step === 3 && t("step3Subtitle")}
          </div>
        </div>

        <CheckoutBreadcrumb
          currentStep={step}
          onSelectStep={setStep}
          isOrderCompleted={Boolean(orderReceipt)}
        />
      </div>

      {/* 2. Step View Router */}
      <main className="w-full">
        {step === 1 && <StepShippingSection />}
        {step === 2 && <StepPaymentSection />}
        {step === 3 && <StepStatusSection />}
      </main>

      {/* 3. Items Preview Sheet Component */}
      <CheckoutItemsPreviewSheet />
    </div>
  );
}

export function CheckoutPage() {
  const t = useTranslations("Checkout");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full min-h-screen py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-primary-sage block">
              {t("ssrLoadingSubtitle")}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight mt-0.5">
              {t("ssrLoadingTitle")}
            </h1>
          </div>
        </div>
        <div className="w-full h-80 rounded-2xl bg-canvas border border-border-subtle animate-pulse flex items-center justify-center text-text-muted text-sm font-semibold">
          {t("ssrLoadingText")}
        </div>
      </div>
    );
  }

  return (
    <CheckoutProvider>
      <CheckoutContent />
    </CheckoutProvider>
  );
}
export default CheckoutPage;
