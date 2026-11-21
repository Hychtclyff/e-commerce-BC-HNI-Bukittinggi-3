"use client";

import React from "react";
import { X } from "lucide-react";
import { CheckoutReceiptCard } from "@/components/molecules/CheckoutReceiptCard";
import { OrderReceiptResponse } from "../../types/shop.types";

export interface ShopReceiptModalProps {
  receipt: OrderReceiptResponse | null;
  onClose: () => void;
}

export const ShopReceiptModal: React.FC<ShopReceiptModalProps> = ({
  receipt,
  onClose,
}) => {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 animate-pop-in">
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-surface border border-border-subtle shadow-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-canvas transition-colors cursor-pointer print:hidden"
          title="Tutup Faktur"
        >
          <X className="w-5 h-5" />
        </button>

        <CheckoutReceiptCard receipt={receipt} />
      </div>
    </div>
  );
};
export default ShopReceiptModal;
