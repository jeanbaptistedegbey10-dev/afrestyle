// src/lib/shopify/queries/products.ts

// Pourquoi GraphQL et pas REST ?
// GraphQL permet de demander EXACTEMENT les champs dont on a besoin.
// Pas de sur-fetching (recevoir 50 champs quand on en a besoin de 5).
// En entretien: c'est un argument fort pour la performance.

export const PRODUCT_FRAGMENT = `
  fragment ProductFragment on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    tags
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 6) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    options {
      name
      values
    }
    variants(first: 100) {
      edges {
        node {
          id
          title
          sku
          availableForSale
          quantityAvailable
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
`;

// Récupère tous les produits (pour la page /collections)
export const GET_PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProducts(
    $first: Int!
    $after: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
  ) {
    products(
      first: $first
      after: $after
      sortKey: $sortKey
      reverse: $reverse
      query: $query
    ) {
      edges {
        node {
          ...ProductFragment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Récupère un produit par son handle (pour /products/[handle])
export const GET_PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFragment
      descriptionHtml
      collections(first: 5) {
        edges {
          node {
            title
            handle
          }
        }
      }
    }
  }
`;

// Récupère les produits d'une collection (pour les pages créateurs)
// Pagination cursor-based : `after` + `pageInfo` (Phase 5 — même contrat que GetProducts).
export const GET_COLLECTION_PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetCollectionProducts($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      title
      description
      image {
        url
        altText
        width
        height
      }
      products(first: $first, after: $after) {
        edges {
          node {
            ...ProductFragment
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

// Récupère des produits par leurs IDs Shopify (utilisé par les pages créateurs)
export const GET_PRODUCTS_BY_IDS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProductsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        ...ProductFragment
      }
    }
  }
`;

// Récupère les handles produits pour le sitemap (léger : pas de variantes/images).
export const GET_SITEMAP_PRODUCTS_QUERY = `
  query GetSitemapProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "published_status:published") {
      edges {
        node {
          handle
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Récupère les collections actives pour le sitemap et la navigation.
export const GET_COLLECTIONS_QUERY = `
  query GetCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        node {
          handle
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// ───────────────────────────────────────────────────────────────────────────
//  ⚠️ À PARTIR D'ICI : opérations de l'ADMIN API.
//  Elles ne doivent JAMAIS être envoyées au client Storefront
//  (endpoint /api/<version>/graphql.json) : ces champs n'existent pas dans
//  le schéma Storefront. Elles passent par `adminFetch()`.
// ───────────────────────────────────────────────────────────────────────────

// Crée un produit dans Shopify (Admin API).
// Signature 2026-07 : productCreate(product: ProductCreateInput!, media: [CreateMediaInput!]).
// `ProductCreateInput` n'accepte plus `variants` : la variante par défaut est
// créée automatiquement, son prix se règle avec PRODUCT_VARIANT_PRICE_UPDATE_MUTATION.
export const PRODUCT_CREATE_MUTATION = `
  mutation ProductCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product {
        id
        handle
        title
        variants(first: 1) {
          nodes {
            id
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Applique le prix à la variante par défaut (Admin API).
export const PRODUCT_VARIANT_PRICE_UPDATE_MUTATION = `
  mutation UpdateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Liste les publications du shop (canaux de vente) — Admin API.
// Sert à résoudre l'ID de la publication « Online Store ».
export const GET_ONLINE_STORE_PUBLICATION_QUERY = `
  query GetPublications($first: Int!) {
    publications(first: $first) {
      nodes {
        id
        name
      }
    }
  }
`;

// Publie un produit sur une publication donnée (Admin API).
// `productPublish(id, channel: String!)` est déprécié et son argument `channel`
// attendait une URL qui n'existe dans aucun schéma → remplacé par
// `publishablePublish` + un vrai `publicationId` (voir getOnlineStorePublicationId).
export const PUBLISHABLE_PUBLISH_MUTATION = `
  mutation PublishablePublish($id: ID!, $publicationId: ID!) {
    publishablePublish(id: $id, input: [{ publicationId: $publicationId }]) {
      publishable {
        ... on Product {
          id
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
