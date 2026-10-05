// src/app/collections/[handle]/page.tsx
// Page collection unique — mêmes visuels dynamiques + fallbacks que l'accueil.
//
// Stratégie :
// - Produits de la collection via getCollectionProducts() (Storefront).
// - Catalogue produits via getCollectionProducts() (Storefront API).
// - Bandeau : métachamps `custom.banner_*` de la collection (médias, titre,
//   sous-titre, CTA) — modifiables depuis Shopify Admin, sans déploiement.
// - ISR 5 min + réinvalidation via /api/revalidate (webhooks
//   collections/update et metaobjects/update).
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCollectionProducts } from "@/lib/shopify/products";
import { getCollectionBanner } from "@/lib/shopify/collections";
import CollectionBanner from "@/components/collection/CollectionBanner";
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
  // Produits + bandeau en parallèle : une seule phase réseau, et la page ne
  // reste jamais bloquée par l'absence de bannière configurée.
  const [data, banner] = await Promise.all([
    getCollectionProducts({ handle, first: 24 }),
    getCollectionBanner(handle),
  ]);

    if (!data) notFound();

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Bandeau piloté par Shopify (`custom.banner_*`) ; repli éditorial
          automatique si la collection n'a aucune bannière configurée. */}
      <CollectionBanner
        banner={banner}
        title={data.collection.title}
        description={data.collection.description}
        productCount={data.products.length}
      />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <ProductGrid products={data.products} />
        </Suspense>
      </div>

    </div>
  );
}

