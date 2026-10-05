// src/lib/actions/wishlist.actions.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Server Action — résolution de la wishlist contre la Storefront API.
//
//  La wishlist ne stocke QUE des handles + un snapshot local. Cette action
//  ré-hydrate les données fraîches (prix, visuel, disponibilité) ET signale les
//  produits retirés du catalogue, afin que `/wishlist` n'affiche jamais une
//  fiche fantôme.
//
//  Les lectures sont lancées EN PARALLÈLE (`Promise.all`) : une seule phase
//  réseau, quel que soit le nombre de favoris. Chaque lecture se dégrade SEULE
//  (`getProductByHandle` retombe sur le catalogue éditorial local), donc un
//  produit en échec n'entraîne jamais l'échec de toute la page.
// ─────────────────────────────────────────────────────────────────────────────
"use server";

import { getProductByHandle } from "@/lib/shopify/products";
import { toWishlistItem, type WishlistItem } from "@/lib/store/wishlist.types";

/** Plafond de résolution : au-delà, on garde le snapshot local (page déjà longue). */
const MAX_RESOLVED_ITEMS = 40;

export type ResolvedWishlist = {
  /** Favoris toujours existants en boutique, réhydratés et à jour. */
  items: WishlistItem[];
  /** Handles introuvables → la wishlist locale doit les purger. */
  missingHandles: string[];
};

/**
 * Réhydrate une liste de favoris depuis Shopify.
 *
 * @param handles handles enregistrés localement (depuis `localStorage`)
 * @returns les produits résolus + les handles devenus introuvables
 */
export async function resolveWishlistProducts(
  handles: string[],
): Promise<ResolvedWishlist> {
  const unique = Array.from(new Set(handles)).filter(Boolean).slice(0, MAX_RESOLVED_ITEMS);
  if (unique.length === 0) return { items: [], missingHandles: [] };

  // `Promise.all` conserve l'ordre : `results[i]` correspond à `unique[i]`,
  // ce qui permet de reconstruire les deux listes en une seule passe.
  const results = await Promise.all(
    unique.map(async (handle) => {
      const product = await getProductByHandle(handle);
      return product ? toWishlistItem(product) : null;
    }),
  );

  const items: WishlistItem[] = [];
  const missingHandles: string[] = [];

  results.forEach((item, index) => {
    if (item) items.push(item);
    else missingHandles.push(unique[index]);
  });

  return { items, missingHandles };
}
