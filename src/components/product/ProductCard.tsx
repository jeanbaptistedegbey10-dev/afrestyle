// src/components/product/ProductCard.tsx — Relief Éditorial Luxe, double thème
//
// Survol : la permutation d'image n'existe QUE si la pièce publie ≥ 2 visuels
// RÉELS et distincts. Une carte ne bascule JAMAIS sur un placeholder SVG local.
"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ImageOff } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn, capitalize, formatPrice } from "@/lib/utils";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/assets/images";
import { selectDisplayImages } from "@/lib/product/images";
import SafeImage from "@/components/ui/SafeImage";
import type { Product } from "@/lib/shopify/types";

type ProductCardTone = "light" | "dark";

type ProductCardProps = {
  product: Product;
  /** Surface sur laquelle la carte est posée.
   *
   *  ⚠️ Indispensable car `bg-band` (bande bleu nuit de « Sélection de la
   *  Saison ») est INVARIANT : `--band` est déclaré sous `:root, .dark`
   *  (globals.css) et ne change donc jamais de valeur. Un texte piloté par les
   *  seuls tokens `--text*` serait `#101B2A` (navy) SUR un fond `#101B2A` en
   *  mode clair, donc invisible. `tone="dark"` force une palette claire dans
   *  les DEUX modes, `tone="light"` suit le thème via les variantes `dark:`. */
  tone?: ProductCardTone;
  /** Visuel de repli (image éditoriale de marque) quand le produit n'a aucune
   *  image Shopify. Les 3 paliers d'erreur sont gérés par <SafeImage /> :
   *  URL produit → visuel de marque → SVG officiel AfroStyle. */
  fallbackImage?: string;
};

/**
 * Palette typographique du bloc « Infos produit », indexée par `tone`.
 *
 * Hiérarchie imposée par le design system, du plus discret au plus fort :
 *   tags → titre → description → prix → artisan.
 *
 * `light` : la carte repose sur une surface pilotée par le thème
 *           (`bg-surface`, section crème) → chaque teinte a sa variante
 *           `dark:` (titre blanc, secondary slate-300/400, prix champagne).
 * `dark`  : la carte repose sur la bande bleu nuit INVARIANTE → palette
 *           claire FORCÉE dans les deux modes (jamais de texte sombre).
 */
const INFO_TONES: Record<
  ProductCardTone,
  {
    tags: string;
    title: string;
    titleHover: string;
    description: string;
    price: string;
    compareAt: string;
    vendor: string;
    frame: string;
  }
> = {
  light: {
    // Champagne — et NON ambre. Sur fond clair `--gold` (#B89A62) plafonne à
    // 2.68:1 sur blanc : le texte utilise donc `--gold-dark` (#68502C, 7.6:1
    // AAA), la variante `dark:` bascule sur `--gold` clair (#D8BF8B) car le
    // fond devient nuit. Aucune teinte `amber-*` (jaune/orange) sur le site.
    tags: "text-gold-dark dark:text-gold",
    title: "text-slate-900 dark:text-white",
    titleHover: "group-hover:text-gold-dark dark:group-hover:text-gold-light",
    description: "text-slate-600 dark:text-slate-400",
    price: "text-gold-dark dark:text-gold",
    compareAt: "text-slate-400 dark:text-slate-500",
    vendor: "text-slate-500 dark:text-slate-400",
    // `--line` est déjà clair en mode sombre (rgba ivoire 12 %) : un `dark:`
    // supplémentaire serait redondant. On garde le filet champagne au survol.
    frame: "border-line group-hover:border-gold/40",
  },
  dark: {
    // Sur la bande bleu nuit INVARIANTE (identique en clair et en sombre), le
    // champagne de référence est `--band-gold` (#D8BF8B, 9.7:1 AAA sur #101B2A) :
    // `--gold` y vaudrait 6.5:1 et `--gold-dark` serait illisible.
    tags: "text-band-gold",
    title: "text-white",
    titleHover: "group-hover:text-band-gold-hover",
    description: "text-slate-300",
    price: "text-band-gold",
    compareAt: "text-slate-500",
    vendor: "text-slate-400",
    // Sur la bande invariante, une bordure champagne très discrète évite
    // l'effet « carte flottante sans cadre » ; ombre renforcée en mode sombre.
    frame:
      "border-band-gold/25 group-hover:border-band-gold/60 dark:shadow-[0_12px_28px_rgba(0,0,0,0.45)]",
  },
};

