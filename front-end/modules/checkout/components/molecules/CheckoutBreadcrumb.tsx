"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Truck, CreditCard, CheckCircle2, Check } from "lucide-react";
import { CheckoutStep } from "../../context/CheckoutContext";

export interface CheckoutBreadcrumbProps {
  currentStep: CheckoutStep;
  onSelectStep?: (step: CheckoutStep) => void;
  isOrderCompleted?: boolean;
}

export const CheckoutBreadcrumb: React.FC<CheckoutBreadcrumbProps> = ({
  currentStep,
  onSelectStep,
  isOrderCompleted = false,
}) => {
  const t = useTranslations("Checkout");
  const steps: { step: CheckoutStep; title: string; subtitle: string; icon: React.ElementType }[] = [
    { step: 1, title: t("bcStep1Title"), subtitle: t("bcStep1Sub"), icon: Truck },
    { step: 2, title: t("bcStep2Title"), subtitle: t("bcStep2Sub"), icon: CreditCard },
    { step: 3, title: t("bcStep3Title"), subtitle: t("bcStep3Sub"), icon: CheckCircle2 },
  ];

  return (
    <nav aria-label={t("breadcrumbAria")} className="w-full">
      <div className="relative">
        {/* Background Connecting Line */}
        <div className="hidden sm:block absolute top-[20px] left-[20%] right-[20%] h-0.5 bg-border-subtle rounded-full -z-0 overflow-hidden">
          <div
            className="h-full bg-primary-sage rounded-full transition-all duration-500 ease-out"
            style={{
              width:
                currentStep === 1
                  ? "0%"
                  : currentStep === 2
                  ? "50%"
                  : "100%",
            }}
          />
        </div>

        {/* Step Items */}
        <ol className="flex items-center justify-between gap-2 relative z-10">
          {steps.map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step || (s.step === 3 && isOrderCompleted);
            const isClickable = Boolean(onSelectStep && isCompleted && !isOrderCompleted);

            return (
              <li
                key={s.step}
                className="flex-1 first:text-left last:text-right sm:first:text-center sm:last:text-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isClickable && onSelectStep) {
                      onSelectStep(s.step);
                    }
                  }}
                  disabled={!isClickable}
                  className={`group inline-flex items-center sm:flex-col sm:justify-center gap-2.5 p-2 rounded-xl transition-colors ${
                    isClickable
                      ? "cursor-pointer hover:bg-canvas"
                      : "cursor-default"
                  }`}
                >
                  {/* Step Icon Indicator */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-colors ${
                      isActive
                        ? "bg-primary-sage text-white ring-2 ring-primary-sage/25"
                        : isCompleted
                        ? "bg-primary-sage text-white"
                        : "bg-surface border border-border-subtle text-text-muted"
                    }`}
                  >
                    {isCompleted && currentStep !== s.step ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    ) : (
                      <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>

                  {/* Step Text Info */}
                  <div className="text-left sm:text-center">
                    <div className="flex items-center gap-1.5 sm:justify-center">
                      <span
                        className={`text-xs sm:text-sm font-extrabold ${
                          isActive
                            ? "text-primary-sage"
                            : isCompleted
                            ? "text-text-primary"
                            : "text-text-muted"
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                    <span className="hidden sm:block text-[11px] text-text-muted font-medium mt-0.5">
                      {s.subtitle}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default CheckoutBreadcrumb;
