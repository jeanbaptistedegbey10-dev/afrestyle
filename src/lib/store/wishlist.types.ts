// src/lib/store/wishlist.types.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Types & helpers PARTAGÉS entre la wishlist cliente et ses Server Actions.
//
//  ⚠️ Pourquoi un module séparé : `wishlist.store.ts` porte la directive
//     `"use client"` (il touche `localStorage`). Un fichier `"use server"`
//     ne peut PAS l'importer — la frontière client/server ferait échouer
//     l'appel de `toWishlistItem` côté serveur. Ce module neutre (`types`
//     uniquement, aucun accès au navigateur) est donc importé par les deux
//     côtés : une seule définition du snapshot, zéro duplication.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Snapshot local d'un produit enregistré en favori.
 *
 * Volontairement minimal : on ne duplique ni les variantes (poids inutile dans
 * localStorage) ni les prix calculés (ils sont rafraîchis depuis Shopify).
 */
export type WishlistItem = {
  /** Clé d'identification — `handle` Shopify, stable dans le temps. */
  handle: string;
  title: string;
  /** Montant brut ("185.00") — permet le recalcul d'affichage côté wishlist. */
  price: string;
  /** Prix déjà formaté ("185 €") — rendu immédiat sans reformatage. */
  priceFormatted: string;
  /** URL du visuel principal (CDN Shopify) ou `null` si le produit n'en a pas. */
  image: string | null;
  /** Texte alternatif du visuel (accessibilité). */
  imageAlt: string | null;
  vendor: string;
  availableForSale: boolean;
  /** Horodatage d'ajout (ms) — tri « les plus récemment ajoutés » en 1ʳᵉ. */
  addedAt: number;
};

/** Forme minimale d'un produit acceptée par `toWishlistItem`. */
export type WishlistProductLike = {
  handle: string;
  title: string;
  price: string;
  priceFormatted: string;
  images: { url: string; altText: string | null }[];
  vendor: string;
  availableForSale: boolean;
};

/** Extrait le snapshot persistable d'un produit. */
export function toWishlistItem(product: WishlistProductLike): WishlistItem {
  const overview =
    product.images.find((image) => image.altText) ?? product.images[0];
  return {
    handle: product.handle,
    title: product.title,
    price: product.price,
    priceFormatted: product.priceFormatted,
    image: overview?.url ?? null,
    imageAlt: overview?.altText ?? null,
    vendor: product.vendor,
    availableForSale: product.availableForSale,
    addedAt: Date.now(),
  };
}
