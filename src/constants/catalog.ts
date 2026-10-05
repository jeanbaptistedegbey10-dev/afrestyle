// src/constants/catalog.ts
// ────────────────────────────────────────────────────────────────────────────
//  CONTRAT DE CATALOGUE AfroStyle — constantes partagées (serveur ET client).
//
//  Ce fichier ne contient AUCUNE donnée produit : uniquement le vocabulaire
//  commun (catégories, échelle de tailles, tags) utilisé à la fois par
//  `src/lib/shopify/mock-data.ts` (catalogue de référence) et par les
//  composants d'interface (sélecteur de tailles, accordéons de la fiche).
//  Il est volontairement minuscule : importable depuis un composant
//  `"use client"` sans embarquer le catalogue mock dans le bundle client.
// ────────────────────────────────────────────────────────────────────────────

/** Les 4 univers du catalogue AfroStyle. */
export const CATALOG_CATEGORIES = [
  "Femme",
  "Homme",
  "Accessoires & Bijoux",
  "Cérémonie & Mariage",
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

/** Tailles « prêt-à-porter » — l'échelle de référence du site. */
export const CATALOG_SIZE_SCALE = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type CatalogSize = (typeof CATALOG_SIZE_SCALE)[number];

/**
 * Déclinaison « sur-mesure » : elle ne correspond à AUCUN stock réservé (pièce
 * confectionnée aux mesures du client), elle est donc toujours présentée à part
 * des tailles standard — jamais comme une variante épuisée.
 */
export const MADE_TO_MEASURE_SIZE = "Sur-mesure";

/** Échelle complète affichée sur la fiche produit (standard + sur-mesure). */
export const CATALOG_ALL_SIZES = [
  ...CATALOG_SIZE_SCALE,
  MADE_TO_MEASURE_SIZE,
] as const;

export type CatalogAllSize = (typeof CATALOG_ALL_SIZES)[number];

/**
 * Tag porté par toutes les pièces du catalogue éditorial.
 * La section Lookbook (accueil + /lookbook) ne montre QUE les produits qui le
 * portent — elle est donc pilotée par les données, jamais par une liste en dur.
 */
export const LOOKBOOK_TAG = "lookbook";

/**
 * Tags posés sur un produit selon sa catégorie.
 *
 * Deux familles cohabitent volontairement :
 *  • le tag canonique `categorie-<slug>` — utilisé par les nouveaux filtres ;
 *  • le tag historique (`femme` / `homme` / `accessoire`) — déjà consommé par
 *    les liens existants (`/collections?gender=homme`, footer, filtres de la
 *    page Collections) et par les produits déjà publiés dans Shopify.
 * Sans cette double écriture, une pièce enrichie sortirait des filtres en
 * place.
 */
export const CATALOG_CATEGORY_TAGS: Record<CatalogCategory, readonly string[]> =
  {
    Femme: ["categorie-femme", "femme"],
    Homme: ["categorie-homme", "homme"],
    "Accessoires & Bijoux": ["categorie-accessoires-bijoux", "accessoire"],
    "Cérémonie & Mariage": ["categorie-ceremonie-mariage", "ceremonie"],
  };

/** Tag canonique d'une catégorie (`Femme` → `categorie-femme`). */
export function categoryTag(category: CatalogCategory): string {
  return CATALOG_CATEGORY_TAGS[category][0];
}

/**
 * Déduit une catégorie à partir des tags d'un produit (Shopify ou mock).
 * Ordre de priorité : accessoires → cérémonie → homme → femme (défaut).
 * Retourne `null` si aucun indice exploitable (aucun tag de genre).
 */
export function resolveCatalogCategory(
  tags: readonly string[],
): CatalogCategory | null {
  const normalized = new Set(tags.map((tag) => tag.toLowerCase()));

  if (normalized.has("accessoire") || normalized.has("categorie-accessoires-bijoux")) {
    return "Accessoires & Bijoux";
  }
  if (
    normalized.has("ceremonie") ||
    normalized.has("mariage") ||
    normalized.has("categorie-ceremonie-mariage") ||
    normalized.has("sur-mesure")
  ) {
    return "Cérémonie & Mariage";
  }
  if (normalized.has("homme") || normalized.has("categorie-homme")) {
    return "Homme";
  }
  if (normalized.has("femme") || normalized.has("categorie-femme")) {
    return "Femme";
  }
  return null;
}

/** Libellé lisible d'une taille (identique en l'état, point d'extension futur). */
export function sizeLabel(size: string): string {
  return size;
}

/**
 * Préfixe des identifiants de variante du CATALOGUE DE RÉFÉRENCE (mode repli :
 * boutique injoignable). Ces identifiants ne proviennent PAS de Shopify — ils
 * ne peuvent donc pas être envoyés au panier. Les composants s'appuient sur ce
 * préfixe pour proposer une commande par contact plutôt qu'un bouton mort.
 */
export const MOCK_VARIANT_PREFIX = "mock-variant-";

/** Un identifiant de variante provient-il du catalogue de référence ? */
export function isMockVariantId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith(MOCK_VARIANT_PREFIX);
}

