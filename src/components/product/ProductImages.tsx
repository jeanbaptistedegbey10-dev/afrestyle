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
import type { ShopifyImage } from "@/lib/shopify/types";
import { VARIANT_IMAGE_EVENT, type VariantChangeDetail } from "./ProductForm";
import { FALLBACK_IMAGE_ALT, getSvgPlaceholder } from "@/lib/assets/images";
import SafeImage from "@/components/ui/SafeImage";

export default function ProductImages({
  images,
  title,
}: {
  images: ShopifyImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [variantImage, setVariantImage] = useState<ShopifyImage | null>(null);

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
        <div className="flex flex-col gap-3 w-20">
          {gallery.map((img, i) => {
            const thumbnailAlt = img.altText ?? `${title} ${i + 1}`;

            return (
              <button
                key={`${img.url}-${i}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Voir l'image ${i + 1}`}
                className="relative aspect-square overflow-hidden rounded-sm transition-all"
                style={{
                  border: `1px solid ${i === activeIndex ? "var(--gold)" : "var(--line)"}`,
                }}
              >
                {/* SafeImage : 3 paliers d'erreur aussi sur les miniatures. */}
                <SafeImage
                  src={img.url}
                  alt={thumbnailAlt}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}

      <div
        className="relative flex-1 aspect-[3/4] overflow-hidden rounded-sm"
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
        {variantImage && activeIndex === 0 && (
          <span
            className="absolute left-3 top-3 text-[11px] uppercase tracking-widest px-2 py-1 rounded-sm"
            style={{ background: "rgba(255,255,255,0.92)", color: "var(--text)" }}
          >
            Variante
          </span>
        )}
      </div>
    </div>
  );
}
