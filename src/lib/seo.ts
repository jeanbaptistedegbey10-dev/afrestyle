// src/lib/seo.ts
// ────────────────────────────────────────────────────────────────────────────
//  Helpers SEO partagés (Phase 6 — Performance & SEO technique avancé).
//  • getSiteUrl()         : base canonique unique (NEXT_PUBLIC_SITE_URL).
//  • buildProductJsonLd() : Schema.org/Product typé pour la fiche produit.
// ────────────────────────────────────────────────────────────────────────────

import type { Product } from "@/lib/shopify/types";
import { getAppUrl, STORE_CURRENCY } from "@/constants/store";

/** Base canonique du site (sans slash final) — voir getAppUrl() :
 *  NEXT_PUBLIC_APP_URL → NEXT_PUBLIC_SITE_URL → URL de production (jamais localhost en prod). */
export function getSiteUrl(): string {
  return getAppUrl();
}

export type ProductJsonLd = {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  image: string[];
  url: string;
  brand: { "@type": "Brand"; name: string };
  offers: {
    "@type": "Offer";
    url: string;
    priceCurrency: string;
    price: string;
    availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
    itemCondition: "https://schema.org/NewCondition";
    seller: { "@type": "Organization"; name: string };
  };
};

/**
 * Construit le JSON-LD Schema.org/Product d'une fiche produit.
 * Champs e-commerce : name, description, image, offers (price, priceCurrency,
 * availability, seller), brand ("AfroStyle").
 */
export function buildProductJsonLd(product: Product): ProductJsonLd {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/products/${product.handle}`;
  const images = product.images.map((img) => img.url);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.description?.slice(0, 500) ||
      `${product.title} — création AfroStyle par ${product.vendor}.`,
    image: images,
    url,
    brand: { "@type": "Brand", name: "AfroStyle" },
    offers: {
      "@type": "Offer",
      url,
      // Devise d'affichage unique de la boutique (EUR) — cohérent avec l'UI.
      priceCurrency: STORE_CURRENCY,
      price: product.price,
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "AfroStyle" },
    },
  };
}
