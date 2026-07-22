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
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
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
export const GET_COLLECTION_PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetCollectionProducts($handle: String!, $first: Int!) {
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
      products(first: $first) {
        edges {
          node {
            ...ProductFragment
          }
        }
      }
    }
  }
`;

// Crée un produit dans Shopify
export const PRODUCT_CREATE_MUTATION = `
  mutation ProductCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        handle
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Publie un produit (pour validation manuelle)
export const PRODUCT_PUBLISH_MUTATION = `
  mutation ProductPublish($id: ID!, $channel: String!) {
    productPublish(id: $id, channel: $channel) {
      userErrors {
        field
        message
      }
    }
  }
`;
