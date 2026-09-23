// src/lib/shopify/storefrontClient.ts
// ────────────────────────────────────────────────────────────────────────────
//  CLIENT #1 — STOREFRONT (public)
//   • endpoint : https://<boutique>/api/<version>/graphql.json
//   • auth     : NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
//   • usage    : lectures catalogue, panier, comptes clients
//   • INTERDIT : toute opération d'administration (productCreate, productPublish,
//                publications, commandes…) → voir adminClient.ts
//
//  Rappel : l'API Storefront n'expose PAS le schéma Admin. Envoyer une mutation
//  Admin ici renvoie un « Field 'productCreate' doesn't exist on type 'Mutation' »
//  (c'était le bug B2 de l'intégration).
//
//  Ce fichier ne doit jamais être importé par un composant `"use client"`.
// ────────────────────────────────────────────────────────────────────────────

import { ShopifyApiError, type ShopifyGraphQLError } from "./errors";
import { checkApiVersionHeader, getStorefrontEndpoint } from "./version";

/** Forme d'une réponse GraphQL Storefront (comme pour tout GraphQL). */
export type ShopifyResponse<T> = {
  data: T;
  errors?: ShopifyGraphQLError[];
};

export type StorefrontFetchOptions = {
  query: string;
  variables?: Record<string, unknown>;
  /** Tags Next.js utilisables avec `revalidateTag()` (ex. "products"). */
  tags?: string[];
  /** Par défaut on conserve `force-cache` (comportement historique du projet). */
  cache?: RequestCache;
  revalidate?: number | false;
};

/**
 * Exécute une requête GraphQL sur l'API Storefront.
 *
 * @throws {ShopifyApiError} token absent, réponse illisible, erreurs GraphQL.
 */
export async function storefrontFetch<T>({
  query,
  variables,
  tags,
  cache = "force-cache",
  revalidate,
}: StorefrontFetchOptions): Promise<ShopifyResponse<T>> {
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!token) {
    throw new ShopifyApiError(
      "NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN est manquant — renseignez .env.local.",
      { endpoint: "storefront" },
    );
  }

  // On ne transmet `next` que s'il y a réellement quelque chose à configurer :
  // certains couples (`cache: "no-store"` + `revalidate`) sont rejetés par Next.
  const nextOptions: { tags?: string[]; revalidate?: number | false } = {};
  if (tags?.length) nextOptions.tags = tags;
  if (revalidate !== undefined) nextOptions.revalidate = revalidate;

  const response = await fetch(getStorefrontEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache,
    ...(Object.keys(nextOptions).length > 0 ? { next: nextOptions } : {}),
  } as RequestInit);

  checkApiVersionHeader(response, "storefront");

  let body: ShopifyResponse<T>;

  try {
    body = (await response.json()) as ShopifyResponse<T>;
  } catch (error) {
    throw new ShopifyApiError(
      `Réponse Storefront illisible (HTTP ${response.status}).`,
      { endpoint: "storefront", status: response.status, original: error },
    );
  }

  if (body.errors?.length) {
    throw new ShopifyApiError(
      `Storefront GraphQL : ${body.errors.map((e) => e.message).join(" | ")}`,
      {
        endpoint: "storefront",
        status: response.status,
        graphQLErrors: body.errors,
      },
    );
  }

  if (!body.data) {
    throw new ShopifyApiError(
      `Réponse Storefront vide (HTTP ${response.status}).`,
      { endpoint: "storefront", status: response.status },
    );
  }

  return body;
}
