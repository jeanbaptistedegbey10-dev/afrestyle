// src/components/ui/SafeImage.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Wrapper next/image avec gestion d'erreur (composant client) :
//   1. `src` — média Shopify / CDN réellement publié ;
//   2. placeholder SVG local AfroStyle — TOUJOURS affichable, aucun réseau.
//
//  ⚠️ Le projet n'héberge plus aucun lien externe codé en dur : l'ancien
//  deuxième palier (« FALLBACK_PRODUCT_IMAGE », une URL Unsplash) a été
//  supprimé car il renvoyait des 404. Le repli est désormais généré locally.
// ────────────────────────────────────────────────────────────────────────────
"use client";

import Image from "next/image";
import { useState } from "react";
import {
  FALLBACK_IMAGE_ALT,
  getSvgPlaceholder,
  type PlaceholderRatio,
} from "@/lib/assets/images";

type SafeImageProps = Omit<React.ComponentProps<typeof Image>, "src"> & {
  /** Source réelle, OU `null` si le visuel est absent (metaobject sans média). */
  src: string | null | undefined;
  /** `alt` du visuel éditorial affiché lorsque la source produit échoue. */
  fallbackAlt?: string;
  /** Format du placeholder local (bannière, portrait, produit…). */
  placeholderRatio?: PlaceholderRatio;
  /** Libellé imprimé sur le placeholder. */
  placeholderLabel?: string;
};

export default function SafeImage({
  src,
  alt,
  fallbackAlt = FALLBACK_IMAGE_ALT,
  placeholderRatio = "product",
  placeholderLabel,
  ...rest
}: SafeImageProps) {
  // `failed` passe à `true` dès que l'URL d'origine n'a pas pu être chargée.
  const [failed, setFailed] = useState(false);

  // Source absente dès le départ OU échec réseau : on sert le placeholder local.
  const useFallback = failed || !src;
  const resolvedSrc = useFallback
    ? getSvgPlaceholder({ ratio: placeholderRatio, label: placeholderLabel })
    : src;
  const resolvedAlt = useFallback ? fallbackAlt : alt;

  return (
    <Image
      {...rest}
      src={resolvedSrc}
      alt={resolvedAlt}
      onError={useFallback ? undefined : () => setFailed(true)}
    />
  );
}