// src/components/lookbook/LookbookImage.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Image produit pour la page Lookbook — **composant client** car il gère
//  l'état d'erreur de chargement (`onError` côté navigateur).
//
//  Bug corrigé : la page lookbook utilisait `onError={() => {}}` — un
//  gestionnaire vide qui ne faisait rien quand une image Shopify échouait
//  au chargement. Ce composant capture l'erreur et bascule automatiquement
//  vers une image de repli élégante (URL Unsplash authentique).
// ────────────────────────────────────────────────────────────────────────────
"use client";

import Image from "next/image";
import { useState } from "react";
import { FALLBACK_PRODUCT_IMAGE, getSvgPlaceholder } from "@/lib/assets/images";

type LookbookImageProps = Omit<
  React.ComponentProps<typeof Image>,
  "src" | "alt"
> & {
  src: string;
  alt: string;
};

export default function LookbookImage({ src, alt, ...rest }: LookbookImageProps) {
  const [errored, setErrored] = useState(false);
  const [fallbackErrored, setFallbackErrored] = useState(false);
  // 3 paliers : image Shopify → fallback Unsplash → SVG local (toujours affichable).
  const resolvedSrc = fallbackErrored
    ? getSvgPlaceholder()
    : errored
      ? FALLBACK_PRODUCT_IMAGE
      : src;

  return (
    <Image
      {...rest}
      src={resolvedSrc}
      alt={alt}
      onError={() => {
        if (fallbackErrored) return;
        if (errored) setFallbackErrored(true);
        else setErrored(true);
      }}
    />
  );
}
