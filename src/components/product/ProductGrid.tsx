// src/components/product/ProductGrid.tsx — Phase 5 Luxe & Éditorial
import ProductCard from "./ProductCard";
import EmptyCollection from "./EmptyCollection";
import type { Product } from "@/lib/shopify/types";

type ProductGridProps = {
  products: Product[];
  /** Fond ivoire (catalogue) ou carbone (sections sombres réutilisant la grille). */
  tone?: "light" | "dark";
};

export default function ProductGrid({ products, tone = "light" }: ProductGridProps) {
  if (products.length === 0) return <EmptyCollection />;

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} tone={tone} />
      ))}
    </div>
  );
}
