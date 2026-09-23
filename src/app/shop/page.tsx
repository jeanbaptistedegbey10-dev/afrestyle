// src/app/shop/page.tsx
// Catalogue /shop — mêmes visuels dynamiques + fallbacks que l'accueil.
//
// Stratégie :
// - Produits paginés depuis getProducts() (Storefront, tags "products").
//   - ISR 5 min + réinvalidation via /api/revalidate (webhook products/*).
import { Suspense } from "react";
import { getProducts } from "@/lib/shopify/products";
import ProductGrid from "@/components/product/ProductGrid";
import ProductGridSkeleton from "@/components/product/ProductGridSkeleton";
import { COLLECTION_PAGE_SIZE, resolveCollectionSort } from "@/lib/collections";

/** ISR catalogue : 5 min + invalidation instantanée via webhook /api/revalidate. */
export const revalidate = 300;

type SearchParams = {
  searchParams: Promise<{
    sort?: string;
    q?: string;
  }>;
};

export default async function ShopPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  // « TOPICS » n'existe pas dans l'enum ProductSortKeys de Shopify (causait un
  // 500 GraphQL) — on réutilise le helper partagé avec /collections (défaut : nouveautés).
  const sort = resolveCollectionSort(params.sort);

  const { products } = await getProducts({
    first: COLLECTION_PAGE_SIZE,
    query: params.q || undefined,
    sortKey: sort.sortKey,
    reverse: sort.reverse,
  });

  return (
    <div className="min-h-screen bg-[#FDFAF4] text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-14 text-center md:py-20">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
          N 01 — Notre sélection
        </p>
        <h1 className="font-serif text-4xl leading-tight md:text-6xl">
          La Collection
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-neutral-500">
          {products.length === 0
            ? "Chaque création raconte une histoire"
            : `${products.length} pièce${products.length > 1 ? "s" : ""} — Chaque création raconte une histoire`}
        </p>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <ProductGrid products={products} />
        </Suspense>
            </div>

    </div>
  );
}

