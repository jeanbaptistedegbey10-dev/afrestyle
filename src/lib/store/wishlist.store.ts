// src/lib/store/wishlist.store.ts — Favoris persistés (localStorage)
// ─────────────────────────────────────────────────────────────────────────────
//  Remplace l'ancien `useState` local de `ProductCard` / `ProductForm` qui perdait
//  TOUT au rechargement de la page (et rendait le lien `/wishlist` vide).
//
//  PRINCIPE : on persiste le HANDLE (clé stable, indépendant du prix et du stock)
//  plus un SNAPSHOT minimal du produit. Le snapshot permet un rendu instantané
//  hors-ligne ; il est réactualisé depuis la Storefront API à chaque visite de
//  `/wishlist` via `resolveWishlistProducts` (cf. wishlist.actions.ts).
//
//  ⚠️ Client uniquement : ce module touche `localStorage` via le middleware
//     `persist` de Zustand — ne jamais l'importer depuis un composant serveur.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WishlistItem } from "./wishlist.types";

type WishlistStore = {
  items: WishlistItem[];
  /** Ajoute si absent, retire si déjà présent. @returns `true` si ajouté. */
  toggle: (product: Omit<WishlistItem, "addedAt">) => boolean;
  add: (product: Omit<WishlistItem, "addedAt">) => void;
  remove: (handle: string) => void;
  clear: () => void;
  /**
   * Réconcilie la liste locale avec les données fraîches de Shopify.
   * Met à jour les prix / visuels, purge les produits retirés du catalogue et
   * n'ajoute JAMAIS un handle inconnu (donnée locale corrompue / autre device).
   */
  reconcile: (fresh: WishlistItem[]) => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      add: (product) =>
        set((state) =>
          state.items.some((item) => item.handle === product.handle)
            ? state
            : { items: [{ ...product, addedAt: Date.now() }, ...state.items] },
        ),

      remove: (handle) =>
        set((state) => ({
          items: state.items.filter((item) => item.handle !== handle),
        })),

      toggle: (product) => {
        const exists = get().items.some((item) => item.handle === product.handle);
        if (exists) {
          get().remove(product.handle);
          return false;
        }
        get().add(product);
        return true;
      },

      clear: () => set({ items: [] }),

      reconcile: (fresh) =>
        set((state) => {
          // On conserve `addedAt` local : l'ordre d'ajout est une donnée
          // d'expérience utilisateur, pas une donnée catalogue.
          const previous = new Map(state.items.map((item) => [item.handle, item]));
          const next = fresh
            .filter((item) => previous.has(item.handle))
            .map((item) => ({ ...item, addedAt: previous.get(item.handle)!.addedAt }));
          return { items: next };
        }),
    }),
    {
      name: "afrestyle-wishlist-v1",
      // `version` : permet de migrer le schéma lors d'un changement de format
      // (le middleware discard alors l'ancien localStorage sans erreur).
      version: 1,
    },
  ),
);
