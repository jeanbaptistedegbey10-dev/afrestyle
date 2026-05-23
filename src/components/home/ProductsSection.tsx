// src/components/home/ProductsSection.tsx
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/shopify/types";

const CATEGORIES = [
  "Tout voir",
  "Femme",
  "Homme",
  "Accessoires",
  "Wax",
  "Kente",
  "Bogolan",
  "Streetwear",
  "Traditionnel",
];

export default function ProductsSection({ products }: { products: Product[] }) {
  return (
    <section className="py-20 px-6" style={{ background: "#0F172A" }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p
              className="text-xs tracking-widest uppercase mb-3 flex items-center gap-3"
              style={{ color: "#D4AF37" }}
            >
              Sélection du moment
              <span
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(212,175,55,0.2)",
                  display: "inline-block",
                  width: 60,
                }}
              />
            </p>
            <h2 className="font-serif text-4xl" style={{ color: "#FDFAF4" }}>
              Pièces <em style={{ color: "#D4AF37" }}>phares</em>
            </h2>
          </div>
          <Link
            href="/collections"
            className="text-xs tracking-widest uppercase hidden md:block transition-colors"
            style={{ color: "#D4CCBA" }}
          >
            Voir tout →
          </Link>
        </div>

        {/* Pills catégories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-10 scrollbar-hide">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              className="flex-shrink-0 text-xs tracking-wider uppercase px-4 py-2 rounded-sm border transition-all duration-200"
              style={
                i === 0
                  ? {
                      background: "#D4AF37",
                      color: "#0F172A",
                      borderColor: "#D4AF37",
                    }
                  : {
                      background: "transparent",
                      color: "#D4CCBA",
                      borderColor: "rgba(212,175,55,0.2)",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/collections" className="btn-outline">
            Voir toute la collection →
          </Link>
        </div>
      </div>
    </section>
  );
}
