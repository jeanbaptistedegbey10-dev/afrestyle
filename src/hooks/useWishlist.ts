// src/hooks/useWishlist.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Hook d'accès à la wishlist persistée.
//
//  Rôle : garder les composants UI (ProductCard, ProductForm, Navbar, page
//  /wishlist) légers — ils ne connaissent QUE ce hook, jamais le store.
//  Même contrat que `useCart` : logique métier ici, composants dumb.
//
//  ⚠️ `items` vient de `localStorage` : au premier rendu client la persistance
//     n'est pas encore réhydratée (SSR = liste vide). Les composants doivent
//     combiner ce hook avec `useMounted()` avant d'afficher un compteur.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import { toWishlistItem, type WishlistItem } from "@/lib/store/wishlist.types";
import type { Product } from "@/lib/shopify/types";

export function useWishlist() {
  const items = useWishlistStore((state) => state.items);
  const add = useWishlistStore((state) => state.add);
  const remove = useWishlistStore((state) => state.remove);
  const toggle = useWishlistStore((state) => state.toggle);
  const clear = useWishlistStore((state) => state.clear);
  const reconcile = useWishlistStore((state) => state.reconcile);

  /** `true` si le produit est déjà en favori — pour l'état du cœur. */
  const isWishlisted = useCallback(
    (handle: string) => items.some((item) => item.handle === handle),
    [items],
  );

  /** Bascule favori + toast de confirmation (retour UX constant). */
  const toggleProduct = useCallback(
    (product: Product) => {
      const added = toggle(toWishlistItem(product));
      toast(added ? "Ajouté à vos favoris" : "Retiré de vos favoris", {
        icon: "♥",
        style: {
          background: "var(--toast-surface)",
          color: "var(--text)",
          border: "1px solid rgba(197,160,89,0.35)",
        },
      });
      return added;
    },
    [toggle],
  );

  /** Ajout silencieux (fiche produit — pas de double retour visuel). */
  const addProduct = useCallback((product: Product) => add(toWishlistItem(product)), [add]);

  const removeItem = useCallback(
    (handle: string) => {
      remove(handle);
      toast("Retiré de vos favoris", {
        icon: "♥",
        style: {
          background: "var(--toast-surface)",
          color: "var(--text)",
          border: "1px solid rgba(197,160,89,0.35)",
        },
      });
    },
    [remove],
  );

  const clearAll = useCallback(() => {
    clear();
    toast.success("Favoris vidés", {
      style: {
        background: "var(--toast-surface)",
        color: "var(--text)",
        border: "1px solid rgba(197,160,89,0.35)",
      },
    });
  }, [clear]);

  // Memoïsé : évite de recalculer le tableau à chaque render des cartes produit.
  const count = useMemo(() => items.length, [items]);

  return {
    items,
    count,
    isWishlisted,
    toggleProduct,
    addProduct,
    removeItem,
    clearAll,
    reconcile,
  };
}

export type { WishlistItem };
