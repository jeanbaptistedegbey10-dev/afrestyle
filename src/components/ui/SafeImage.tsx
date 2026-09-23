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
import { FALLBACK_PRODUCT_IMAGE, getSvgPlaceholder } from "@/lib/assets/images";

type SafeImageProps = Omit<React.ComponentProps<typeof Image>, "src"> & {
  src: string;
};

export default function SafeImage({ src, alt, ...rest }: SafeImageProps) {
  // 0 = URL d'origine · 1 = fallback Unsplash · 2 = SVG local (dernier rempart)
  const [tier, setTier] = useState<0 | 1 | 2>(0);

  const resolvedSrc =
    tier === 2 ? getSvgPlaceholder() : tier === 1 ? FALLBACK_PRODUCT_IMAGE : src;

  return (
    <Image
      {...rest}
      src={resolvedSrc}
      alt={alt}
      onError={
        tier === 2
          ? undefined
          : () => setTier((t) => (t === 0 ? 1 : 2))
      }
    />
  );
}