// src/lib/assets/images.ts
// ────────────────────────────────────────────────────────────────────────────
//  Images de secours élégantes — **jamais** de données mock produit.
//
//  Ces constantes sont utilisées UNIQUEMENT comme visuel de repli quand :
//  - un produit Shopify n'a aucune image (ou l'image a expiré) ;
//  - une image échoue au chargement côté client.
//
//  Elles proviennent d'images réelles (Unsplash) ou d'un placeholder SVG
//  généré localement — aucune donnée produit factice n'intervient.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Visuel de secours de marque (modèle en Pagne Wax, photo éditoriale
 * AfroStyle) — **jamais** un portant/magasin générique.
 * URL vérifiée HTTP 200 (audit images). Dernier palier de repli :
 * le SVG officiel `getSvgPlaceholder()`.
 */
export const FALLBACK_PRODUCT_IMAGE: string =
  "https://images.unsplash.com/photo-1696962678565-bee84e6b9cb6?auto=format&fit=crop&w=800&q=80";

/** Texte alternatif accessible pour le fallback produit. */
export const FALLBACK_IMAGE_ALT: string =
  "Visuel de repli AfroStyle — création en Wax de la collection";

/**
 * Génère un placeholder SVG élégant (ratio 3/4, palette or sur fond sombre)
 * utilisé côté client quand aucune URL distante ne peut être chargée.
 * Retourne une data-URI `data:image/svg+xml,…` utilisable directement comme
 * `src` d'une balise <img> ou next/image.
 */
export function getSvgPlaceholder(): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><defs><linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0f0f0f"/><stop offset="100%" stop-color="#0d0d0d"/></linearGradient></defs><rect width="800" height="1000" fill="url(#b)"/><g transform="translate(400 380)" fill="none"><circle cx="0" cy="0" r="90" fill="rgba(212,175,55,0.08)"/><circle cx="0" cy="0" r="60" fill="rgba(212,175,55,0.04)"/></g><text x="400" y="560" text-anchor="middle" font-family="serif" font-size="24" fill="#d4af37" font-weight="400">AfroStyle</text><text x="400" y="595" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#a0a0a0" letter-spacing="2">Visuel produit</text></svg>';
  const encoded = encodeURIComponent(svg).replace(/'/g, "%27");
  return `data:image/svg+xml;charset=UTF-8,${encoded}`;
}
