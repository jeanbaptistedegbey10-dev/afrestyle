// src/app/shop/page.tsx
// Catalogue /shop — filtres unifiés (clé canonique `gender`), mêmes visuels
// dynamiques et fallbacks que l'accueil et /collections.
//
// Stratégie :
// - Filtres tri/build de requête partagés via @/lib/collections (source unique).
// - Produits paginés depuis getProducts() (Storefront, ISR 5 min).
// - Bouton « Tout effacer » affiché dès qu'un filtre est actif (audit P1).
// - Le compteur de résultats affiché = produits exactement rendus par la grille.
import { Suspense } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getProducts } from "@/lib/shopify/products";
import ProductGrid from "@/components/product/ProductGrid";
import ProductGridSkeleton from "@/components/product/ProductGridSkeleton";
import CollectionFilters from "@/components/product/CollectionFilters";
import {
  COLLECTION_PAGE_SIZE,
  buildCollectionQuery,
  resolveCollectionSort,
  resolveGender,
} from "@/lib/collections";

/** ISR catalogue : 5 min + invalidation instantanée via webhook /api/revalidate. */
export const revalidate = 300;

type SearchParams = {
  searchParams: Promise<{
    gender?: string;
    genre?: string; // alias legacy
    category?: string; // alias legacy
    pays?: string;
    tissu?: string;
    style?: string;
    sort?: string;
    q?: string;
  }>;
};

export default async function ShopPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  // « TOPICS » n'existe pas dans l'enum ProductSortKeys de Shopify (causait un
  // 500 GraphQL) — on réutilise le helper partagé avec /collections (défaut : nouveautés).
  const sort = resolveCollectionSort(params.sort);
  // Même construction de requête que /collections et /api/products.
  const query = buildCollectionQuery(params);

  const { products } = await getProducts({
    first: COLLECTION_PAGE_SIZE,
    query: query || undefined,
    sortKey: sort.sortKey,
    reverse: sort.reverse,
  });

  const gender = resolveGender(params);
  const activeFilterValues = [
    gender,
    params.pays,
    params.tissu,
    params.style,
    params.q,
  ].filter(Boolean);
  const hasActiveFilters = activeFilterValues.length > 0;

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-line px-6 py-14 text-center md:py-20">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-text-3">
          N 01 — Notre sélection
        </p>
        <h1 className="font-serif text-4xl leading-tight md:text-6xl">
          La Collection
        </h1>
        {/* Compte exact des résultats affichés — recalculé à chaque filtre. */}
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-text-2">
          {products.length === 0
            ? "Chaque création raconte une histoire"
            : `${products.length} pièce${products.length > 1 ? "s" : ""} — Chaque création raconte une histoire`}
        </p>

        {/* Filtres actifs + bouton clair « Tout effacer » (audit P1) */}
        {hasActiveFilters && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-text-3">
              {activeFilterValues.join(" · ")}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 border border-text px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-text transition-colors duration-300 hover:bg-text hover:text-bg"
            >
              <X size={12} aria-hidden="true" />
              Tout effacer
            </Link>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-10 lg:flex-row">
          <Suspense
            fallback={
              <div className="hidden w-60 lg:block">
                <ProductGridSkeleton count={4} />
              </div>
            }
          >
            <CollectionFilters activeFilters={params} />
          </Suspense>
          <div className="min-w-0 flex-1">
            <Suspense fallback={<ProductGridSkeleton count={8} />}>
              <ProductGrid products={products} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

