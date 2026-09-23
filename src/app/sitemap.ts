// src/app/sitemap.ts
// ────────────────────────────────────────────────────────────────────────────
//  Sitemap dynamique Next.js App Router (Phase 6 — SEO technique avancé).
//  • Pages statiques de la Maison (/, /about, /collections, /lookbook).
//  • Collections actives  → /collections? (via handles Shopify).
//  • Produits publiés     → /products/[handle].
//  Construit depuis la Storefront API ; en cas d'indisponibilité Shopify,
//  dégrade gracieusement vers les seules pages statiques (jamais de 500).
// ────────────────────────────────────────────────────────────────────────────

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getCollectionHandles, getSitemapProducts } from "@/lib/shopify/products";

export const revalidate = 3600;

const STATIC_ROUTES: { path: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number }[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/collections", changeFrequency: "daily", priority: 0.9 },
  { path: "/lookbook", changeFrequency: "weekly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [products, collections] = await Promise.all([
      getSitemapProducts({ first: 250 }),
      getCollectionHandles({ first: 100 }),
    ]);

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${siteUrl}/products/${p.handle}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Les collections Shopify natives n'ont pas de route dédiée dans cette
    // version : elles restent découvrables via /collections (filtres).
    // On expose tout de même un sitemap stable si une route /collections/[handle]
    // est ajoutée plus tard — en attendant, on ne référence que /collections.
    void collections;

    return [...staticEntries, ...productEntries];
  } catch (error) {
    console.warn("[sitemap] Shopify indisponible, fallback statique :", error);
    return staticEntries;
  }
}
