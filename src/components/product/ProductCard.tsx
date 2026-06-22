// src/components/product/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn, capitalize } from "@/lib/utils";
import type { Product } from "@/lib/shopify/types";


type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  const mainImage = product.images[0];
  // Deuxième image pour l'effet hover (swap d'image)
  const hoverImage = product.images[1] ?? product.images[0];

  async function handleQuickAdd(e: React.MouseEvent) {
  e.preventDefault();
  if (!product.variants[0]) return;
  setIsAdding(true);
  await addItem(product.variants[0].id, 1);
  await new Promise((r) => setTimeout(r, 1000));
  setIsAdding(false);
}

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-2 border border-gold/10 mb-4">
        {/* Image principale */}
        {mainImage ? (
          <Image
            src={isHovered && hoverImage ? hoverImage.url : mainImage.url}
            alt={mainImage.altText ?? product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // Placeholder SVG généré dynamiquement
          <div className="w-full h-full flex items-center justify-center" style={{
            background: `linear-gradient(135deg, #2d1535 0%, #0d2218 100%)`
          }}>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full border-2 border-gold/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-gold font-serif text-2xl font-bold">
                  {product.title.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                </span>
              </div>
              <p className="text-sand-3 text-xs tracking-widest uppercase px-4 line-clamp-2">
                {product.title}
              </p>
            </div>
          </div>
        )}

        {/* Badge Nouveau / Promo */}
        {product.tags.includes("nouveau") && (
          <span className="absolute top-3 left-3 bg-gold text-ink text-xs font-medium tracking-wider uppercase px-2 py-1">
            Nouveau
          </span>
        )}
        {product.compareAtPrice && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-medium tracking-wider uppercase px-2 py-1">
            Promo
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          aria-label={
            isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ink/80 flex items-center justify-center text-sand-3 hover:text-gold transition-colors duration-200"
        >
          <Heart
            size={14}
            className={cn(
              "transition-all",
              isWishlisted && "fill-gold text-gold",
            )}
          />
        </button>

        {/* Quick add — apparaît au hover */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-3 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
        >
          <button
            onClick={handleQuickAdd}
            disabled={isAdding || !product.availableForSale}
            className={cn(
              "w-full py-2 text-xs font-medium tracking-widest uppercase transition-all duration-200",
              isAdding
                ? "bg-green-700 text-white"
                : "bg-gold text-ink hover:bg-gold-light",
              !product.availableForSale &&
                "bg-ink-3 text-sand-3 cursor-not-allowed",
            )}
          >
            {!product.availableForSale
              ? "Épuisé"
              : isAdding
                ? "✓ Ajouté !"
                : "Ajouter au panier"}
          </button>
        </div>
      </div>

      {/* Infos produit */}
      <div>
        {/* Pays · Tissu */}
        <p className="text-gold text-xs tracking-widest uppercase mb-1">
          {[
            product.country && capitalize(product.country),
            product.fabric && capitalize(product.fabric),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* Titre */}
        <h3 className="font-serif text-cream text-base mb-1 group-hover:text-gold transition-colors duration-200">
          {product.title}
        </h3>

        {/* Prix + Créateur */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sand font-medium">
              {product.priceFormatted}
            </span>
            {product.compareAtPrice && (
              <span className="text-sand-3 text-sm line-through">
                {product.compareAtPrice}
              </span>
            )}
          </div>
          <span className="text-sand-3 text-xs">{product.vendor}</span>
        </div>
      </div>
    </Link>
  );
}
