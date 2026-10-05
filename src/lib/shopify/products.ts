// src/lib/shopify/products.ts
// Ce fichier = la couche de donnÃ©es. Il fait le pont entre
// les donnÃ©es brutes Shopify et les types normalisÃ©s de notre app.
//
// RÃˆGLE D'OR â€” deux clients, deux usages :
//   â€¢ LECTURES  â†’ storefrontFetch() â†’ /api/<version>/graphql.json         (public)
//   â€¢ Ã‰CRITURES â†’ adminFetch()      â†’ /admin/api/<version>/graphql.json   (serveur)
//
// Une mutation d'administration envoyÃ©e au Storefront est rejetÃ©e par le
// schÃ©ma ("Field 'productCreate' doesn't exist on type 'Mutation'") : c'Ã©tait
// le bug d'origine (createProduct + productPublish visant l'endpoint public).

import { adminFetch } from "./adminClient";
import { LOOKBOOK_TAG } from "@/constants/catalog";
import { formatPrice } from "@/lib/utils";
import {
  getMockCatalogProductByHandle,
  getMockCatalogProducts,
  getMockLookbookProducts,
  getProductEnrichment,
  filterMockCatalog,
  type CatalogEnrichment,
} from "./mock-data";
import {
  formatUserErrors,
  toErrorMessage,
  type ShopifyUserError,
} from "./errors";
import { storefrontFetch } from "./storefrontClient";
import {
  GET_COLLECTIONS_QUERY,
  GET_COLLECTION_PRODUCTS_QUERY,
  GET_ONLINE_STORE_PUBLICATION_QUERY,
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_SITEMAP_PRODUCTS_QUERY,
  PRODUCT_CREATE_MUTATION,
  PRODUCT_VARIANT_PRICE_UPDATE_MUTATION,
  PUBLISHABLE_PUBLISH_MUTATION,
} from "./queries/products";
import type {
  ShopifyCollectionHandle,
  ShopifyImage,
  ShopifyProduct,
  ShopifySitemapProduct,
  Product,
} from "./types";
/**
 * Paramètres optionnels de requête produit (Storefront API).
 * Remplace l'ancien `MockQuery` importé depuis `@/data/products` (supprimé).
 */
export type GetProductsQuery = {
  first?: number;
  after?: string;
  sortKey?: string;
  reverse?: boolean;
  query?: string;
  /**
   * Politique de cache de la requête Storefront.
   * Par défaut `storefrontFetch` conserve `"force-cache"` (comportement
   * historique du catalogue) ; passer `"no-store"` pour une lecture qui doit
   * refléter immédiatement la boutique (lookbook éditorial).
   * ⚠️ Ne jamais combiner `"no-store"` avec une `revalidate` > 0 (conflit
   * signalé par Next).
   */
  cache?: RequestCache;
  /** Délai ISR en secondes (`false` = cache illimité) — `next.revalidate`. */
  revalidate?: number | false;
};

/**
 * Normalise un produit Shopify brut vers notre type Product
 *
 * Pourquoi normaliser ? Les donnÃ©es Shopify sont "edges/node" partout
 * (structure de pagination Relay). On les simplifie pour l'UI.
 */
const PRODUCT_IMAGE_ROLES = ["overview", "detail", "lifestyle"] as const;

type ProductImageRole = (typeof PRODUCT_IMAGE_ROLES)[number];

function plainText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function metafieldValue(
  metafields: ShopifyProduct["metafields"],
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = plainText(
      metafields?.find((metafield) => metafield?.key === key)?.value,
    );
    if (value) return value;
  }
  return null;
}

function parseImageRoles(value: string | null): ProductImageRole[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((role): role is ProductImageRole =>
      PRODUCT_IMAGE_ROLES.includes(role as ProductImageRole),
    );
  } catch {
    return [];
  }
}

/**
 * Nettoie une valeur d'option telle qu'elle est saisie dans Shopify Admin.
 *
 * ⚠️ Bug de données constaté sur la boutique : l'échelle de tailles était
 * saisie « XS, » (virgule collée). La puce s'affichait donc « XS, » et la
 * correspondance exacte de variante restait introuvable — la taille XS
 * apparaissait systématiquement épuisée. On retire ici les séparateurs
 * résiduels et les espaces parasites.
 */
