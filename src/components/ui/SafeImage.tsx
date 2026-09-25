// src/components/ui/SafeImage.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Wrapper next/image avec gestion d'erreur 3 paliers (composant client) :
//   1. URL distante (Unsplash / Shopify CDN)
//   2. FALLBACK_PRODUCT_IMAGE (visuel vérifié)
//   3. Placeholder SVG local en data-URI (toujours affichable, aucun réseau)
//  Utilisé par les sections éditoriales (« Nos univers », « L'élégance en
//  images », hero, story) qui n'avaient AUCUN `onError` : une URL morte
//  y affichait un bloc noir vide.
// ────────────────────────────────────────────────────────────────────────────
"use client";

import Image from "next/image";
import { useState } from "react";
import {
  FALLBACK_IMAGE_ALT,
  FALLBACK_PRODUCT_IMAGE,
  getSvgPlaceholder,
} from "@/lib/assets/images";

type SafeImageProps = Omit<React.ComponentProps<typeof Image>, "src"> & {
  src: string;
  /** `alt` du visuel éditorial affiché lorsque la source produit échoue. */
  fallbackAlt?: string;
};

export default function SafeImage({
  src,
  alt,
  fallbackAlt = FALLBACK_IMAGE_ALT,
  ...rest
}: SafeImageProps) {
  // 0 = URL d'origine · 1 = image éditoriale de repli · 2 = SVG local.
  const [state, setState] = useState<{ source: string; tier: 0 | 1 | 2 }>({
    source: src,
    tier: 0,
  });
  // Réinitialisation sans effet : évite un rendu intermédiaire avec l'ancienne
  // source et respecte la règle react-hooks/set-state-in-effect.
  const tier = state.source === src ? state.tier : 0;

  const resolvedSrc =
    tier === 2 ? getSvgPlaceholder() : tier === 1 ? FALLBACK_PRODUCT_IMAGE : src;
  const resolvedAlt = tier === 0 ? alt : fallbackAlt;

  return (
    <Image
      {...rest}
      src={resolvedSrc}
      alt={resolvedAlt}
      onError={
        tier === 2
          ? undefined
          : () => setState({ source: src, tier: tier === 0 ? 1 : 2 })
      }
    />
  );
}