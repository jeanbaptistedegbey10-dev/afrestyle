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
import { formatPrice } from "@/lib/utils";
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

  // Options : source de vÃ©ritÃ© = `product.options` (Storefront API).
  // Fallback : reconstruction depuis les variantes (boutiques sans `options`,
  // ou payloads mockÃ©s en dev). On filtre "Default Title" (produit sans option).
  const options =
    shopifyProduct.options && shopifyProduct.options.length > 0
      ? shopifyProduct.options
          .filter((o) => !(o.values.length === 1 && o.values[0] === "Default Title"))
          .map((o) => ({ name: o.name, values: [...o.values] }))
      : (() => {
          const map = new Map<string, Set<string>>();
          for (const edge of shopifyProduct.variants.edges) {
            for (const o of edge.node.selectedOptions) {
              if (o.value === "Default Title") continue;
              if (!map.has(o.name)) map.set(o.name, new Set());
              map.get(o.name)!.add(o.value);
            }
          }
          return [...map.entries()].map(([name, values]) => ({
            name,
            values: [...values],
          }));
        })();

  return {
    id: shopifyProduct.id,
    handle: shopifyProduct.handle,
    title: shopifyProduct.title,
    description: shopifyProduct.description,
    price: price.amount,
    priceFormatted,
    currencyCode: price.currencyCode,
    compareAtPrice:
      shopifyProduct.variants.edges[0]?.node.compareAtPrice?.amount ?? null,
    images: shopifyProduct.images.edges.map((e) => e.node),
    variants: shopifyProduct.variants.edges.map((e) => e.node),
    options,
    vendor: shopifyProduct.vendor,
    tags: shopifyProduct.tags,
    country,
    fabric,
    style,
    availableForSale: shopifyProduct.availableForSale,
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

  return {
    products,
    pageInfo: data.data.products.pageInfo,
  };
}

/**
 * RÃ©cupÃ¨re un produit par son handle (slug URL)
 */
export async function getProductByHandle(handle: string) {
  const data = await storefrontFetch<{ product: ShopifyProduct | null }>({
    query: GET_PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    tags: [`product-${handle}`],
  });

  if (!data.data.product) return null;
  return normalizeProduct(data.data.product);
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

  try {
    const data = await getCollectionProducts({
      handle,
      first,
      cache: "no-store",
    });

    if (data && data.products.length > 0) {
      return {
        products: data.products,
        collection: {
          handle,
          title: data.collection.title,
          description: data.collection.description,
          image: data.collection.image,
        },
      };
    }
  } catch (error) {
    console.warn(
      `[shopify:lookbook] collection "${handle}" illisible (${toErrorMessage(error)}) — repli sur le catalogue publié.`,
    );
  }

  const { products } = await getProducts({ first, cache: "no-store" });
  return { products, collection: null };
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
export async function getAllProductsCatalog({
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
    const rest = await getAllProductsCatalog({ first, after: pageInfo.endCursor });
    return {
      products: [...products, ...rest.products],
      pageInfo: rest.pageInfo,
    };
  }

  return { products, pageInfo };
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
