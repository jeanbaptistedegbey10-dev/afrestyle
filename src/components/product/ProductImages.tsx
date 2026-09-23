// src/components/product/ProductImages.tsx
// Galerie + synchro image de variante (pilotée par ProductForm via event).
//
// Règle d'or visuelle :
// - L'image active doit TOUJOURS avoir une source saine (fallback si absent).
// - Les dimensions affichées proviennent de l'image sélectionnée (produit ou variante),
//   pas de valeurs en dur, pour conserver un ratio et un srcset cohérents.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ShopifyImage } from "@/lib/shopify/types";
import { VARIANT_IMAGE_EVENT, type VariantChangeDetail } from "./ProductForm";
import { FALLBACK_PRODUCT_IMAGE, FALLBACK_IMAGE_ALT, getSvgPlaceholder } from "@/lib/assets/images";

/** Image de secours élégante quand une image produit est absente/expirée. */

export default function ProductImages({
  images,
  title,
}: {
  images: ShopifyImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [variantImage, setVariantImage] = useState<ShopifyImage | null>(null);
  const [errorUrls, setErrorUrls] = useState<Set<string>>(new Set());

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
    // Aucune image Shopify disponible — affiche un placeholder élégant
    // au lieu de rien (retour null) pour ne pas vider la grille produit.
    return (
      <div className="flex gap-4">
        <div className="relative flex-1 aspect-[3/4] overflow-hidden rounded-sm bg-surface border border-line">
          <Image
            src={FALLBACK_PRODUCT_IMAGE}
            alt={FALLBACK_IMAGE_ALT}
            fill
            className="object-cover opacity-60"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-text-3 uppercase tracking-wider">
              Aucune image disponible
            </span>
          </div>
        </div>
      </div>
    );
  }

  const active = gallery[activeIndex] ?? gallery[0];
  const activeImage = active && !errorUrls.has(active.url) ? active : null;

  function handleThumbnailError(url: string) {
    setErrorUrls((prev) => new Set(prev).add(url));
  }

  return (
    <div className="flex gap-4">
      {gallery.length > 1 && (
        <div className="flex flex-col gap-3 w-20">
          {gallery.map((img, i) => {
            const thumbnailSrc =
              !errorUrls.has(img.url) ? img.url : FALLBACK_PRODUCT_IMAGE;
            const thumbnailAlt = img.altText ?? `${title} ${i + 1}`;

            return (
              <button
                key={`${img.url}-${i}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Voir l'image ${i + 1}`}
                className="relative aspect-square overflow-hidden rounded-sm transition-all"
                style={{
                  border: `1px solid ${i === activeIndex ? "#C5A059" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                <Image
                  src={thumbnailSrc}
                  alt={thumbnailAlt}
                  fill
                  className="object-cover"
                  onError={() => handleThumbnailError(img.url)}
                />
              </button>
            );
          })}
        </div>
      )}

      <div
        className="relative flex-1 aspect-[3/4] overflow-hidden rounded-sm"
        style={{ background: "#F0ECE4" }}
      >
        {activeImage ? (
          <>
            <Image
              key={activeImage.url}
              src={activeImage.url}
              alt={activeImage.altText ?? title}
              width={activeImage.width}
              height={activeImage.height}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => handleThumbnailError(activeImage.url)}
            />
            {variantImage && activeIndex === 0 && (
              <span
                className="absolute left-3 top-3 text-[11px] uppercase tracking-widest px-2 py-1 rounded-sm"
                style={{ background: "rgba(255,255,255,0.92)", color: "#1A1A1A" }}
              >
                Variante
              </span>
            )}
          </>
          ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={getSvgPlaceholder()}
              alt={FALLBACK_IMAGE_ALT}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
