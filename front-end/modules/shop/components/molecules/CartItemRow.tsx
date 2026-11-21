"use client";

import React from "react";
import Image from "next/image";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { formatCurrency } from "@/utils/formatters";
import { CartItem } from "../../types/shop.types";

export interface CartItemRowProps {
  item: CartItem;
  isAgent: boolean;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  isAgent,
  onUpdateQty,
  onRemove,
}) => {
  const activePrice = isAgent ? item.product.agentPrice : item.product.normalPrice;
  const itemSubtotal = activePrice * item.qty;
  const itemPoints = isAgent ? (item.product.tpPoints || 0) * item.qty : 0;

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border-subtle/60 last:border-b-0">
      {/* Product Visual & Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative w-12 h-12 rounded-xl bg-canvas border border-border-subtle shrink-0 flex items-center justify-center overflow-hidden">
          {item.product.imageUrl ? (
            <Image
              src={item.product.imageUrl}
              alt={item.product.name}
              fill
              className="object-cover"
            />
          ) : (
            <ShoppingBag className="w-6 h-6 text-text-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-bold text-text-primary line-clamp-1">
            {item.product.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 text-xs">
            <span className="text-primary-sage font-extrabold">
              {formatCurrency(activePrice)}
            </span>
            {itemPoints > 0 && (
              <span className="text-[11px] font-bold text-accent-gold">
                • {itemPoints} TP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stepper Controls & Subtotal */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center bg-canvas rounded-xl border border-border-subtle p-0.5">
          <button
            type="button"
            onClick={() => onUpdateQty(item.product.id, item.qty - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
            aria-label="Kurangi jumlah"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-bold text-text-primary">
            {item.qty}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQty(item.product.id, item.qty + 1)}
            disabled={item.qty >= item.product.stock}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Tambah jumlah"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-right min-w-[70px]">
          <span className="text-xs font-black text-text-primary block">
            {formatCurrency(itemSubtotal)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.product.id)}
          className="p-1.5 rounded-lg text-text-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors cursor-pointer"
          title="Hapus barang"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
