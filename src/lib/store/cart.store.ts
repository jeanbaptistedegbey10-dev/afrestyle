// src/lib/store/cart.store.ts — version complète avec Shopify
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  withCheckoutReturnTo,
  type ShopifyCart,
  type ShopifyCartLine,
} from "@/lib/shopify/cart";

type CartStore = {
  // Le panier Shopify complet (source de vérité)
  shopifyCart: ShopifyCart | null;
  // UI state
  isOpen: boolean;
  isLoading: boolean;

  // Actions
  setShopifyCart: (cart: ShopifyCart | null) => void;
  setIsOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  setLoading: (loading: boolean) => void;
  clearCart: () => void;

  // Computed
  totalItems: () => number;
  lines: () => ShopifyCartLine[];
  checkoutUrl: () => string | null;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      shopifyCart: null,
      isOpen: false,
      isLoading: false,

      setShopifyCart: (cart) => set({ shopifyCart: cart }),
      setIsOpen: (open) => set({ isOpen: open }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearCart: () => set({ shopifyCart: null }),

      // Computed — lit le cart Shopify comme source de vérité
      totalItems: () => get().shopifyCart?.totalQuantity ?? 0,
      lines: () => get().shopifyCart?.lines ?? [],
      // Resanctionné à chaque lecture : un panier persisté avant correction
      // (return_to=localhost) reçoit l'URL de retour dynamique à jour.
      checkoutUrl: () => {
        const cart = get().shopifyCart;
        return cart ? withCheckoutReturnTo(cart.checkoutUrl) : null;
      },
    }),
    {
      name: "afrestyle-cart-v2",
      // Persiste uniquement le panier Shopify (pas l'UI state)
      partialize: (state) => ({
        shopifyCart: state.shopifyCart,
      }),
    }
  )
);