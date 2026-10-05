// src/components/product/ProductImages.tsx
// ────────────────────────────────────────────────────────────────────────────
//  GALERIE INTERACTIVE de la fiche produit.
//
//  Disposition : grande image en tête, rangée de vignettes CLIQUABLES juste en
//  dessous (défilement horizontal sur mobile), flèches précédent/suivant et
//  balayage tactile horizontal sur mobile.
//
//  Synchro variante : `ProductForm` émet l'événement `afrestyle:variant-change`
//  à chaque changement d'option ; si la variante porte une image propre, la
//  galerie bascule dessus (ou l'ajoute en tête avec un badge « Variante »).
//
//  Règle d'or visuelle : l'image active a TOUJOURS une source saine — via
//  <SafeImage /> (3 paliers : URL → visuel de marque → SVG officiel).
//
//  Visuels : EXACTEMENT ceux publiés dans Shopify. Aucun placeholder local
//  (`data:`) n'est généré dès que la pièce possède ≥ 1 média réel ; la galerie
//  n'est jamais complétée pour atteindre un nombre fixe (3 images ⇒ « 1 / 3 »).
// ────────────────────────────────────────────────────────────────────────────
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductGalleryImage } from "@/lib/shopify/types";
import { VARIANT_IMAGE_EVENT, type VariantChangeDetail } from "./ProductForm";
import {
  FALLBACK_IMAGE_ALT,
  getSvgPlaceholder,
  isLocalPlaceholder,
} from "@/lib/assets/images";
import { selectDisplayImages } from "@/lib/product/images";
import SafeImage from "@/components/ui/SafeImage";

const IMAGE_ROLE_LABELS = {
  overview: "Vue générale",
  detail: "Détail du tissu ou des finitions",
  lifestyle: "Vue portée",
} as const;

const roleForImage = (role: ProductGalleryImage["role"]) =>
  role ? IMAGE_ROLE_LABELS[role] : "Vue produit";

/** Distance minimale (px) d'un balayage horizontal pour changer d'image. */
const SWIPE_THRESHOLD = 45;

export default function ProductImages({
  images,
  title,
}: {
  images: ProductGalleryImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [variantImage, setVariantImage] = useState<ProductGalleryImage | null>(null);
  // Suivi du geste tactile : point de départ, puis comparaison en fin de geste.
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // ── Galerie 100 % dynamique ───────────────────────────────────────────────
  // EXACTEMENT les visuels publiés dans Shopify : aucun « complétion » de la
  // galerie, aucun placeholder ajouté pour atteindre un nombre fixe.
  // 3 images Shopify ⇒ 3 vignettes et un compteur « 1 / 3 ».
  // Les replis SVG locaux (`data:`) ne servent QUE si la pièce ne publie
  // AUCUN média réel — sinon on ne garderait pas un cadre vide.
  const usableImages = useMemo(() => selectDisplayImages(images), [images]);

  // Quand ProductForm change de variante, bascule sur variant.image si elle
  // fait partie de la galerie ; sinon ajoute-la en tête (badge « Variante »).
  // ⚠️ On interroge `usableImages` (et non `images`) : l'index doit pointer
  // vers la galerie réellement rendue, sinon la sélection saute une vignette.
  useEffect(() => {
    function onVariantChange(e: Event) {
      const { imageUrl } = (e as CustomEvent<VariantChangeDetail>).detail;
      if (!imageUrl || isLocalPlaceholder(imageUrl)) {
        setVariantImage(null);
        return;
      }
      const inGallery = usableImages.some((img) => img.url === imageUrl);
      if (inGallery) {
        setVariantImage(null);
        setActiveIndex(usableImages.findIndex((img) => img.url === imageUrl));
      } else {
        setVariantImage({
          url: imageUrl,
          altText: `${title} — variante sélectionnée`,
          width: 1200,
          height: 1600,
          role: null,
        });
        setActiveIndex(0);
      }
    }
    window.addEventListener(VARIANT_IMAGE_EVENT, onVariantChange);
    return () => window.removeEventListener(VARIANT_IMAGE_EVENT, onVariantChange);
  }, [usableImages, title]);

  const gallery = useMemo(
    () => (variantImage ? [variantImage, ...usableImages] : usableImages),
    [variantImage, usableImages],
  );

  // L'index actif ne peut jamais dépasser la galerie courante (la variante
  // sélectionnée peut disparaître) : onborne pour éviter un « undefined ».
  const safeIndex = Math.min(Math.max(activeIndex, 0), gallery.length - 1);

  if (!gallery.length) {
    // Aucune image disponible — illustration neutre de marque (SVG officiel).
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-line bg-surface">
        <SafeImage
          src={getSvgPlaceholder()}
          alt={FALLBACK_IMAGE_ALT}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
    );
  }

  const active = gallery[safeIndex];
  const hasMultiple = gallery.length > 1;

  const goTo = (index: number) => {
    setActiveIndex((index + gallery.length) % gallery.length);
  };

  function handleTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !hasMultiple) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    // Un geste majoritairement vertical reste un défilement de page.
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }
    goTo(safeIndex + (deltaX < 0 ? 1 : -1));
  }

  return (
    <figure className="flex flex-col gap-3">
      {/* Grande image — balayage tactile + flèches ; le badge de vue indique le
          rôle éditorial du visuel (vue générale, détail, vue portée). */}
      <div
        className="group relative aspect-[3/4] w-full touch-pan-y overflow-hidden rounded-sm border border-line bg-surface shadow-sm"
        style={{ background: "var(--surface-2)" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <SafeImage
          key={active.url}
          src={active.url}
          alt={active.altText ?? title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {active.role && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-sm border border-white/25 bg-[#101B2A]/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5F0E7] backdrop-blur-sm">
            {roleForImage(active.role)}
          </span>
        )}

        {hasMultiple && (
          <>
            <span
              className="pointer-events-none absolute right-3 top-3 rounded-sm bg-[#101B2A]/80 px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] text-[#F5F0E7] backdrop-blur-sm"
              aria-hidden="true"
            >
              {safeIndex + 1} / {gallery.length}
            </span>

            <button
              type="button"
              onClick={() => goTo(safeIndex - 1)}
              aria-label="Image précédente"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/85 text-text shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-gold hover:text-gold-dark md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(safeIndex + 1)}
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/85 text-text shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-gold hover:text-gold-dark md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Rangée de vignettes cliquables — sous l'image, défilement horizontal
          sur mobile. Chaque vignette est un bouton d'au moins 44 px. */}
      {hasMultiple && (
        <div
          className="flex w-full snap-x gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "thin" }}
          role="group"
          aria-label={`Vignettes de la galerie — ${title}`}
        >
          {gallery.map((img, index) => {
            const isActive = index === safeIndex;
            const thumbnailAlt = img.altText ?? `${title} ${index + 1}`;

            return (
              <button
                key={`${img.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Afficher l'image ${index + 1} sur ${gallery.length}`}
                aria-current={isActive}
                className="relative h-20 w-16 shrink-0 snap-start overflow-hidden rounded-sm border bg-surface transition-all duration-200 md:h-24 md:w-20"
                style={{
                  borderColor: isActive ? "var(--gold)" : "var(--line)",
                  boxShadow: isActive
                    ? "0 0 0 2px color-mix(in srgb, var(--gold) 35%, transparent)"
                    : "none",
                }}
              >
                <SafeImage
                  src={img.url}
                  alt={thumbnailAlt}
                  fill
                  className={`object-cover transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                  }`}
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}
    </figure>
  );
}
