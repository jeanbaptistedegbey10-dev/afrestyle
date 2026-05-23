// src/lib/shopify/products.ts
// Ce fichier = la couche de données. Il fait le pont entre
// les données brutes Shopify et les types normalisés de notre app.

import { shopifyFetch } from "./client";
import {
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_COLLECTION_PRODUCTS_QUERY,
} from "./queries/products";
import type { ShopifyProduct, Product } from "./types";

/**
 * Normalise un produit Shopify brut vers notre type Product
 *
 * Pourquoi normaliser ? Les données Shopify sont "edges/node" partout
 * (structure de pagination Relay). On les simplifie pour l'UI.
 */
function normalizeProduct(shopifyProduct: ShopifyProduct): Product {
  const price = shopifyProduct.priceRange.minVariantPrice;
  const amount = parseFloat(price.amount);

  // Formattage prix selon la devise
  const priceFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: price.currencyCode,
    minimumFractionDigits: 0,
  }).format(amount);

  // Extrait les métadonnées depuis les tags Shopify
  // Convention: on préfixe les tags → "pays-benin", "tissu-wax"
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

  return {
    id: shopifyProduct.id,
    handle: shopifyProduct.handle,
    title: shopifyProduct.title,
    description: shopifyProduct.description,
    price: price.amount,
    priceFormatted,
    compareAtPrice:
      shopifyProduct.variants.edges[0]?.node.compareAtPrice?.amount ?? null,
    images: shopifyProduct.images.edges.map((e) => e.node),
    variants: shopifyProduct.variants.edges.map((e) => e.node),
    vendor: shopifyProduct.vendor,
    tags: shopifyProduct.tags,
    country,
    fabric,
    style,
    availableForSale: shopifyProduct.availableForSale,
  };
}

/**
 * Récupère les produits avec filtres optionnels
 *
 * Shopify permet de filtrer via la query string:
 * - "tag:wax" → produits avec le tag wax
 * - "vendor:Adaeze" → produits du vendeur
 * - "product_type:robe" → par type
 * - combinés: "tag:wax tag:femme"
 */
export async function getProducts({
  first = 12,
  after,
  sortKey = "CREATED_AT",
  reverse = true,
  query,
}: {
  first?: number;
  after?: string;
  sortKey?: string;
  reverse?: boolean;
  query?: string;
} = {}) {
  const data = await shopifyFetch<{
    products: {
      edges: { node: ShopifyProduct; cursor: string }[];
      pageInfo: { hasNextPage: boolean; endCursor: string };
    };
  }>({
    query: GET_PRODUCTS_QUERY,
    variables: { first, after, sortKey, reverse, query },
    tags: ["products"],
  });

  return {
    products: data.data.products.edges.map((e) => normalizeProduct(e.node)),
    pageInfo: data.data.products.pageInfo,
  };
}

/**
 * Récupère un produit par son handle (slug URL)
 */
export async function getProductByHandle(handle: string) {
  const data = await shopifyFetch<{ product: ShopifyProduct | null }>({
    query: GET_PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    tags: [`product-${handle}`],
  });

  if (!data.data.product) return null;
  return normalizeProduct(data.data.product);
}

/**
 * Récupère les produits d'un créateur (via collection Shopify)
 */
export async function getDesignerProducts(designerHandle: string) {
  const data = await shopifyFetch<{
    collection: {
      id: string;
      title: string;
      description: string;
      image: { url: string; altText: string | null } | null;
      products: { edges: { node: ShopifyProduct }[] };
    } | null;
  }>({
    query: GET_COLLECTION_PRODUCTS_QUERY,
    variables: { handle: `designer-${designerHandle}`, first: 20 },
    tags: [`designer-${designerHandle}`],
  });

  return data.data.collection;
}
