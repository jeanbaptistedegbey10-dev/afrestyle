// src/components/product/CollectionCatalog.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Wrapper client du catalogue (Phase 5).
//  Reçoit la 1re page depuis le Server Component, concatène les suivantes
//  via <LoadMoreProducts />. Monté avec `key={filterSignature(...)}` depuis
//  la page : tout changement de filtre remonte le composant et réinitialise
//  donc la liste ET le curseur de pagination.
// ────────────────────────────────────────────────────────────────────────────
"use client";

import { useCallback, useState } from "react";
import LoadMoreProducts from "./LoadMoreProducts";
import ProductGrid from "./ProductGrid";
import type { CollectionPageInfo } from "@/lib/collections";
import type { Product } from "@/lib/shopify/types";

type CollectionCatalogProps = {
  initialProducts: Product[];
  initialPageInfo: CollectionPageInfo;
  apiParams: Record<string, string>;
};

export default function CollectionCatalog({
  initialProducts,
  initialPageInfo,
  apiParams,
}: CollectionCatalogProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const handleAppend = useCallback((next: Product[]) => {
    setProducts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      const deduped = next.filter((p) => !seen.has(p.id));
      return [...prev, ...deduped];
    });
  }, []);

  return (
    <>
      <ProductGrid products={products} />
      <LoadMoreProducts
        apiParams={apiParams}
        pageInfo={initialPageInfo}
        onAppend={handleAppend}
      />
    </>
  );
}
