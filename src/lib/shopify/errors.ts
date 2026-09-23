// src/lib/shopify/errors.ts
// Erreurs Shopify unifiées (Storefront + Admin).
// Objectif : ne plus jeter des `throw new Error("Shopify API error: 500")`
// impossibles à diagnostiquer, et distingue clairement :
//   • erreur transport / HTTP         → `status`
//   • erreur de schéma GraphQL        → `graphQLErrors`
//   • erreur métier de mutation       → `userErrors` (via formatUserErrors)

export type ShopifyEndpoint = "storefront" | "admin";

/** Erreur de schéma renvoyée dans le tableau racine `errors` d'une réponse GraphQL. */
export type ShopifyGraphQLError = {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
};

/** `userErrors` / `customerUserErrors` renvoyés par les mutations Shopify. */
export type ShopifyUserError = {
  field?: (string | number)[] | null;
  message: string;
};

export class ShopifyApiError extends Error {
  readonly endpoint: ShopifyEndpoint;
  readonly status: number | null;
  readonly graphQLErrors: ShopifyGraphQLError[];
  readonly original: unknown;

  constructor(
    message: string,
    options: {
      endpoint: ShopifyEndpoint;
      status?: number | null;
      graphQLErrors?: ShopifyGraphQLError[];
      original?: unknown;
    },
  ) {
    super(message);
    this.name = "ShopifyApiError";
    this.endpoint = options.endpoint;
    this.status = options.status ?? null;
    this.graphQLErrors = options.graphQLErrors ?? [];
    this.original = options.original;
  }
}

/**
 * Transforme une liste de `userErrors` Shopify en message lisible.
 * Ex. `field: ["input","variants"]` + message → "input.variants : Ce champ n'existe pas".
 */
export function formatUserErrors(
  errors: readonly ShopifyUserError[] | null | undefined,
  fallback = "Erreur Shopify inconnue",
): string {
  if (!errors || errors.length === 0) return fallback;

  return errors
    .map((error) => {
      const field = error.field?.filter((part) => part !== "").join(".");
      return field ? `${field} : ${error.message}` : error.message;
    })
    .join(" | ");
}

/** Message sûr à partir d'une valeur `catch` inconnue. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erreur Shopify inconnue";
}
