// src/components/home/ProductsSection.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/shopify/types";

const CATEGORIES = [
  { label: "Tout voir",     filter: null },
  { label: "Femme",        filter: "?style=femme" },
  { label: "Homme",        filter: "?style=homme" },
  { label: "Accessoires",  filter: "?style=accessoire" },
  { label: "Wax",          filter: "?tissu=wax" },
  { label: "Kente",        filter: "?tissu=kente" },
  { label: "Bogolan",      filter: "?tissu=bogolan" },
  { label: "Streetwear",   filter: "?style=streetwear" },
  { label: "Traditionnel", filter: "?style=traditionnel" },
];

export default function ProductsSection({ products }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  function handleCategoryClick(index: number, filter: string | null) {
    setActiveIndex(index);
    if (filter === null) {
      router.push("/collections");
    } else {
      router.push(`/collections${filter}`);
    }
  }

  return (
    <section className="py-20 px-6" style={{ background: "#0F172A" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p
              className="text-xs tracking-widest uppercase mb-3 flex items-center gap-3"
              style={{ color: "#D4AF37" }}
            >
              Sélection du moment
              <span style={{ height: 1, background: "rgba(212,175,55,0.2)", display: "inline-block", width: 60 }} />
            </p>
            <h2 className="font-serif text-4xl" style={{ color: "#FDFAF4" }}>
              Pièces <em style={{ color: "#D4AF37" }}>phares</em>
            </h2>
          </div>
          <Link
            href="/collections"
            className="text-xs tracking-widest uppercase hidden md:block"
            style={{ color: "#D4CCBA" }}
          >
            Voir tout →
          </Link>
        </div>

        {/* Pills cliquables */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-10" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryClick(i, cat.filter)}
              className="flex-shrink-0 text-xs tracking-wider uppercase px-4 py-2 transition-all duration-200"
              style={{
                borderRadius: "2px",
                border: "1px solid",
                borderColor: activeIndex === i ? "#D4AF37" : "rgba(212,175,55,0.2)",
                background: activeIndex === i ? "#D4AF37" : "transparent",
                color: activeIndex === i ? "#0F172A" : "#D4CCBA",
                cursor: "pointer",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grille produits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/collections"
            className="btn-outline"
            style={{ display: "inline-flex" }}
          >
            Voir toute la collection →
          </Link>
        </div>
      </div>
    </section>
  );
}