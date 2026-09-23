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
  /** Hero — photo éditoriale mode africaine contemporaine (vérifiée HTTP 200). */
  hero: U("photo-1614291129226-41dae34c2128"),

  /** Story — section Histoire (silhouette en pagne, horizon dramatique). */
  story: U("photo-1531123414780-f74242c2b052"),

  /** Univers — grandes cartes visuelles par catégorie.
   *  ⚠️ Tous ces IDs sont vérifiés HTTP 200 — les anciens
   *  (photo-157851…, photo-158347…, photo-159284…, photo-159552…)
   *  renvoyaient 404 et affichaient des blocs noirs sans fallback. */
  categories: {
    femme: U("photo-1696962678565-bee84e6b9cb6", 800),
    homme: U("photo-1667366982563-dbeedf5281b9", 800),
    accessoires: U("photo-1493655161922-ef98929de9d8", 800),
    surMesure: U("photo-1708170236295-20ab8fbadcef", 800),
  },

  /** Rotation visuels produits Éditorial Luxe (effet rotation dans ProductsSection). */
  products: [
    U("photo-1696962678565-bee84e6b9cb6", 800),
    U("photo-1667366982563-dbeedf5281b9", 800),
    U("photo-1687052001151-316f9356dbc0", 800),
    U("photo-1611853904829-6d0f4034ce2f", 800),
    U("photo-1625646741211-711bdd65c570", 800),
    U("photo-1578509566163-068acd11b8e7", 800),
  ],

  /** Lookbook — cadrages éditoriaux « L'élégance en images ». */
  lookbook: [
    U("photo-1578509566163-068acd11b8e7", 800), // Kente — Accra
    U("photo-1611853904829-6d0f4034ce2f", 800), // Wax contemporain — Abidjan
    U("photo-1515658323406-25d61c141a6e", 800), // Perles & coiffure — Bamako
    U("photo-1708170236295-20ab8fbadcef", 800), // Grand boubou — Dakar
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
