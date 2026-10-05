// src/lib/product/images.ts
// ────────────────────────────────────────────────────────────────────────────
//  SÉLECTION DES VISUELS AFFICHABLES — helper PUR (aucun import serveur,
//  importable depuis un composant « use client »).
//
//  Règle unique, partagée par <ProductCard /> et <ProductImages /> :
//    • un visuel « réel » est une URL distante (média publié dans Shopify) ;
//    • les replis SVG locaux (`data:` / `blob:`) ne sont JAMAIS retenus dès
//      qu'un vrai visuel existe — ils ne servent que de filet de sécurité
//      quand la pièce ne publie aucun média ;
//    • la galerie n'est jamais complétée pour atteindre un nombre fixe :
//      N visuels ⇒ EXACTEMENT N vignettes et un compteur « 1 / N ».
// ────────────────────────────────────────────────────────────────────────────

import { isLocalPlaceholder } from "@/lib/assets/images";
import type { ProductGalleryImage } from "@/lib/shopify/types";

/** Un visuel « réel » : URL renseignée et distante (ni `data:` ni `blob:`). */
export function isRealProductImage(image: ProductGalleryImage): boolean {
  return Boolean(image?.url) && !isLocalPlaceholder(image.url);
}

/**
 * Filtre les visuels affichables d'un produit.
 *
 * Retire d'abord les entrées sans URL, puis les replis locaux — sauf si
 * aucun visuel réel ne subsiste, auquel cas on conserve les replis plutôt que
 * d'afficher un cadre vide.
 */
export function selectDisplayImages(
  images: readonly ProductGalleryImage[] | null | undefined,
): ProductGalleryImage[] {
  const valid = (images ?? []).filter((image) => Boolean(image?.url));
  const real = valid.filter(isRealProductImage);
  return real.length > 0 ? real : valid;
}