// src/components/home/ProductVisualsProvider.tsx
// Fournisseur de visuels produits pour la page d'accueil.
//
// Ce module expose :
// - getProductVisuals() : version serveur (utilisable dans Server Components / page.tsx).
// - ProductVisualsProvider (client) : passe les URLs via React context si besoin.
//
// Usage typique :
// - src/app/page.tsx appelle getProductVisuals() pour récupérer les URLs.
// - ProductsSection utilise le tableau pour les fallback visuels produits.

import { getProductVisualsUrls } from "@/constants/images";

/**
 * Retourne la liste d'URLs de visuels produits pour la page d'accueil.
 *
 * Ordre de priorité :
 * 1. Visuels produits Shopify (via getAllProductsCatalog).
  * 2. ProductsSection utilise IMAGES.products comme repli éditorial si le catalogue Shopify est vide.
 */
export async function getProductVisuals({
  catalogSize = 12,
}: {
  catalogSize?: number;
} = {}): Promise<string[]> {
  return getProductVisualsUrls({ catalogSize });
}
