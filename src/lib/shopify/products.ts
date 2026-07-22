// src/lib/shopify/products.ts
// Ce fichier = la couche de données. Il fait le pont entre
// les données brutes Shopify et les types normalisés de notre app.

import { shopifyFetch } from "./client";
import {
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_COLLECTION_PRODUCTS_QUERY,
  PRODUCT_CREATE_MUTATION,
  PRODUCT_PUBLISH_MUTATION,
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
 * Récupère les produits d'un créateur (via le vendor Shopify)
 * On cherche d'abord dans la DB les produits associés, puis on récupère les infos Shopify
 */
export async function getDesignerProducts(designerHandle: string) {
  // Récupère d'abord le designer pour avoir son shopifyVendorName
  const { db } = await import("@/lib/db");
  const designer = await db.designer.findUnique({
    where: { handle: designerHandle, status: "APPROVED" },
    include: {
      products: { select: { shopifyProductId: true } },
    },
  });

  if (!designer) return { products: [] };

  // Si on a des IDs en DB, on les récupère un par un
  const shopifyIds = designer.products.map(p => p.shopifyProductId);
  
  if (shopifyIds.length === 0) {
    // Fallback: cherche par vendor via la query
    return getDesignerProductsByVendor(designer.shopifyVendorName);
  }

  // Récupère les produits par leurs IDs
  const query = `
    query GetProductsByIds($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          handle
          title
          description
          descriptionHtml
          vendor
          tags
          availableForSale
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 6) {
            edges {
              node { url altText width height }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id title availableForSale
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyFetch<{ nodes: (ShopifyProduct | null)[] }>({
      query,
      variables: { ids: shopifyIds },
      tags: [`designer-${designerHandle}`],
      cache: "no-store",
    });
    
    const products = data.data.nodes
      .filter((p): p is ShopifyProduct => p !== null)
      .map(normalizeProduct);
    
    return { products };
  } catch {
    // Fallback
    return getDesignerProductsByVendor(designer.shopifyVendorName);
  }
}

/**
 * Cherche les produits Shopify par nom du vendeur (vendor)
 */
export async function getDesignerProductsByVendor(vendor: string) {
  const data = await shopifyFetch<{
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

/**
 * Crée un produit dans Shopify
 */
export async function createProduct({
  title,
  description,
  price,
  images,
  tags,
  vendor,
  status = "DRAFT",
}: {
  title: string;
  description: string;
  price: number;
  images: string[];
  tags: string[];
  vendor: string;
  status?: "ACTIVE" | "DRAFT";
}): Promise<{
  success: boolean;
  productId: string | null;
  error: string | null;
}> {
  const input: Record<string, unknown> = {
    title,
    descriptionHtml: description,
    vendor,
    tags,
    productType: "Fashion",
  };

  // Ajoute les images si fournies
  if (images.length > 0) {
    input.images = images.map((url) => ({ src: url }));
  }

  // Crée la variante avec le prix
  input.variants = [
    {
      price: price.toString(),
    },
  ];

  // Note: Shopify ne permet pas de créer un produit avec status=ACTIVE directement
  // Il faut créer en DRAFT puis publier via productPublish

  const data = await shopifyFetch<{
    productCreate: {
      product: { id: string; handle: string } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>({
    query: PRODUCT_CREATE_MUTATION,
    variables: { input },
    cache: "no-store",
  });

  const { product, userErrors } = data.data.productCreate;

  if (!product || userErrors.length > 0) {
    return {
      success: false,
      productId: null,
      error: userErrors[0]?.message ?? "Erreur lors de la création",
    };
  }

  // Si status=ACTIVE, publie le produit sur le canal Online Store
  if (status === "ACTIVE") {
    const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    if (storeDomain) {
      await shopifyFetch({
        query: PRODUCT_PUBLISH_MUTATION,
        variables: {
          id: product.id,
          channel: `https://${storeDomain}/admin/api/2024-01/channels`,
        },
        cache: "no-store",
      });
    }
  }

  return {
    success: true,
    productId: product.id,
    error: null,
  };
}
