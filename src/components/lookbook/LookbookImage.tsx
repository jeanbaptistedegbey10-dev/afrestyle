// src/components/lookbook/LookbookImage.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Image produit pour la page Lookbook — **composant client**.
//
//  Délègue intégralement à <SafeImage /> : les 3 paliers d'erreur sont gérés
//  au même endroit pour toute l'application (URL Shopify → visuel de marque →
//  SVG officiel AfroStyle). Aucune logique de fallback dupliquée ici.
// ────────────────────────────────────────────────────────────────────────────
"use client";

import SafeImage from "@/components/ui/SafeImage";

type LookbookImageProps = Omit<
  React.ComponentProps<typeof SafeImage>,
  "alt"
> & {
  src: string;
  alt: string;
};

export default function LookbookImage(props: LookbookImageProps) {
  return <SafeImage {...props} />;
}
