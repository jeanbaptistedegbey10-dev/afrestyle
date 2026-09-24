// src/lib/collections.ts
// ────────────────────────────────────────────────────────────────────────────
//  Helpers partagés du catalogue /collections (Phase 5 — Luxe & Éditorial).
//  Utilisés à la fois par la page serveur et par l'API route /api/products
//  pour garantir une construction de requête Shopify strictement identique.
// ────────────────────────────────────────────────────────────────────────────

/** Nombre de produits chargés par page (initial + chaque "Découvrir plus"). */
export const COLLECTION_PAGE_SIZE = 12;

export type CollectionFilterParams = {
  gender?: string;  // clé canonique : ?gender=femme|homme|accessoire
  genre?: string;   // alias legacy (anciens liens accueil)
  category?: string; // alias legacy (ancien footer)
  pays?: string;
  tissu?: string;
  style?: string;
  sort?: string;
  q?: string;
};

/**
 * Résout la valeur du filtre genre quelle que soit l'écriture de l'URL.
 * Canonique : `gender` — alias acceptés : `genre`, `category`.
 */
export function resolveGender(
  params: Pick<CollectionFilterParams, "gender" | "genre" | "category">,
): string | undefined {
  return params.gender || params.genre || params.category;
}

/** Contrat de pagination cursor-based exposé à l'UI. */
export type CollectionPageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export const COLLECTION_SORT_MAP: Record<
  string,
  { sortKey: string; reverse: boolean; label: string }
> = {
  recent: { sortKey: "CREATED_AT", reverse: true, label: "Nouveautés" },
  populaire: { sortKey: "BEST_SELLING", reverse: false, label: "Populaire" },
  "prix-asc": { sortKey: "PRICE", reverse: false, label: "Prix croissant" },
  "prix-desc": { sortKey: "PRICE", reverse: true, label: "Prix décroissant" },
  // Aliases anglais acceptés par /shop (compatibilité des liens existants).
  "price-asc": { sortKey: "PRICE", reverse: false, label: "Prix croissant" },
  "price-desc": { sortKey: "PRICE", reverse: true, label: "Prix décroissant" },
};

export function resolveCollectionSort(sort?: string): {
  sortKey: string;
  reverse: boolean;
} {
  return COLLECTION_SORT_MAP[sort ?? "recent"] ?? COLLECTION_SORT_MAP.recent;
}

/**
 * Construit la query string de recherche Shopify depuis les filtres URL.
 * Convention de tags : `tag:<genre>`, `tag:pays-<pays>`, `tag:tissu-<x>`, `tag:style-<y>`.
 */
export function buildCollectionQuery(params: CollectionFilterParams): string {
  const parts: string[] = [];
  const genre = resolveGender(params);
  if (genre) parts.push(`tag:${genre}`);
  if (params.pays) parts.push(`tag:pays-${params.pays}`);
  if (params.tissu) parts.push(`tag:tissu-${params.tissu}`);
  if (params.style) parts.push(`tag:style-${params.style}`);
  if (params.q) parts.push(params.q);
  return parts.join(" ");
}

/**
 * Signature stable des filtres — utilisée comme React `key` sur le catalogue
 * client : chaque changement de filtre remonte le composant, ce qui
 * réinitialise la liste ET le curseur de pagination.
 */
export function filterSignature(params: CollectionFilterParams): string {
  return ["genre", "gender", "category", "pays", "tissu", "style", "sort", "q"]
    .map((k) => params[k as keyof CollectionFilterParams] ?? "")
    .join("|");
}

/** Ne conserve que les valeurs scalaires transmissibles à l'API route. */
export function toApiParams(
  params: CollectionFilterParams,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v) out[k] = v;
  }
  return out;
}
