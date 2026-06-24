// src/app/collections/page.tsx — Affiche TOUS les produits + pagination
import { Suspense } from "react";
import { getProducts } from "@/lib/shopify/products";
import ProductGrid from "@/components/product/ProductGrid";
import CollectionFilters from "@/components/product/CollectionFilters";

type SearchParams = {
  searchParams: Promise<{
    genre?: string;
    pays?: string;
    tissu?: string;
    style?: string;
    sort?: string;
    q?: string;
  }>;
};

export default async function CollectionsPage({ searchParams }: SearchParams) {
  const params = await searchParams;

  const queryParts: string[] = [];
  if (params.genre)  queryParts.push(`tag:${params.genre}`);
  if (params.pays)   queryParts.push(`tag:pays-${params.pays}`);
  if (params.tissu)  queryParts.push(`tag:tissu-${params.tissu}`);
  if (params.style)  queryParts.push(`tag:style-${params.style}`);
  if (params.q)      queryParts.push(params.q);

  const sortMap: Record<string, { sortKey: string; reverse: boolean }> = {
    "prix-asc":  { sortKey: "PRICE", reverse: false },
    "prix-desc": { sortKey: "PRICE", reverse: true },
    "recent":    { sortKey: "CREATED_AT", reverse: true },
    "populaire": { sortKey: "BEST_SELLING", reverse: false },
  };
  const sort = sortMap[params.sort ?? "recent"] ?? sortMap["recent"];

  // Augmente le nombre de produits de 12 à 50
  const { products, pageInfo } = await getProducts({
    first: 50,
    query: queryParts.join(" ") || undefined,
    sortKey: sort.sortKey,
    reverse: sort.reverse,
  });

  return (
    <div className="min-h-screen">
      <div
        className="py-16 px-6 text-center border-b"
        style={{ borderColor: "rgba(212,175,55,0.1)" }}
      >
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>
          Notre sélection
        </p>
        <h1 className="font-serif text-5xl mb-4" style={{ color: "#FDFAF4" }}>
          {params.genre
            ? params.genre.charAt(0).toUpperCase() + params.genre.slice(1)
            : params.tissu
            ? `Collection ${params.tissu.charAt(0).toUpperCase() + params.tissu.slice(1)}`
            : params.pays
            ? `Créateurs du ${params.pays.charAt(0).toUpperCase() + params.pays.slice(1)}`
            : "La Collection"}
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#D4CCBA" }}>
          {products.length} pièce{products.length > 1 ? "s" : ""} —{" "}
          {products.length === 0
            ? "Aucun produit pour ces filtres"
            : "Chaque création raconte une histoire"}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <Suspense fallback={<div style={{ color: "#D4CCBA" }}>Chargement...</div>}>
          <CollectionFilters activeFilters={params} />
        </Suspense>
        <ProductGrid products={products} />
        
        {/* Bouton Voir plus si pagination disponible */}
        {pageInfo.hasNextPage && (
          <div className="text-center mt-12">
            <a
              href={`/collections?q=${params.q || ""}&genre=${params.genre || ""}&pays=${params.pays || ""}&tissu=${params.tissu || ""}&style=${params.style || ""}&sort=${params.sort || "recent"}`}
              className="inline-block px-8 py-3 text-xs tracking-widest uppercase transition-all duration-200"
              style={{ background: "#D4AF37", color: "#0F172A" }}
            >
              Voir plus de produits →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}