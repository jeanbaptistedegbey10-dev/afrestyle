// src/lib/shopify/client.ts

// Ce fichier tourne UNIQUEMENT côté serveur (pas de "use client")
// C'est un Server-side module — les tokens restent secrets

const SHOPIFY_STOREFRONT_API_URL = `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;

// Type générique pour toutes les réponses GraphQL Shopify
type ShopifyResponse<T> = {
  data: T;
  errors?: { message: string }[];
};

/**
 * Fonction centrale pour toutes les requêtes Shopify
 *
 * En entretien: "J'ai centralisé les appels API dans un seul module
 * pour avoir un point unique de gestion des erreurs et des headers.
 * C'est le principe DRY (Don't Repeat Yourself)."
 */
export async function shopifyFetch<T>({
  query,
  variables,
  tags, // Pour le cache Next.js (on-demand revalidation)
  cache = "force-cache", // Par défaut: mise en cache (SSG)
}: {
  query: string;
  variables?: Record<string, unknown>;
  tags?: string[];
  cache?: RequestCache;
}): Promise<ShopifyResponse<T>> {
  // TEMPORAIRE — pour debug uniquement
  const url = `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;
  console.log("🔍 Shopify URL:", url);
  console.log(
    "🔑 Token présent:",
    !!process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  );
  console.log(
    "🔑 Token (5 premiers chars):",
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.slice(0, 5),
  );
  try {
    const result = await fetch(SHOPIFY_STOREFRONT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Token Storefront — peut être public (NEXT_PUBLIC_)
        "X-Shopify-Storefront-Access-Token":
          process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
      },
      body: JSON.stringify({ query, variables }),
      // Next.js étend fetch() avec des options de cache
      next: {
        tags, // Tags pour invalider le cache à la demande
        revalidate: tags ? undefined : 3600, // 1h si pas de tag
      },
      cache,
    });

    if (!result.ok) {
      throw new Error(`Shopify API error: ${result.status}`);
    }

    const body = await result.json();

    if (body.errors) {
      throw new Error(
        body.errors.map((e: { message: string }) => e.message).join(", "),
      );
    }

    return body;
  } catch (error) {
    throw new Error(`Shopify fetch failed: ${error}`);
  }
}
