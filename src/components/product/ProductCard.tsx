// src/components/product/ProductCard.tsx — Relief Éditorial Luxe, double thème
"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ImageOff } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn, capitalize, formatPrice } from "@/lib/utils";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/assets/images";
import SafeImage from "@/components/ui/SafeImage";
import type { Product } from "@/lib/shopify/types";

type ProductCardProps = {
  product: Product;
  /** Prop conservée pour compatibilité (ProductGrid) — le thème est désormais
   *  géré par les variables CSS globales dans les deux modes. */
  tone?: "light" | "dark";
  /** Visuel de repli (image éditoriale de marque) quand le produit n'a aucune
   *  image Shopify. Les 3 paliers d'erreur sont gérés par <SafeImage /> :
   *  URL produit → visuel de marque → SVG officiel AfroStyle. */
  fallbackImage?: string;
};

export default function ProductCard({
  product,
  fallbackImage,
}: ProductCardProps) {
  // `||` (et non `??`) : un fallback vide ("") doit basculer sur l'image par défaut.
  const effectiveFallback = fallbackImage || FALLBACK_PRODUCT_IMAGE;

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  const mainImage = product.images[0];
  const hoverImage = product.images[1];
  const showSecond = isHovered && Boolean(hoverImage);
  // SafeImage applique les 3 paliers d'erreur — plus de gestion manuelle onError.
  const displaySrc = mainImage?.url || effectiveFallback;

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
      {/* Visuel — carte en relief : fond dédié, bordure subtile, ombre + élévation au survol */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-line bg-surface mb-4 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-gold/40">
        {displaySrc ? (
          <>
            <SafeImage
              src={displaySrc}
              alt={mainImage?.altText ?? product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={cn(
                "object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]",
                showSecond ? "opacity-0" : "opacity-100"
              )}
            />
            {hoverImage && (
              <SafeImage
                src={hoverImage.url}
                alt={hoverImage.altText ?? product.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className={cn(
                  "object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]",
                  showSecond ? "opacity-100" : "opacity-0"
                )}
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-2 px-4 text-center">
            <ImageOff size={20} className="text-gold-dark dark:text-gold opacity-70" aria-hidden="true" />
            <p className="text-xs uppercase tracking-[0.2em] text-text-3">
              {product.title}
            </p>
          </div>
        )}

        {/* Badges — contraste éclatant dans les deux modes */}
        {product.tags.includes("nouveau") && (
          <span className="absolute left-3 top-3 rounded-sm bg-text text-bg px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em]">
            Nouveau
          </span>
        )}
        {product.compareAtPrice && (
          <span className="absolute left-3 top-3 rounded-sm bg-[#8C1D2F] text-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] shadow-sm">
            Promo
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          aria-label={isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-sm bg-surface text-text border border-line shadow-sm opacity-0 transition-all duration-300 group-hover:opacity-100 hover:border-gold"
        >
          <Heart
            size={14}
            className={cn("transition-all", isWishlisted && "fill-gold text-gold")}
          />
        </button>

        {/* Quick add */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-3 transition-all duration-300",
            isHovered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          )}
        >
          <button
            onClick={handleQuickAdd}
            disabled={isAdding || !product.availableForSale}
            className={cn(
              "w-full rounded-sm py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-300",
              isAdding
                ? "bg-gold text-white"
                : "bg-surface text-text border border-line hover:bg-text hover:text-bg hover:border-text",
              !product.availableForSale &&
                "cursor-not-allowed bg-surface-2 text-text-3 border-line"
            )}
          >
            {!product.availableForSale
              ? "Épuisé"
              : isAdding
                ? "Ajouté"
                : "Ajouter au panier"}
          </button>
        </div>
      </div>

      {/* Infos produit */}
      <div>
        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-text-3">
          {[product.country && capitalize(product.country), product.fabric && capitalize(product.fabric)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h3 className="font-serif text-base leading-snug text-text transition-colors duration-300 group-hover:text-gold-dark dark:group-hover:text-gold group-hover:decoration-1 group-hover:underline-offset-4">
          {product.title}
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text">
              {product.priceFormatted}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-text-3 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <span className="text-xs text-text-3">{product.vendor}</span>
        </div>
      </div>
    </Link>
  );
}
