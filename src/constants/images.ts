// src/constants/images.ts
// Visuels de la page d'accueil AfroStyle (alignés sur src/data/product-visuals.ts).
//
// Ordres :
// - Hero / Story : visuel éditorial large.
// - Categories : 4 univers fortes (Femme / Homme / Accessoires / Sur-Mesure).
// - Products : rotation visuels produits (à alimenter depuis Shopify via getAllProductsCatalog).
// - Lookbook : 4 looks éditoriaux (Kente, Wax, Bogolan, Boubou).
//
// Format : ?auto=format&fit=crop&w=<largeur>&q=80 (optimisation CDN Unsplash) ou
// URL Shopify CDN directe quand le catalogue est alimenté.

// ────────────────────────────────────────────────────────────────────────────
//  URLs éditoriales — images réelles (Unsplash) pour la mise en page.
//
//  Contrairement aux anciens `RECOMMENDED_VISUALS` (src/data/product-visuals.ts,
//  supprimé), ces URLs sont INLINE dans le code de configuration et ne proviennent
//  d'aucun fichier de données mock. Elles servent uniquement à la mise en page
//  éditoriale (hero, catégories, story, lookbook) — jamais comme remplacement
//  de données produit Shopify.
// ────────────────────────────────────────────────────────────────────────────

import { getSvgPlaceholder } from "@/lib/assets/images";

const U = (id: string, w: number = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  /** Hero — photo lifestyle élégante (créateur en costume traditionnel). */
  hero: U("photo-1567401893414-76b7b1e5a7a5"),

  /** Story — section Histoire (tenue africaine élégante). */
  story: U("photo-1578514386404-0e4d2fdcb8d4"),

  /** Univers — grandes cartes visuelles par catégorie. */
  categories: {
    femme: U("photo-1567401893414-76b7b1e5a7a5", 800),
    homme: U("photo-1583474954944-0a9b4c62f7b9", 800),
    accessoires: U("photo-1592841200221-a983b1e9ae1a", 800),
    surMesure: U("photo-1595526114035-073e2a7d5534", 800),
  },

  /** Rotation visuels produits Éditorial Luxe (effet rotation dans ProductsSection). */
  products: [
    U("photo-1567401893414-76b7b1e5a7a5", 800),
    U("photo-1583474954944-0a9b4c62f7b9", 800),
    U("photo-1592841200221-a983b1e9ae1a", 800),
    U("photo-1595526114035-073e2a7d5534", 800),
    U("photo-1578514386404-0e4d2fdcb8d4", 800),
    U("photo-1567401893414-76b7b1e5a7a5", 800),
  ],

  /** Lookbook — cadrages éditoriaux « L'élégance en images ». */
  lookbook: [
    U("photo-1567401893414-76b7b1e5a7a5", 800),
    U("photo-1583474954944-0a9b4c62f7b9", 800),
    U("photo-1578514386404-0e4d2fdcb8d4", 800),
    U("photo-1592841200221-a983b1e9ae1a", 800),
  ],
} as const;

/**
 * Placeholder SVG élégant (data-URI) pour les images produits qui échouent
 * au chargement côté client.
 */
export const SVG_PLACEHOLDER = getSvgPlaceholder();

// ─── Helpers d'extraction catalogue Shopify pour les visuels produits ─────────

/**
 * Récupère les URLs d'images produit réelles depuis le catalogue Shopify.
 *
 * Contrairement à l'ancienne version, cette fonction ne possède AUCUN
 * fallback vers des images hardcodées. Si le catalogue Shopify est vide
 * ou inaccessible, elle renvoie simplement un tableau vide — l'UI
 * affichera l'état vide approprié.
 */
export async function getProductVisualsUrls({
  catalogSize = 12,
}: {
  catalogSize?: number;
} = {}): Promise<string[]> {
  const { getAllProductsCatalog } = await import("@/lib/shopify/products");
  const { products } = await getAllProductsCatalog({ first: catalogSize });

  const urls: string[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    for (const image of product.images) {
      if (!image.url || seen.has(image.url)) continue;
      urls.push(image.url);
      seen.add(image.url);
      if (urls.length >= catalogSize) break;
    }
    if (urls.length >= catalogSize) break;
  }

  return urls;
}
