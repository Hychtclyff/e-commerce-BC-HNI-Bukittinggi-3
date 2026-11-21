import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ShopProduct, CartItem } from "../types/shop.types";

export interface CartStoreState {
  cartItems: CartItem[];
  isCartSheetOpen: boolean;
  isHydrated: boolean;

  // Sheet Controls
  openCartSheet: () => void;
  closeCartSheet: () => void;
  toggleCartSheet: () => void;
  setIsCartSheetOpen: (isOpen: boolean) => void;

  // Cart Manipulations
  addToCart: (product: ShopProduct, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setHydrated: (hydrated: boolean) => void;

  // Computed Values / Helpers
  getTotalCount: () => number;
  getSubtotal: (isAgent: boolean) => number;
  getTotalPoints: (isAgent: boolean) => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      isCartSheetOpen: false,
      isHydrated: false,

      openCartSheet: () => set({ isCartSheetOpen: true }),
      closeCartSheet: () => set({ isCartSheetOpen: false }),
      toggleCartSheet: () => set((state) => ({ isCartSheetOpen: !state.isCartSheetOpen })),
      setIsCartSheetOpen: (isOpen: boolean) => set({ isCartSheetOpen: isOpen }),

      addToCart: (product: ShopProduct, qty: number = 1) => {
        set((state) => {
          const existingIndex = state.cartItems.findIndex(
            (item) => item.product.id === product.id
          );
          if (existingIndex > -1) {
            const next = [...state.cartItems];
            const newQty = next[existingIndex].qty + qty;
            next[existingIndex] = {
              ...next[existingIndex],
              qty: Math.min(newQty, product.stock),
            };
            return { cartItems: next };
          }
          return {
            cartItems: [...state.cartItems, { product, qty: Math.min(qty, product.stock) }],
          };
        });
      },

      updateQty: (productId: string, qty: number) => {
        set((state) => {
          if (qty <= 0) {
            return {
              cartItems: state.cartItems.filter((item) => item.product.id !== productId),
            };
          }
          return {
            cartItems: state.cartItems.map((item) => {
              if (item.product.id === productId) {
                return {
                  ...item,
                  qty: Math.min(qty, item.product.stock),
                };
              }
              return item;
            }),
          };
        });
      },

      removeFromCart: (productId: string) => {
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.product.id !== productId),
        }));
      },

      clearCart: () => {
        set({ cartItems: [] });
      },

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },

      getTotalCount: () => {
        return get().cartItems.reduce((acc, item) => acc + item.qty, 0);
      },

      getSubtotal: (isAgent: boolean) => {
        return get().cartItems.reduce((acc, item) => {
          const price = isAgent ? item.product.agentPrice : item.product.normalPrice;
          return acc + price * item.qty;
        }, 0);
      },

      getTotalPoints: (isAgent: boolean) => {
        if (!isAgent) return 0;
        return get().cartItems.reduce((acc, item) => {
          return acc + (item.product.tpPoints || 0) * item.qty;
        }, 0);
      },
    }),
    {
      name: "tijarah_shop_cart",
      storage: createJSONStorage(() => localStorage),
      // Hanya persist daftar barang belanjaan, status sheet modal tidak perlu di-persist
      partialize: (state) => ({ cartItems: state.cartItems }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
