import {
  OrderStatusType,
  ShippingType,
  PaymentMethodType,
  CheckoutPayload,
  OrderReceiptResponse,
  VoucherItem,
  CheckoutItem,
} from "@/types/checkout.types";

export interface ShopProduct {
  id: string;
  name: string;
  sku?: string;
  category: string;
  categoryKey?: string;
  agentPrice: number;
  normalPrice: number;
  tpPoints: number;
  stock: number;
  imageUrl?: string;
  rating?: string;
  sold?: string;
  description?: string;
  isSeparable?: boolean;
  defaultBreakdownQty?: number | null;
  isFraction?: boolean;
  parentProductId?: string | null;
  allowAgentPrice?: boolean;
}

export interface CartItem {
  product: ShopProduct;
  qty: number;
}

export type {
  OrderStatusType,
  ShippingType,
  PaymentMethodType,
  CheckoutPayload,
  OrderReceiptResponse,
  VoucherItem,
  CheckoutItem,
};
