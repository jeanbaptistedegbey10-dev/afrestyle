// src/components/home/ProductsSection.tsx — Éditorial Luxe, double thème
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/assets/images";
import type { Product } from "@/lib/shopify/types";

// Clés d'URL unifiées : `gender` partout (accueil → footer → /shop → /collections).
const CATEGORIES = [
  { label: "Tout voir",     url: "/collections" },
  { label: "Femme",        url: "/collections?gender=femme" },
  { label: "Homme",        url: "/collections?gender=homme" },
  { label: "Accessoires",  url: "/collections?gender=accessoire" },
  { label: "Wax",          url: "/collections?tissu=wax" },
  { label: "Kente",        url: "/collections?tissu=kente" },
  { label: "Bogolan",      url: "/collections?tissu=bogolan" },
  { label: "Streetwear",   url: "/collections?style=streetwear" },
  { label: "Traditionnel", url: "/collections?style=traditionnel" },
];

export default function ProductsSection({
  products,
  productVisuals,
}: {
  products: Product[];
  productVisuals?: string[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const visuals = productVisuals ?? [];

  function handleCategoryClick(index: number, url: string) {
    setActiveIndex(index);
    router.push(url);
  }

  return (
    <section className="py-20 bg-bg">
      {/* Conteneur standardisé */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-gold-dark dark:text-gold text-xs tracking-widest uppercase mb-3 flex items-center gap-3">
              Sélection du moment
              <span className="h-px w-16 inline-block bg-gold/40" />
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-text">
              Pièces <em className="text-gold-dark dark:text-gold">phares</em>
            </h2>
          </div>
          <Link
            href="/collections"
            className="text-text-2 text-xs tracking-widest uppercase hidden sm:block hover:text-gold-dark dark:hover:text-gold transition-colors"
          >
            Voir tout →
          </Link>
        </div>

        {/* Pills cliquables */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-10"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryClick(i, cat.url)}
              className={`flex-shrink-0 text-xs tracking-wider uppercase px-4 py-2 rounded-sm border transition-all duration-200 ${
                activeIndex === i
                  ? "bg-gold border-gold text-gold-contrast"
                  : "bg-surface border-line text-text-2 hover:border-gold hover:text-gold-dark dark:hover:text-gold"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grille produits — responsive : 1 / 2 / 4 colonnes */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  fallbackImage={
                    // `||` : ignore aussi les chaînes vides du flux de visuels.
                    visuals[index % visuals.length] || FALLBACK_PRODUCT_IMAGE
                  }
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/collections" className="btn-outline">
                Voir toute la collection →
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-lg text-gold-dark dark:text-gold">
              ✦
            </span>
            <p className="font-serif text-xl text-text">
              Aucune pièce pour le moment
            </p>
            <p className="max-w-sm text-sm text-text-2">
              La sélection se révélera dès que nos créateurs publieront leurs
              nouveautés — revenez très bientôt.
            </p>
            <Link href="/collections" className="btn-outline mt-2">
              Voir toutes les collections
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