export default function ProductCard({
  product,
  tone = "light",
  fallbackImage,
}: ProductCardProps) {
  // `||` (et non `??`) : un fallback vide ("") doit basculer sur l'image par défaut.
  const effectiveFallback = fallbackImage || FALLBACK_PRODUCT_IMAGE;

  // Palette du bloc d'infos : pilotée par la SURFACE, pas par le thème.
  const info = INFO_TONES[tone];

  // Wishlist PERSISTÉE (localStorage via `useWishlist`) — l'ancien
  // `useState` local perdait tous les favoris au rechargement de la page et
  // rendait la route `/wishlist` toujours vide.
  const { isWishlisted, toggleProduct } = useWishlist();
  const wishlisted = isWishlisted(product.handle);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  // ── Visuels ─────────────────────────────────────────────────────────────────
  // Shopify est la seule source de vérité : on ne retient que les visuels
  // RÉELS (URL distante). Les replis SVG locaux (`data:`) sont exclus — une
  // carte NE DOIT JAMAIS basculer sur un placeholder au survol.
  const realImages = selectDisplayImages(product.images);

  const overviewImage = realImages.find((image) => image.role === "overview");
  const mainImage = overviewImage ?? realImages[0];
  const displaySrc = mainImage?.url || effectiveFallback;

  // Permutation d'image : elle n'existe que si la pièce publie réellement
  // ≥ 2 visuels distincts. En dessous, la carte garde `images[0]` inchangée
  // au survol (ni placeholder, ni retour sur la même image).
  const hoverCandidate =
    realImages.find(
      (image) => image.role === "detail" && image.url !== mainImage?.url,
    ) ??
    realImages.find(
      (image) => image.role === "lifestyle" && image.url !== mainImage?.url,
    ) ??
    realImages.find((image) => image.url !== mainImage?.url);

  const canSwapOnHover = realImages.length >= 2 && Boolean(hoverCandidate);
  const hoverImage = canSwapOnHover ? hoverCandidate : null;
  const showSecond = isHovered && Boolean(hoverImage);

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
      <div className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-sm border bg-surface mb-4 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1",
        info.frame
      )}>
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
          <span className="absolute left-3 top-3 rounded-sm bg-accent text-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] shadow-sm">
            Promo
          </span>
        )}

        {/* Wishlist — persistée, donc l'état survit au rechargement */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleProduct(product);
          }}
          aria-label={
            wishlisted ? `Retirer ${product.title} des favoris` : `Ajouter ${product.title} aux favoris`
          }
          aria-pressed={wishlisted}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-sm bg-surface text-text border border-line shadow-sm opacity-100 transition-all duration-300 hover:border-gold sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Heart
            size={14}
            className={cn("transition-all", wishlisted && "fill-gold text-gold")}
          />
        </button>

        {/* Quick add — permanent sur mobile (donc atteignable au toucher),
            révélé au survol uniquement à partir de sm. */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 opacity-100 transition-opacity duration-300 md:p-6 sm:opacity-0 sm:group-hover:opacity-100">
          <button
            onClick={handleQuickAdd}
            disabled={isAdding || !product.availableForSale}
            className={cn(
              "w-full min-h-11 rounded-sm px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-300",
              isAdding
                ? "bg-gold text-gold-contrast"
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

      {/* ── Infos produit ──────────────────────────────────────────────────
          Hiérarchie typographique explicite (du plus discret au plus fort) :
            1. Tags (Pays · Tissu)  → 10px, champagne, uppercase
            2. Titre                 → serif 16px semibold + line-clamp-1
            3. Description           → 12px, secondaire, line-clamp-2
            4. Prix                  → 14px gras, champagne (accent de valeur)
            5. Artisan               → 11px italique, tertiaire
          Les teintes viennent de `INFO_TONES[tone]` : pilotées par la surface,
          jamais contre elle (bande bleu nuit = palette claire dans les deux
          modes). */}
      <div>
        {/* 1. Tags (Pays • Tissu) */}
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider",
            info.tags
          )}
        >
          {[
            product.country && capitalize(product.country),
            product.fabric && capitalize(product.fabric),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* 2. Titre du produit */}
        <h3
          className={cn(
            "my-1 line-clamp-1 font-serif text-base font-semibold transition-colors duration-300",
            info.title,
            info.titleHover
          )}
        >
          {product.title}
        </h3>

        {/* 3. Description */}
        {product.shortDescription && (
          <p
            className={cn(
              "mb-2 line-clamp-2 text-xs leading-relaxed",
              info.description
            )}
          >
            {product.shortDescription}
          </p>
        )}

        {/* 4. Prix  +  5. Artisan / créateur */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-sm font-bold", info.price)}>
              {product.priceFormatted}
            </span>
            {product.compareAtPrice && (
              <span className={cn("text-xs line-through", info.compareAt)}>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <span
            className={cn(
              "truncate text-[11px] italic",
              info.vendor
            )}
            title={product.vendor}
          >
            {product.vendor}
          </span>
        </div>
      </div>
    </Link>
  );
}
