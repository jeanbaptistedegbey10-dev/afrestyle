// src/components/product/ProductGrid.tsx
// Composant séparé pour la grille — respecte le principe
// de séparation des responsabilités (SRP)

import ProductCard from "./ProductCard";
import type { Product } from "@/lib/shopify/types";
import { ShoppingBag } from "lucide-react";

export default function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <ShoppingBag size={48} style={{ color: "rgba(212,175,55,0.2)" }} />
        <p className="font-serif text-2xl" style={{ color: "#FDFAF4" }}>
          Aucun produit trouvé
        </p>
        <p className="text-sm" style={{ color: "#D4CCBA" }}>
          Essayez d'autres filtres
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
