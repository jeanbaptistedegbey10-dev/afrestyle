// src/constants/images.ts
//  Visuels éditoriaux de l'accueil AfroStyle.
//
//  ⚠️ AUCUNE URL externe. Les anciens replis Unsplash (hero, story, univers)
//  ont tous été retirés : identifiers invalides → réponses 404 → cadres noirs
//  sur la home. Les repli sont désormais des placeholders SVG générés
//  localement, aux couleurs de la charte (cf. `getSvgPlaceholder`).
//
//  RÈGLE : Shopify reste la source de vérité des visuels réels. Ces constantes
//  ne servent QUE de repli quand un metaobject / une collection n'a aucune
//  image publiée — jamais à remplacer une donnée produit.
import { getSvgPlaceholder } from "@/lib/assets/images";

const local = (
  ratio: "portrait" | "landscape" | "banner",
  label: string,
  seed: number,
) => getSvgPlaceholder({ ratio, label, seed });

/**
 * Diaporama du Hero -- replis locaux.
 *
 * Le contenu editorial (titres, CTA) reste pilote par Shopify Admin : ces
 * visuels ne servent que si le type `hero_slide` est vide ou illisible.
 */
/**
 * Un libellé ET un `alt` par variation du diaporama : le repli doit décrire LA
 * slide qu'il illustre (WCAG), pas une « collection » générique.
 *
 * L'ordre suit strictement `HERO_FALLBACK_SLIDES` (`lib/shopify/hero.ts`) :
 * slide 1 → haute couture, slide 2 → nouvelle collection, etc.
 */
const HERO_SLIDES = [
  {
    label: "Maison de Haute Couture",
    alt: "Visuel éditorial AfroStyle — maison de haute couture africaine.",
  },
  {
    label: "Nouvelle Collection",
    alt: "Visuel éditorial AfroStyle — nouvelle collection.",
  },
  {
    label: "Sur-mesure & Tradition",
    alt: "Visuel éditorial AfroStyle — coupe sur-mesure et tradition.",
  },
  {
    label: "Wax, Bazin & Kente",
    alt: "Visuel éditorial AfroStyle — matières wax, bazin et kente.",
  },
].map((slide, seed) => ({
  src: local("banner", slide.label, seed),
  alt: slide.alt,
}));

export const IMAGES = {
  /** Hero -- premier visuel du diaporama, charge en priorite (LCP). */
  hero: HERO_SLIDES[0].src,

  /** Hero -- diaporama editorial automatique (repli local, 4 visuels). */
  heroSlides: HERO_SLIDES,

  /** Story -- section "Notre histoire / Savoir-faire". */
  story: local("portrait", "Savoir-faire", 4),

  /** Univers -- replis pour les grandes cartes de categories. */
  categories: {
    femme: local("portrait", "Collection Femme", 5),
    homme: local("portrait", "Collection Homme", 6),
    accessoires: local("portrait", "Accessoires", 7),
    surMesure: local("portrait", "Sur-mesure", 8),
  },

  /** Rotation de replis visuels produits (catalogue vide uniquement). */
  products: [9, 10, 11, 12, 13, 14].map((seed) =>
    local("portrait", "Piece de la collection", seed),
  ),

  /** Lookbook -- replis editoriaux "L'elegance en images". */
  lookbook: [15, 16, 17, 18].map((seed) =>
    local("portrait", "Lookbook AfroStyle", seed),
  ),
} as const;

/**
 * Placeholder SVG par défaut (data-URI) : utilise quand un visuel distant
 * echoue au chargement cote client.
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

