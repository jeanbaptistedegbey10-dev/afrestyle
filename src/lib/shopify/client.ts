// src/lib/shopify/client.ts
// Ce fichier tourne UNIQUEMENT côté serveur (pas de "use client")

const SHOPIFY_STOREFRONT_API_URL = `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;

type ShopifyResponse<T> = {
  data: T;
  errors?: { message: string }[];
};

export async function shopifyFetch<T>({
  query,
  variables,
  tags,
  cache = "force-cache", // SSG — données mises en cache au build
}: {
  query: string;
  variables?: Record<string, unknown>;
  tags?: string[];
  cache?: RequestCache;
}): Promise<ShopifyResponse<T>> {
  const result = await fetch(SHOPIFY_STOREFRONT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token":
        process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    next: {
      tags,
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
}