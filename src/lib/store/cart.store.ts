// src/lib/store/cart.store.ts
// Zustand = bibliothèque de state management légère
// Alternative à Redux, beaucoup plus simple
// En entretien: "J'utilise Zustand pour l'état global côté client
// car il est minimal (1KB), sans boilerplate, et compatible
// avec les Server Components Next.js contrairement à Redux."

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Type d'un item dans le panier local (avant sync Shopify)
export type CartItem = {
  variantId: string;
  productHandle: string;
  title: string;
  variantTitle: string;
  price: string;
  currencyCode: string;
  image: string | null;
  quantity: number;
};

type CartStore = {
  // État
  items: CartItem[];
  isOpen: boolean;
  shopifyCartId: string | null;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setShopifyCartId: (id: string) => void;

  // Computed (calculé)
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  // persist = sauvegarde automatique dans localStorage
  // Le panier survit aux rechargements de page
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      shopifyCartId: null,

      addItem: (newItem) => {
        set((state) => {
          // Vérifie si la variante est déjà dans le panier
          const existing = state.items.find(
            (i) => i.variantId === newItem.variantId,
          );
          if (existing) {
            // Incrémente la quantité si déjà présent
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i,
              ),
              isOpen: true, // Ouvre le drawer automatiquement
            };
          }
          return {
            items: [...state.items, newItem],
            isOpen: true,
          };
        });
      },

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity === 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity } : i,
                ),
        })),

      clearCart: () => set({ items: [], shopifyCartId: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setShopifyCartId: (id) => set({ shopifyCartId: id }),

      // Computed values
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + parseFloat(i.price) * i.quantity,
          0,
        ),
    }),
    {
      name: "afrestyle-cart", // Clé dans localStorage
      // Ne persiste pas isOpen (le drawer est fermé au reload)
      partialize: (state) => ({
        items: state.items,
        shopifyCartId: state.shopifyCartId,
      }),
    },
  ),
);
