// src/app/collections/[handle]/page.tsx
// Page collection unique — mêmes visuels dynamiques + fallbacks que l'accueil.
//
// Stratégie :
// - Produits de la collection via getCollectionProducts() (Storefront, tags "collection-{handle}").
// - Catalogue produits via getCollectionProducts() (Storefront API).
// - ISR 5 min + réinvalidation via /api/revalidate (webhook collections/update).
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCollectionProducts } from "@/lib/shopify/products";
import ProductGrid from "@/components/product/ProductGrid";
import ProductGridSkeleton from "@/components/product/ProductGridSkeleton";

/** ISR : 5 min + invalidation instantanée via webhook /api/revalidate. */
export const revalidate = 300;

export async function generateStaticParams() {
  const { getCollectionHandles } = await import("@/lib/shopify/products");
  const handles = await getCollectionHandles({ first: 250 });
  return handles.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getCollectionProducts({ handle, first: 1 });
  if (!data) return { title: "Collection introuvable" };
  return { title: `${data.collection.title} — AfroStyle` };
}

export default async function CollectionHandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getCollectionProducts({ handle, first: 24 });

    if (!data) notFound();

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-line px-6 py-14 text-center md:py-20">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-text-3">
          N 01 — Notre sélection
        </p>
        <h1 className="font-serif text-4xl leading-tight md:text-6xl">
          {data.collection.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-2">
          {data.collection.description || `${data.products.length} pièce${data.products.length !== 1 ? "s" : ""} — Chaque création raconte une histoire`}
        </p>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <ProductGrid products={data.products} />
        </Suspense>
            </div>

    </div>
  );
}

