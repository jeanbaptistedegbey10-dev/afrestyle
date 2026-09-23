// src/lib/product-visuals.ts
// Helpers serveur pour les visuels produits (pages /shop, /collections/[handle], accueil).
//
// Stratégie :
// - Réutilise getProductVisualsUrls() pour obtenir les URLs (Shopify + fallbacks).
// - Permet de configurer revalidate / tags pour l'ISR et la réinvalidation catalogue.

import { getProductVisualsUrls } from "@/constants/images";

export type ProductVisualsOptions = {
  /** Nombre de visuels à renvoyer. */
  catalogSize?: number;
  /**
   * Tags Next.js pour la réinvalidation (ex. ["product-visuals", "catalog"]).
   * Utiles si on intègre l'appel dans une page ISR ou une Server Action.
   */
  tags?: string[];
  /**
   * Délai de révalidation ISR (secondes). Par défaut 5 min, aligné sur
   * products/[handle] et collections/page.tsx.
   */
  revalidate?: number | false;
};

export async function getProductVisuals({
  catalogSize = 12,
}: ProductVisualsOptions = {}): Promise<string[]> {
  // getProductVisualsUrls() appelle getAllProductsCatalog() qui, lui, utilise
  // storefrontFetch(tags: ["products", "catalog"]) et bénéficie donc du même
  // système de tags que le reste du catalogue.
  return getProductVisualsUrls({ catalogSize });
}

