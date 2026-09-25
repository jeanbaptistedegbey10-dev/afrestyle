// src/components/product/ProductImages.tsx
// Galerie + synchro image de variante (pilotée par ProductForm via event).
//
// Règle d'or visuelle :
// - L'image active doit TOUJOURS avoir une source saine — via <SafeImage />
//   (3 paliers d'erreur : URL Shopify → visuel de marque → SVG officiel).
// - Les dimensions affichées proviennent de l'image sélectionnée (produit ou variante),
//   pas de valeurs en dur, pour conserver un ratio et un srcset cohérents.
// - Aucun « portant générique » ni texte « Aucune image disponible » : le
//   repli est l'illustration neutre de marque (SVG AfroStyle).
"use client";

import { useEffect, useState } from "react";
import type { ProductGalleryImage } from "@/lib/shopify/types";
import { VARIANT_IMAGE_EVENT, type VariantChangeDetail } from "./ProductForm";
import { FALLBACK_IMAGE_ALT, getSvgPlaceholder } from "@/lib/assets/images";
import SafeImage from "@/components/ui/SafeImage";

const IMAGE_ROLE_LABELS = {
  overview: "Vue générale",
  detail: "Détail du tissu ou des finitions",
  lifestyle: "Vue portée",
} as const;

const roleForImage = (role: ProductGalleryImage["role"]) =>
  role ? IMAGE_ROLE_LABELS[role] : "Vue produit";

export default function ProductImages({
  images,
  title,
}: {
  images: ProductGalleryImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [variantImage, setVariantImage] = useState<ProductGalleryImage | null>(null);

  // Quand ProductForm change de variante, bascule sur variant.image si elle
  // fait partie de la galerie ; sinon ajoute-la en tête (badge "Variante").
  useEffect(() => {
    function onVariantChange(e: Event) {
      const { imageUrl } = (e as CustomEvent<VariantChangeDetail>).detail;
      if (!imageUrl) {
        setVariantImage(null);
        return;
      }
      const inGallery = images.some((img) => img.url === imageUrl);
      if (inGallery) {
        setVariantImage(null);
        setActiveIndex(images.findIndex((img) => img.url === imageUrl));
      } else {
        // Utilise les dimensions réelles de la variante si elles existent,
        // sinon valeurs cohérentes par défaut pour une fiche produit.
        const variant = images.find((img) => img.url === imageUrl);
        setVariantImage({
          url: imageUrl,
          altText: `${title} — variante sélectionnée`,
          width: variant?.width ?? 1200,
          height: variant?.height ?? 1600,
          role: null,
        });
        setActiveIndex(0);
      }
    }
    window.addEventListener(VARIANT_IMAGE_EVENT, onVariantChange);
    return () => window.removeEventListener(VARIANT_IMAGE_EVENT, onVariantChange);
  }, [images, title]);

  const gallery = variantImage ? [variantImage, ...images] : images;

  if (!gallery.length) {
    // Aucune image Shopify disponible — illustration neutre de marque (SVG
    // officiel AfroStyle) au lieu du texte « Aucune image disponible ».
    return (
      <div className="flex gap-4">
        <div className="relative flex-1 aspect-[3/4] overflow-hidden rounded-sm bg-surface border border-line">
          <SafeImage
            src={getSvgPlaceholder()}
            alt={FALLBACK_IMAGE_ALT}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    );
  }

  const active = gallery[activeIndex] ?? gallery[0];

  return (
    <div className="flex gap-4">
      {gallery.length > 1 && (
        <div className="order-2 flex w-full shrink-0 grid grid-cols-4 gap-3 lg:order-1 lg:flex lg:w-20 lg:grid-cols-1">
          {gallery.map((img, i) => {
            const thumbnailAlt = img.altText ?? `${title} ${i + 1}`;

            return (
              <button
                key={`${img.url}-${i}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Voir l'image ${i + 1}`}
                className="relative aspect-square min-h-11 w-full overflow-hidden rounded-sm border border-line bg-surface transition-all focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                style={{
                  border: `1px solid ${i === activeIndex ? "var(--gold)" : "var(--line)"}`,
                }}
              >
                {/* SafeImage : 3 paliers d'erreur aussi sur les miniatures. */}
                <div
                  className="relative min-h-11 w-full overflow-hidden rounded-sm"
                  aria-label={thumbnailAlt}
                >
                  <SafeImage
                    src={img.url}
                    alt={thumbnailAlt}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div
        className="relative order-1 aspect-[3/4] min-h-0 flex-1 overflow-hidden rounded-sm border border-line bg-surface shadow-sm"
        style={{ background: "var(--surface-2)" }}
      >
        {/* SafeImage : URL produit → visuel de marque → SVG officiel. */}
        <SafeImage
          key={active.url}
          src={active.url}
          alt={active.altText ?? title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {active.role && (
          <span className="absolute bottom-3 left-3 rounded-sm border border-white/25 bg-[#101B2A]/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5F0E7] backdrop-blur-sm">
            {roleForImage(active.role)}
          </span>
        )}
      </div>
    </div>
  );
}
