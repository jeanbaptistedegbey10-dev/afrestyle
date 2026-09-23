// src/lib/shopify/adminClient.ts
// ────────────────────────────────────────────────────────────────────────────
//  CLIENT #2 — ADMIN (privilégié, SERVEUR UNIQUEMENT)
//   • endpoint : https://<boutique>/admin/api/<version>/graphql.json
//   • auth     : SHOPIFY_ADMIN_ACCESS_TOKEN (⚠️ jamais de préfixe NEXT_PUBLIC_,
//                sinon le token d'administration fuite dans le bundle client)
//   • usage    : création / mise à jour de produits, publication, publications,
//                tout ce qui touche aux commandes et aux clients côté back-office
//   • INTERDIT : import dans un composant `"use client"`, une route de seed
//                publique non authentifiée, ou tout code exécuté côté navigateur.
//
//  Rappel : `cache: "no-store"` est forcé — une réponse d'administration ne doit
//  jamais être mise en cache par Next.js.
// ────────────────────────────────────────────────────────────────────────────

import { ShopifyApiError, type ShopifyGraphQLError } from "./errors";
import { checkApiVersionHeader, getAdminEndpoint } from "./version";

export type AdminFetchOptions = {
  query: string;
  variables?: Record<string, unknown>;
};

type AdminResponse<T> = {
  data?: T;
  /** Erreurs de schéma / d'authentification renvoyées par l'Admin API. */
  errors?: ShopifyGraphQLError[] | string;
};

/**
 * Exécute une opération GraphQL sur l'API Admin et retourne directement `data`.
 *
 * Les `userErrors` métier (ex. `productCreate.userErrors`) ne lèvent PAS
 * d'exception : ils restent dans `data` pour que l'appelant décide de
 * l'affichage (voir `formatUserErrors()`).
 *
 * @throws {ShopifyApiError} token absent, erreur HTTP, erreur GraphQL.
 */
export async function adminFetch<T>({
  query,
  variables,
}: AdminFetchOptions): Promise<T> {
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!token) {
    throw new ShopifyApiError(
      "SHOPIFY_ADMIN_ACCESS_TOKEN est manquant — générez un token d'administration " +
        "(scopes write_products, read_publications, write_publications) et ajoutez-le " +
        "dans .env.local.",
      { endpoint: "admin" },
    );
  }

  const response = await fetch(getAdminEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  checkApiVersionHeader(response, "admin");

  let body: AdminResponse<T>;

  try {
    body = (await response.json()) as AdminResponse<T>;
  } catch (error) {
    throw new ShopifyApiError(
      `Réponse Admin illisible (HTTP ${response.status}).`,
      { endpoint: "admin", status: response.status, original: error },
    );
  }

  // L'Admin REST/GraphQL renvoie parfois `errors` sous forme de simple chaîne.
  if (typeof body.errors === "string") {
    throw new ShopifyApiError(`Admin API : ${body.errors}`, {
      endpoint: "admin",
      status: response.status,
    });
  }

  if (body.errors?.length) {
    throw new ShopifyApiError(
      `Admin GraphQL : ${body.errors.map((e) => e.message).join(" | ")}`,
      {
        endpoint: "admin",
        status: response.status,
        graphQLErrors: body.errors,
      },
    );
  }

  if (!response.ok) {
    throw new ShopifyApiError(`Admin API HTTP ${response.status}.`, {
      endpoint: "admin",
      status: response.status,
    });
  }

  if (!body.data) {
    throw new ShopifyApiError(
      `Réponse Admin vide (HTTP ${response.status}).`,
      { endpoint: "admin", status: response.status },
    );
  }

  return body.data;
}