function normalizeOptionValue(value: string): string {
  return value
    .replace(/[,;|/]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Valeurs d'option normalisées, dédoublonnées, sans entrée vide. */
function normalizeOptionValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = normalizeOptionValue(raw);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/** Fusionne deux listes d'URLs de visuels sans doublon (ordre préservé). */
function uniqueImageUrls(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Tags dédoublonnés (comparaison insensible à la casse), ordre préservé. */
function uniqueTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const key = tag.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(tag.trim());
  }
  return out;
}

/** Vrai si l'option décrit une taille de vêtement (variantes réelles exigées). */
export function isSizeOption(name: string): boolean {
  return /^(taille|size|tailles|sizes)$/i.test(name.trim());
}


function normalizeProduct(shopifyProduct: ShopifyProduct): Product {
  const price = shopifyProduct.priceRange.minVariantPrice;

  // Formattage prix — devise d'affichage harmonisée (EUR, cf. src/constants/store.ts).
  const priceFormatted = formatPrice(price.amount);

  // Extrait les mÃ©tadonnÃ©es depuis les tags Shopify
  // Convention: on prÃ©fixe les tags â†’ "pays-benin", "tissu-wax"
  const country =
    shopifyProduct.tags
      .find((t) => t.startsWith("pays-"))
      ?.replace("pays-", "") ?? null;

  const fabric =
    shopifyProduct.tags
      .find((t) => t.startsWith("tissu-"))
      ?.replace("tissu-", "") ?? null;

  const style =
    shopifyProduct.tags
      .find((t) => t.startsWith("style-"))
      ?.replace("style-", "") ?? null;

  // Options : source de vérité = `product.options` (Storefront API).
  // Fallback : reconstruction depuis les variantes (boutiques sans `options`).
  // Dans les deux cas les valeurs sont normalisées (cf. « XS, » ci-dessus) et
  // dédoublonnées : la sélection exacte de variante redevient fiable.
  const options =
    shopifyProduct.options && shopifyProduct.options.length > 0
      ? shopifyProduct.options
          .filter(
            (option) =>
              !(option.values.length === 1 && option.values[0] === "Default Title"),
          )
          .map((option) => ({
            name: option.name,
            values: normalizeOptionValues(option.values),
          }))
      : (() => {
          const map = new Map<string, string[]>();
          for (const edge of shopifyProduct.variants.edges) {
            for (const selected of edge.node.selectedOptions) {
              if (selected.value === "Default Title") continue;
              const current = map.get(selected.name) ?? [];
              current.push(selected.value);
              map.set(selected.name, current);
            }
          }
          return [...map.entries()].map(([name, values]) => ({
            name,
            values: normalizeOptionValues(values),
          }));
        })();

  // ── Enrichissement éditorial du catalogue (mock-data.ts) ─────────────────
  // La boutique reste la source de vérité du prix, des variantes et du stock ;
  // le catalogue de référence ajoute la galerie Unsplash, la courte
  // description, la longue description structurée, la catégorie et le tag
  // `lookbook` qui alimente la section éponyme.
  const enrichment: CatalogEnrichment = getProductEnrichment({
    handle: shopifyProduct.handle,
    tags: shopifyProduct.tags,
  });

  const description = plainText(shopifyProduct.description);
  const metafieldShort = metafieldValue(shopifyProduct.metafields, [
    "short_description",
    "description_short",
  ]);
  const shortDescription =
    metafieldShort ??
    enrichment.shortDescription ??
    (description
      ? `${description.slice(0, 180)}${description.length > 180 ? "…" : ""}`
      : null);

  const imageRoles = parseImageRoles(
    metafieldValue(shopifyProduct.metafields, ["image_roles"]),
  );

  // Galerie : les visuels RÉELS publiés dans Shopify font foi. Les rôles
  // `overview` / `detail` / `lifestyle` proviennent du metafield `image_roles`,
  // aligné sur l'ordre des médias — c'est ce qui permet à <ProductCard /> de
  // changer d'image au survol et à la fiche d'afficher un badge de vue.
  //
  // On filtre APRÈS le map : l'index de rôle doit rester aligné sur l'ordre
  // des médias Shopify même si un média arrive sans URL exploitable.
  const shopifyImages = shopifyProduct.images.edges
    .map((edge, index) => ({
      ...edge.node,
      role: imageRoles[index] ?? null,
    }))
    .filter((image) => Boolean(image.url));

  // ⚠️ La galerie éditoriale (placeholders SVG locaux) ne sert QUE de filet de
  // sécurité quand la pièce ne publie AUCUN média. Elle ne complète JAMAIS une
  // galerie existante : la concaténer gonflait la fiche produit jusqu'à 6
  // vignettes (compteur « 1/6 ») et faisait basculer les cartes produit sur un
  // placeholder SVG au survol. Shopify reste la seule source de vérité.
  const galleryUrls =
    shopifyImages.length > 0
      ? uniqueImageUrls(shopifyImages.map((image) => image.url))
      : uniqueImageUrls(enrichment.gallery);

  const images = galleryUrls.map((url, index) => {
    const existing = shopifyImages.find((image) => image.url === url);
    if (existing) return existing;
    return {
      url,
      altText: `${shopifyProduct.title} — vue ${index + 1} du catalogue AfroStyle.`,
      width: 1000,
      height: 1500,
      role:
        index === 0
          ? ("overview" as const)
          : index === 1
            ? ("detail" as const)
            : ("lifestyle" as const),
    };
  });

  const descriptionSections = {
    materialOrigin:
      metafieldValue(shopifyProduct.metafields, ["material_origin"]) ??
      enrichment.descriptionSections?.materialOrigin ??
      null,
    cutAndMaking:
      metafieldValue(shopifyProduct.metafields, ["cut_and_making"]) ??
      enrichment.descriptionSections?.cutAndMaking ??
      null,
    care:
      metafieldValue(shopifyProduct.metafields, ["care_instructions"]) ??
      enrichment.descriptionSections?.care ??
      null,
    sizeAndDelivery:
      metafieldValue(shopifyProduct.metafields, ["size_and_delivery"]) ??
      enrichment.descriptionSections?.sizeAndDelivery ??
      null,
  };

  return {
    id: shopifyProduct.id,
    handle: shopifyProduct.handle,
    title: shopifyProduct.title,
    description,
    price: price.amount,
    priceFormatted,
    currencyCode: price.currencyCode,
    compareAtPrice:
      shopifyProduct.variants.edges[0]?.node.compareAtPrice?.amount ?? null,
    images,
    shortDescription,
    descriptionSections,
    variants: shopifyProduct.variants.edges.map((e) => e.node),
    options,
    vendor: shopifyProduct.vendor,
    // Tags Shopify + tags de catalogue (catégorie, `lookbook`).
    tags: uniqueTags([...shopifyProduct.tags, ...enrichment.tags]),
    country,
    fabric,
    style,
    availableForSale: shopifyProduct.availableForSale,
    rating: enrichment.rating,
    madeToMeasure: enrichment.madeToMeasure ?? false,
  };
}

/**
 * RÃ©cupÃ¨re les produits avec filtres optionnels
 *
 * Shopify permet de filtrer via la query string:
 * - "tag:wax" â†’ produits avec le tag wax
 * - "vendor:Adaeze" â†’ produits du vendeur
 * - "product_type:robe" â†’ par type
 * - combinÃ©s: "tag:wax tag:femme"
 */
export async function getProducts({
  first = 12,
  after,
  sortKey = "CREATED_AT",
  reverse = true,
  query,
  cache,
  revalidate,
}: GetProductsQuery = {}): Promise<{
  products: Product[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}> {
  /**
   * Catalogue de repli : servi UNIQUEMENT quand la boutique est injoignable
   * (réseau, token, boutique hors ligne) ou qu'elle ne publie aucune pièce.
   * Une requête filtrée légitimement vide (« aucun wax en XXL ») reste vide :
   * afficher des pièces non concernées serait une information fausse.
   */
  const mockFallback = (reason: string) => {
    console.warn(
      `[shopify:products] ${reason} — catalogue de référence (mock-data.ts) servi en repli.`,
    );
    return {
      products: filterMockCatalog({ query, first }),
      pageInfo: { hasNextPage: false, endCursor: null },
    };
  };

  try {
    const data = await storefrontFetch<{
      products: {
        edges: { node: ShopifyProduct; cursor: string }[];
        pageInfo: { hasNextPage: boolean; endCursor: string };
      };
    }>({
      query: GET_PRODUCTS_QUERY,
      variables: { first, after, sortKey, reverse, query },
      tags: ["products"],
      cache,
      revalidate,
    });

    const products = data.data.products.edges.map((e) =>
      normalizeProduct(e.node),
    );

    if (products.length === 0 && !query) {
      return mockFallback("la boutique ne publie aucune pièce");
    }

    return {
      products,
      pageInfo: data.data.products.pageInfo,
    };
  } catch (error) {
    return mockFallback(`Storefront indisponible (${toErrorMessage(error)})`);
  }
}

/**
 * Récupère un produit par son handle (slug URL).
 *
 * Repli : un handle absent de la boutique mais présent dans le catalogue de
 * référence reste consultable — la fiche produit ne tombe jamais en 404 du
 * seul fait d'une boutique muette.
 */
export async function getProductByHandle(handle: string): Promise<Product | null> {
  try {
    const data = await storefrontFetch<{ product: ShopifyProduct | null }>({
      query: GET_PRODUCT_BY_HANDLE_QUERY,
      variables: { handle },
      tags: [`product-${handle}`],
    });

    if (data.data.product) return normalizeProduct(data.data.product);
  } catch (error) {
    console.warn(
      `[shopify:product] ${handle} illisible (${toErrorMessage(error)}) — repli sur le catalogue de référence.`,
    );
  }

  return getMockCatalogProductByHandle(handle);
}

/**
 * RÃ©cupÃ¨re une collection et ses produits (Storefront API)
 *
 * Utile pour les pages Ã©ditoriales ("shopper le look") quand
 * l'assortiment est pilotÃ© par des collections Shopify.
 */
export async function getCollectionProducts({
  handle,
  first = 12,
  after,
  cache,
  revalidate,
}: {
  handle: string;
  first?: number;
  /** Cf. `GetProductsQuery.cache` — `"no-store"` pour un rendu toujours frais. */
  cache?: RequestCache;
  /** Délai ISR en secondes — `next.revalidate`. */
  revalidate?: number | false;
  /** Curseur de pagination (endCursor de la page prÃ©cÃ©dente). */
  after?: string;
}) {
  const data = await storefrontFetch<{
    collection: {
      title: string;
      description: string;
      image: (ShopifyProduct["images"]["edges"][0]["node"] | null) | null;
      products: {
        edges: { node: ShopifyProduct; cursor: string }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } | null;
  }>({
    query: GET_COLLECTION_PRODUCTS_QUERY,
    variables: { handle, first, after },
    tags: [`collection-${handle}`],
    cache,
    revalidate,
  });

  const collection = data.data.collection;
  if (!collection) return null;

  return {
    collection: {
      title: collection.title,
      description: collection.description,
      image: collection.image,
    },
    products: collection.products.edges.map((edge) =>
      normalizeProduct(edge.node),
    ),
    pageInfo: collection.products.pageInfo,
  };
}

// ───────────────────────────────────────────────────────────────────────────
//  LOOKBOOK ÉDITORIAL — alimenté par une VRAIE collection Shopify
//  Aucune donnée codée en dur : titres, visuels principaux et prix proviennent
//  toujours de la Storefront API. Source unique pour /lookbook et l'aperçu de
//  la page d'accueil.
// ───────────────────────────────────────────────────────────────────────────

/** Nombre de pièces éditoriales affichées dans le lookbook. */
export const LOOKBOOK_PRODUCT_LIMIT = 12;

/**
 * Handle de la collection Shopify qui pilote le lookbook.
 * Surchargeable sans redéploiement via `SHOPIFY_LOOKBOOK_COLLECTION_HANDLE`
 * (Shopify Admin → Produits → Collections, collection visible sur le canal
 * Storefront) ; par défaut « lookbook ».
 */
export function getLookbookCollectionHandle(): string {
  return process.env.SHOPIFY_LOOKBOOK_COLLECTION_HANDLE?.trim() || "lookbook";
}

/** Collection Shopify réellement consommée par le lookbook. */
export type LookbookCollection = {
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
};

export type LookbookData = {
  products: Product[];
  /**
   * `null` quand la collection dédiée est absente ou vide : le lookbook
   * affiche alors les dernières pièces publiées, et l'UI le dit explicitement.
   */
  collection: LookbookCollection | null;
};

/**
 * Source de données UNIQUE du lookbook.
 *
 * Pourquoi `cache: "no-store"` ?
 *  • Les visuels produits sont ré-uploadés dans Shopify Admin sous la MÊME URL
 *    (`/files/…jpg?v=…`) : un `force-cache` fige la page jusqu'au prochain
 *    build. C'était la cause du bug : les tuiles affichaient le visuel de repli
 *    alors que les images Shopify étaient bien disponibles dans l'admin.
 *  • Pour une vitrine éditoriale, l'ISR ne suffit pas : on veut le reflet exact
 *    de la boutique à chaque requête (complété par `/api/revalidate` pour les
 *    plateformes qui s'appuient sur le cache).
 *
 * Repli : collection absente ou vide → pièces publiées les plus récentes.
 */
export async function getLookbookProducts({
  first = LOOKBOOK_PRODUCT_LIMIT,
}: {
  first?: number;
} = {}): Promise<LookbookData> {
  const handle = getLookbookCollectionHandle();

  const merged: Product[] = [];
  const seen = new Set<string>();
  const push = (products: Product[]) => {
    for (const product of products) {
      if (merged.length >= first) return;
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      merged.push(product);
    }
  };

  // 1. Collection éditoriale dédiée (« lookbook ») — première source.
  let collection: LookbookCollection | null = null;
  try {
    const data = await getCollectionProducts({
      handle,
      first,
      cache: "no-store",
    });

    if (data && data.products.length > 0) {
      collection = {
        handle,
        title: data.collection.title,
        description: data.collection.description,
        image: data.collection.image,
      };
      push(data.products);
    }
  } catch (error) {
    console.warn(
      `[shopify:lookbook] collection "${handle}" illisible (${toErrorMessage(error)}) — repli sur le tag.`,
    );
  }

  // 2. Complète avec les pièces du catalogue portant le tag `lookbook`.
  //    Ce tag est posé par le catalogue de référence (mock-data.ts) sur chaque
  //    création : la sélection n'est donc jamais figée dans un composant.
  if (merged.length < first) {
    try {
      const { products } = await getProducts({
        first: Math.max(first * 2, 24),
        cache: "no-store",
      });
      push(products.filter((product) => product.tags.includes(LOOKBOOK_TAG)));
    } catch (error) {
      console.warn(
        `[shopify:lookbook] catalogue illisible (${toErrorMessage(error)}) — repli sur le catalogue de référence.`,
      );
    }
  }

  // 3. Dernier palier : le catalogue de référence (jamais d'écran vide).
  if (merged.length === 0) {
    return { products: getMockLookbookProducts(first), collection: null };
  }

  return { products: merged.slice(0, first), collection };
}

/**
 * Cherche les produits Shopify par nom du vendeur (vendor).
 * UtilisÃ© en mono-marque pour filtrer le catalogue d'un vendor unique.
 */
export async function getProductsByVendor(vendor: string) {
  const data = await storefrontFetch<{
    products: {
      edges: { node: ShopifyProduct }[];
    };
  }>({
    query: GET_PRODUCTS_QUERY,
    variables: { first: 20, query: `vendor:"${vendor}"` },
    tags: [`vendor-${vendor}`],
  });

  return {
    products: data.data.products.edges.map((e) => normalizeProduct(e.node)),
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SITEMAP (Phase 6 â€” SEO technique avancÃ©)
//  RequÃªtes lÃ©gÃ¨res + pagination curseur pour lister TOUS les handles sans
//  charger variantes/images. Tags dÃ©diÃ©s : "sitemap-products" / "collections".
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type SitemapPageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

/**
 * Liste les produits publiÃ©s (handles + dates de MAJ) pour le sitemap.
 * Paginer cÃ´tÃ© appelant si le catalogue dÃ©passe `first` (dÃ©faut 250, max 250).
 */
export async function getSitemapProducts({
  first = 250,
  after,
}: {
  first?: number;
  after?: string;
} = {}): Promise<ShopifySitemapProduct[]> {
  const data = await storefrontFetch<{
    products: {
      edges: { node: ShopifySitemapProduct; cursor: string }[];
      pageInfo: SitemapPageInfo;
    };
  }>({
    query: GET_SITEMAP_PRODUCTS_QUERY,
    variables: { first: Math.min(Math.max(first, 1), 250), after },
    tags: ["sitemap-products", "products"],
  });

  const products = data.data.products.edges.map((e) => e.node);
  const pageInfo = data.data.products.pageInfo;

  if (pageInfo.hasNextPage && pageInfo.endCursor) {
    const rest = await getSitemapProducts({
      first,
      after: pageInfo.endCursor,
    });
    return [...products, ...rest];
  }

  return products;
}

/**
 * Liste les collections actives (handles + dates de MAJ) pour le sitemap.
 */
export async function getCollectionHandles({
  first = 100,
  after,
}: {
  first?: number;
  after?: string;
} = {}): Promise<ShopifyCollectionHandle[]> {
  const data = await storefrontFetch<{
    collections: {
      edges: { node: ShopifyCollectionHandle; cursor: string }[];
      pageInfo: SitemapPageInfo;
    };
  }>({
    query: GET_COLLECTIONS_QUERY,
    variables: { first: Math.min(Math.max(first, 1), 250), after },
    tags: ["collections"],
  });

  const collections = data.data.collections.edges.map((e) => e.node);
  const pageInfo = data.data.collections.pageInfo;

  if (pageInfo.hasNextPage && pageInfo.endCursor) {
    const rest = await getCollectionHandles({
      first,
      after: pageInfo.endCursor,
    });
    return [...collections, ...rest];
  }

  return collections;
}
/**
 * Liste complète des produits publiés avec images et variantes.
 * Pagination cursor-based : récupère toutes les pages jusqu'à `pageInfo.hasNextPage === false`.
 *
 * Usage typique pour la roadmap visuels :
 * - export catalogue complet (handles, titres, vendor, images, tags)
 * - préparation des visuels de la page d'accueil / lookbook / sections
 */
export async function fetchAllProductsCatalog({
  first = 250,
  after,
}: {
  first?: number;
  after?: string;
} = {}): Promise<{
  products: {
    id: string;
    handle: string;
    title: string;
    vendor: string;
    tags: string[];
    availableForSale: boolean;
    // Une image produit suffit pour l'extraction catalogue, mais on garde
    // la compatibilité avec les galeries existantes.
    images: Array<{ url: string; altText: string | null; width: number; height: number }>;
    // Image de variante si présente (utile pour les visuels variante)
    variants: Array<{
      id: string;
      title: string;
      availableForSale: boolean;
      image: { url: string; altText: string | null; width: number; height: number } | null;
    }>;
  }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}> {
  const data = await storefrontFetch<{
    products: {
      edges: {
        node: ShopifyProduct;
        cursor: string;
      }[];
      pageInfo: { hasNextPage: boolean; endCursor: string };
    };
  }>({
    query: GET_PRODUCTS_QUERY,
    variables: { first: Math.min(Math.max(first, 1), 250), after },
    tags: ["products", "catalog"],
  });

  const products = data.data.products.edges.map((e) => ({
    id: e.node.id,
    handle: e.node.handle,
    title: e.node.title,
    vendor: e.node.vendor,
    tags: e.node.tags,
    availableForSale: e.node.availableForSale,
    images: e.node.images.edges.map((edge) => edge.node),
    variants: e.node.variants.edges.map((edge) => ({
      id: edge.node.id,
      title: edge.node.title,
      availableForSale: edge.node.availableForSale,
      image: edge.node.image,
    })),
  }));

  const pageInfo = data.data.products.pageInfo;

  if (pageInfo.hasNextPage && pageInfo.endCursor) {
    const rest = await fetchAllProductsCatalog({ first, after: pageInfo.endCursor });
    return {
      products: [...products, ...rest.products],
      pageInfo: rest.pageInfo,
    };
  }

  return { products, pageInfo };
}

/**
 * Catalogue complet consommé par la vitrine (visuels d'accueil, seed, routes
 * d'API internes).
 *
 * Repli : si la Storefront API est injoignable, on renvoie le catalogue de
 * référence (mock-data.ts) au même format — les pages restent consultables et
 * aucun appelant n'a besoin de gérer une exception.
 */
export async function getAllProductsCatalog({
  first = 250,
  after,
}: {
  first?: number;
  after?: string;
} = {}): Promise<Awaited<ReturnType<typeof fetchAllProductsCatalog>>> {
  try {
    return await fetchAllProductsCatalog({ first, after });
  } catch (error) {
    console.warn(
      `[shopify:catalog] extraction impossible (${toErrorMessage(error)}) — catalogue de référence servi en repli.`,
    );
    return getMockAllProductsCatalog(first);
  }
}

/**
 * Catalogue de secours (Shopify muet) — extraction au même format que
 * `getAllProductsCatalog`, alimentée par le catalogue de référence.
 *
 * Utilisé par les routes d'API internes (`/api/product-visuals`, seed…) qui ne
 * doivent jamais échouer sur une boutique injoignable.
 */
export function getMockAllProductsCatalog(first: number = 250) {
  const products = getMockCatalogProducts().slice(0, first).map((product) => ({
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    tags: product.tags,
    availableForSale: product.availableForSale,
    images: product.images.map((image) => ({
      url: image.url,
      altText: image.altText,
      width: image.width,
      height: image.height,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      availableForSale: variant.availableForSale,
      image: variant.image,
    })),
  }));

  return {
    products,
    pageInfo: { hasNextPage: false, endCursor: null as string | null },
  };
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  Ã‰CRITURES (Admin API) â€” jamais sur l'endpoint Storefront
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type CreateProductInput = {
  title: string;
  description: string;
  price: number;
  images: string[];
  tags: string[];
  vendor: string;
  /** DRAFT par dÃ©faut : validation manuelle par l'admin. */
  status?: "ACTIVE" | "DRAFT";
  /** Type de produit Shopify (dÃ©faut "Fashion"). */
  productType?: string;
};

export type CreateProductResult = {
  success: boolean;
  /** ID Shopify du produit crÃ©Ã© â€” renseignÃ© mÃªme si une Ã©tape suivante Ã©choue. */
  productId: string | null;
  handle: string | null;
  error: string | null;
  /** Ã‰tapes non bloquantes qui ont Ã©chouÃ© (prix, publication). */
  warnings: string[];
};

type ProductCreatePayload = {
  productCreate: {
    product: {
      id: string;
      handle: string;
      variants: { nodes: { id: string }[] } | null;
    } | null;
    userErrors: ShopifyUserError[];
  };
};

type ProductVariantsBulkUpdatePayload = {
  productVariantsBulkUpdate: { userErrors: ShopifyUserError[] };
};

type PublishablePublishPayload = {
  publishablePublish: { userErrors: ShopifyUserError[] };
};

/**
 * CrÃ©e un produit dans Shopify â€” **Admin API** (jamais le Storefront).
 *
 * DÃ©roulÃ© en 3 Ã©tapes, toutes sur `/admin/api/<version>/graphql.json` :
 *   1. `productCreate(product:, media:)` â†’ produit + images, statut DRAFT/ACTIVE
 *   2. `productVariantsBulkUpdate`        â†’ prix de la variante par dÃ©faut
 *   3. `publishablePublish`               â†’ publication Online Store si ACTIVE
 */
export async function createProduct({
  title,
  description,
  price,
  images,
  tags,
  vendor,
  status = "DRAFT",
  productType = "Fashion",
}: CreateProductInput): Promise<CreateProductResult> {
  const warnings: string[] = [];

  // 1. CrÃ©ation du produit.
  //    `ProductCreateInput` n'accepte NI `variants` NI `images` : les images
  //    passent par l'argument `media` (CreateMediaInput) et Shopify crÃ©e
  //    automatiquement une variante par dÃ©faut Ã  0,00 â†’ corrigÃ© Ã  l'Ã©tape 2.
  const product: Record<string, unknown> = {
    title,
    descriptionHtml: description,
    vendor,
    tags,
    productType,
    status,
  };

  const media = images
    .filter(Boolean)
    .map((url) => ({ originalSource: url, mediaContentType: "IMAGE", alt: title }));

  const createPayload = await adminFetch<ProductCreatePayload>({
    query: PRODUCT_CREATE_MUTATION,
    variables: { product, media: media.length > 0 ? media : null },
  });

  const { product: created, userErrors } = createPayload.productCreate;

  if (!created || userErrors.length > 0) {
    return {
      success: false,
      productId: null,
      handle: null,
      error: formatUserErrors(userErrors, "Erreur lors de la crÃ©ation"),
      warnings,
    };
  }

  // 2. Prix de la variante par dÃ©faut (productCreate ne l'applique pas).
  const defaultVariantId = created.variants?.nodes?.[0]?.id;

  if (!Number.isFinite(price) || price <= 0) {
    warnings.push(`Prix ignorÃ© (valeur reÃ§ue : ${price}).`);
  } else if (!defaultVariantId) {
    warnings.push(
      "Aucune variante par dÃ©faut retournÃ©e par Shopify â€” prix non appliquÃ©.",
    );
  } else {
    try {
      const pricePayload = await adminFetch<ProductVariantsBulkUpdatePayload>({
        query: PRODUCT_VARIANT_PRICE_UPDATE_MUTATION,
        variables: {
          productId: created.id,
          variants: [{ id: defaultVariantId, price: price.toFixed(2) }],
        },
      });

      const priceErrors = pricePayload.productVariantsBulkUpdate.userErrors;

      if (priceErrors.length > 0) {
        return {
          success: false,
          productId: created.id,
          handle: created.handle,
          error: `Produit crÃ©Ã© mais prix non appliquÃ© : ${formatUserErrors(priceErrors)}`,
          warnings,
        };
      }
    } catch (error) {
      return {
        success: false,
        productId: created.id,
        handle: created.handle,
        error: `Produit crÃ©Ã© mais prix non appliquÃ© : ${toErrorMessage(error)}`,
        warnings,
      };
    }
  }

  // 3. Publication sur le canal Â« Online Store Â» si le produit doit Ãªtre visible.
  if (status === "ACTIVE") {
    try {
      const publicationId = await getOnlineStorePublicationId();

      if (!publicationId) {
        warnings.push(
          "Produit ACTIVE mais non publiÃ© : publication Â« Online Store Â» introuvable " +
            "(dÃ©finir SHOPIFY_ONLINE_STORE_PUBLICATION_ID dans .env.local).",
        );
      } else {
        const publishPayload = await adminFetch<PublishablePublishPayload>({
          query: PUBLISHABLE_PUBLISH_MUTATION,
          variables: { id: created.id, publicationId },
        });

        const publishErrors = publishPayload.publishablePublish.userErrors;

        if (publishErrors.length > 0) {
          warnings.push(
            `Produit ACTIVE mais non publiÃ© : ${formatUserErrors(publishErrors)}`,
          );
        }
      }
    } catch (error) {
      warnings.push(`Produit ACTIVE mais non publiÃ© : ${toErrorMessage(error)}`);
    }
  }

  for (const warning of warnings) {
    console.warn(`[shopify:createProduct] ${warning}`);
  }

  return {
    success: true,
    productId: created.id,
    handle: created.handle,
    error: null,
    warnings,
  };
}

/**
 * RÃ©sout l'ID de la publication Â« Online Store Â» (mÃ©moÃ¯sÃ© par process).
 *
 * Pourquoi : `productPublish(id, channel: String!)` est dÃ©prÃ©ciÃ©, et son
 * ancien argument `channel` recevait une URL d'endpoint qui n'existe dans
 * aucun schÃ©ma. La publication passe dÃ©sormais par `publishablePublish`, qui
 * exige un vrai `publicationId`.
 *
 * Ordre de rÃ©solution :
 *   1. `SHOPIFY_ONLINE_STORE_PUBLICATION_ID` (explicite â€” recommandÃ© en prod) ;
 *   2. la publication dont le nom ressemble Ã  Â« Online Store / Boutique en ligne Â» ;
 *   3. la seule publication du shop (boutique mono-canal).
 */
let cachedOnlineStorePublicationId: string | null = null;

export async function getOnlineStorePublicationId(): Promise<string | null> {
  const fromEnv = process.env.SHOPIFY_ONLINE_STORE_PUBLICATION_ID?.trim();
  if (fromEnv) return fromEnv;

  if (cachedOnlineStorePublicationId) return cachedOnlineStorePublicationId;

  const payload = await adminFetch<{
    publications: { nodes: { id: string; name: string }[] };
  }>({
    query: GET_ONLINE_STORE_PUBLICATION_QUERY,
    variables: { first: 20 },
  });

  const publications = payload.publications.nodes;

  const onlineStore =
    publications.find((node) => /online store|boutique en ligne/i.test(node.name)) ??
    (publications.length === 1 ? publications[0] : null);

  cachedOnlineStorePublicationId = onlineStore?.id ?? null;
  return cachedOnlineStorePublicationId;
}
