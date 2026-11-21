"use client";

import { useEffect, useState, useMemo } from "react";
import { useCartStore } from "../store/cart.store";
import { ShopProduct, CartItem } from "../types/shop.types";

export function useCart() {
  const store = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = useMemo(() => {
    return store.cartItems.reduce((acc, item) => acc + item.qty, 0);
  }, [store.cartItems]);

  return {
    cartItems: store.cartItems,
    addToCart: store.addToCart,
    updateQty: store.updateQty,
    removeFromCart: store.removeFromCart,
    clearCart: store.clearCart,
    totalCount: mounted ? totalCount : 0,
    getSubtotal: store.getSubtotal,
    getTotalPoints: store.getTotalPoints,
    isInitialized: mounted,
    isCartSheetOpen: store.isCartSheetOpen,
    openCartSheet: store.openCartSheet,
    closeCartSheet: store.closeCartSheet,
    toggleCartSheet: store.toggleCartSheet,
    setIsCartSheetOpen: store.setIsCartSheetOpen,
  };
}

export default useCart;
