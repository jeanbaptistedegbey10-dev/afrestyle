// src/app/collections/page.tsx
// Server Component — les produits sont fetchés côté serveur
import { getProducts } from "@/lib/shopify/products";
import ProductGrid from "@/components/product/ProductGrid";
import CollectionFilters from "@/components/product/CollectionFilters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Découvrez toute la collection AfroStyle — mode africaine contemporaine.",
};

// searchParams = les paramètres URL (?pays=benin&tissu=wax&sort=price)
// Next.js les injecte automatiquement dans les Server Components de page
type SearchParams = {
  searchParams: Promise<{
    pays?: string;
    tissu?: string;
    style?: string;
    sort?: string;
    q?: string;
  }>;
};

export default async function CollectionsPage({ searchParams }: SearchParams) {
  const params = await searchParams;

  // Construction de la query Shopify à partir des filtres URL
  // Ex: ?pays=benin&tissu=wax → query: "tag:pays-benin tag:tissu-wax"
  const queryParts: string[] = [];
  if (params.pays) queryParts.push(`tag:pays-${params.pays}`);
  if (params.tissu) queryParts.push(`tag:tissu-${params.tissu}`);
  if (params.style) queryParts.push(`tag:style-${params.style}`);
  if (params.q) queryParts.push(params.q);

  // Mapping du paramètre sort vers les clés Shopify
  const sortMap: Record<string, { sortKey: string; reverse: boolean }> = {
    "prix-asc": { sortKey: "PRICE", reverse: false },
    "prix-desc": { sortKey: "PRICE", reverse: true },
    recent: { sortKey: "CREATED_AT", reverse: true },
    populaire: { sortKey: "BEST_SELLING", reverse: false },
  };
  const sort = sortMap[params.sort ?? "recent"] ?? sortMap["recent"];

  const { products } = await getProducts({
    first: 12,
    query: queryParts.join(" ") || undefined,
    sortKey: sort.sortKey,
    reverse: sort.reverse,
  });

  return (
    <div className="min-h-screen">
      {/* Header page */}
      <div
        className="py-16 px-6 text-center border-b"
        style={{ borderColor: "rgba(212,175,55,0.1)" }}
      >
        <p
          className="text-xs tracking-widest uppercase mb-3"
          style={{ color: "#D4AF37" }}
        >
          Notre sélection
        </p>
        <h1 className="font-serif text-5xl mb-4" style={{ color: "#FDFAF4" }}>
          La Collection
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#D4CCBA" }}>
          {products.length} pièce{products.length > 1 ? "s" : ""} — Chaque
          création raconte une histoire
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Filtres */}
        <CollectionFilters activeFilters={params} />

        {/* Grille produits */}
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
