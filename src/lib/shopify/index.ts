// src/lib/shopify/index.ts
// ────────────────────────────────────────────────────────────────────────────
//  Point d'entrée unique du module Shopify.
//
//  ⚠️  SERVEUR UNIQUEMENT : ce barrel ré-exporte aussi l'Admin API
//      (`adminFetch`, `createProduct`…). Ne l'importez jamais depuis un
//      composant `"use client"` — le token d'administration serait tiré dans
//      le bundle navigateur.
//
//  Deux clients, deux responsabilités (voir les fichiers dédiés) :
//   • storefrontClient.ts → lectures publiques  (token Storefront)
//   • adminClient.ts      → écritures serveur    (SHOPIFY_ADMIN_ACCESS_TOKEN)
//
//  Note : `ShopifyCart` exporté ici est le panier normalisé de `cart.ts`.
//  Le type GraphQL brut du même nom vit dans `types.ts` (non ré-exporté pour
//  éviter l'ambiguïté).
// ────────────────────────────────────────────────────────────────────────────

// ── Version d'API & endpoints (source de vérité unique) ─────────────────────
export {
  SHOPIFY_API_VERSION,
  SHOPIFY_API_VERSION_HEADER,
  checkApiVersionHeader,
  getAdminEndpoint,
  getShopifyStoreDomain,
  getStorefrontEndpoint,
} from "./version";

// ── Erreurs normalisées ─────────────────────────────────────────────────────
export { ShopifyApiError, formatUserErrors, toErrorMessage } from "./errors";
export type {
  ShopifyEndpoint,
  ShopifyGraphQLError,
  ShopifyUserError,
} from "./errors";

// ── Client Storefront (public) ──────────────────────────────────────────────
export { storefrontFetch } from "./storefrontClient";
export type {
  ShopifyResponse,
  StorefrontFetchOptions,
} from "./storefrontClient";

// ── Client Admin (serveur) ──────────────────────────────────────────────────
export { adminFetch } from "./adminClient";
export type { AdminFetchOptions } from "./adminClient";

// ── Produits ────────────────────────────────────────────────────────────────
export {
  createProduct,
  getAllProductsCatalog,
  getCollectionHandles,
  getCollectionProducts,
  getOnlineStorePublicationId,
  getProductByHandle,
  getProducts,
  getProductsByVendor,
  getSitemapProducts,
} from "./products";
export type { CreateProductInput, CreateProductResult } from "./products";

// ── Panier (Storefront) ─────────────────────────────────────────────────────
export {
  addToCart,
  createCart,
  getCart,
  removeCartLine,
  updateCartLine,
} from "./cart";
export type { ShopifyCart, ShopifyCartLine } from "./cart";

// ── Comptes clients (Storefront) ────────────────────────────────────────────
export {
  createCustomer,
  getCustomer,
  loginCustomer,
  logoutCustomer,
  recoverPassword,
  updateCustomer,
} from "./customer";
export type { CustomerUserError, ShopifyCustomer } from "./customer";

// ── Types de données Shopify (bruts + type UI normalisé) ────────────────────
export type {
  Product,
  ShopifyCollectionHandle,
  ShopifyImage,
  ShopifyMetafield,
  ShopifyMoney,
  ShopifyProduct,
  ShopifySitemapProduct,
  ShopifyVariant,
} from "./types";
