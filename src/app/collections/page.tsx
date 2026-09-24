// src/app/collections/page.tsx — Phase 5 Luxe & Editorial (+ Phase 6 : ISR)
import { Suspense } from "react";
import { getProducts } from "@/lib/shopify/products";
import CollectionCatalog from "@/components/product/CollectionCatalog";
import CollectionFilters from "@/components/product/CollectionFilters";
import ProductGridSkeleton from "@/components/product/ProductGridSkeleton";
import {
  COLLECTION_PAGE_SIZE,
  buildCollectionQuery,
  filterSignature,
  resolveCollectionSort,
  resolveGender,
  toApiParams,
} from "@/lib/collections";

type SearchParams = {
  searchParams: Promise<{
    genre?: string; gender?: string; category?: string;
    pays?: string; tissu?: string;
    style?: string; sort?: string; q?: string;
  }>;
};

/** ISR catalogue : 5 min + invalidation instantanée via webhook /api/revalidate. */
export const revalidate = 300;

export default async function CollectionsPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const query = buildCollectionQuery(params);
  const sort = resolveCollectionSort(params.sort);

  const { products, pageInfo } = await getProducts({
    first: COLLECTION_PAGE_SIZE,
    query: query || undefined,
    sortKey: sort.sortKey,
    reverse: sort.reverse,
  });

  const signature = filterSignature(params);
  const apiParams = toApiParams(params);
  // Clé canonique `gender` (alias legacy genre/category acceptés).
  const genderParam = resolveGender(params);
  const activeLabels = [
    genderParam, params.pays, params.tissu, params.style,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-line px-6 py-14 text-center md:py-20">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-text-3">
          N 01 — Notre selection
        </p>
        <h1 className="font-serif text-4xl leading-tight md:text-6xl">
          {genderParam
            ? genderParam.charAt(0).toUpperCase() + genderParam.slice(1)
            : params.tissu ? `Collection ${params.tissu.charAt(0).toUpperCase() + params.tissu.slice(1)}`
            : params.pays ? `Createurs du ${params.pays.charAt(0).toUpperCase() + params.pays.slice(1)}`
            : "La Collection"}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-text-2">
          {products.length === 0
            ? "Chaque creation raconte une histoire"
            : `${products.length} piece${products.length > 1 ? "s" : ""} — Chaque creation raconte une histoire`}
        </p>
        {activeLabels.length > 0 && (
          <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-text-3">
            {activeLabels.join(" · ")}
          </p>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-10 lg:flex-row">
          <Suspense fallback={<div className="hidden w-60 lg:block"><ProductGridSkeleton count={4} /></div>}>
            <CollectionFilters activeFilters={params} />
          </Suspense>
          <div className="min-w-0 flex-1">
            <Suspense fallback={<ProductGridSkeleton count={8} />}>
              <CollectionCatalog
                key={signature}
                initialProducts={products}
                initialPageInfo={pageInfo}
                apiParams={apiParams}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
