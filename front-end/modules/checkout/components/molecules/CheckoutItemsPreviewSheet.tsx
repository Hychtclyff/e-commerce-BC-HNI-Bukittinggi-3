"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag, Award } from "lucide-react";
import { TijarahSheet } from "@/components/atom/tijarahSheet";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { CartItemRow } from "@/modules/shop/components/molecules/CartItemRow";
import { useCheckoutContext } from "../../context/CheckoutContext";
import { formatCurrency } from "@/utils/formatters";

export const CheckoutItemsPreviewSheet: React.FC = () => {
  const t = useTranslations("Checkout");
  const {
    isItemsSheetOpen,
    setIsItemsSheetOpen,
    cartItems,
    isAgent,
    updateQty,
    removeFromCart,
    subtotal,
    totalPoints,
    totalCount,
  } = useCheckoutContext();

  return (
    <TijarahSheet
      isOpen={isItemsSheetOpen}
      onClose={() => setIsItemsSheetOpen(false)}
      title={t("sheetTitle", { count: totalCount })}
      description={t("sheetDesc")}
      icon={<ShoppingBag className="w-5 h-5" />}
      size="md"
      side="right"
      footer={
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">{t("sheetSubtotal")}</span>
            <span className="font-extrabold text-text-primary text-sm">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {isAgent && totalPoints > 0 && (
            <div className="flex items-center justify-between text-xs text-accent-gold font-bold">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {t("sheetPointsLabel")}
              </span>
              <span>{totalPoints} TP</span>
            </div>
          )}

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            onClick={() => setIsItemsSheetOpen(false)}
            className="w-full font-bold py-2.5"
          >
            {t("sheetCloseBtn")}
          </TijarahButton>
        </div>
      }
    >
      {cartItems.length === 0 ? (
        <div className="py-12 text-center text-xs text-text-muted">
          {t("sheetEmpty")}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle/50">
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
      )}
    </TijarahSheet>
  );
};
export default CheckoutItemsPreviewSheet;
