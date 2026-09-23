// src/components/seo/ProductJsonLd.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Données structurées Schema.org/Product (Phase 6 — SEO e-commerce).
//  Server Component : rend <script type="application/ld+json"> avec le JSON-LD
//  construit par buildProductJsonLd() (src/lib/seo.ts).
// ────────────────────────────────────────────────────────────────────────────

import { buildProductJsonLd } from "@/lib/seo";
import type { Product } from "@/lib/shopify/types";

type ProductJsonLdProps = {
  product: Product;
};

export default function ProductJsonLd({ product }: ProductJsonLdProps) {
  const jsonLd = buildProductJsonLd(product);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
