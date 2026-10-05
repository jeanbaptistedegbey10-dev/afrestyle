// src/lib/assets/images.ts
// ────────────────────────────────────────────────────────────────────────────
//  PLACEHOLDERS DE MARQUE AFROSTYLE — 100 % locaux, 0 requête réseau.
// ────────────────────────────────────────────────────────────────────────────
//
//  ⚠️ PLUS AUCUNE URL « images.unsplash.com » DANS LE CODE.
//
//  Audit HTTP du CDN : les identifiants Unsplash codés en dur étaient
//  majoritairement INEXISTANTS (réponses 404) et laissaient des cadres noirs
//  sur l'accueil. Tous les replis « externes » sont donc remplacés par des SVG
//  générés localement, aux couleurs exactes de la charte AfroStyle
//  (ivoire / champagne / bleu nuit / obsidienne).
//
//  Trois usages :
//   1. repli produit — la pièce n'a aucune image Shopify exploitable ;
//   2. dernier palier de <SafeImage /> — l'URL distante a échoué (404/timeout) ;
//   3. visuel éditorial — un metaobject `hero_slide` / `home_section` n'a pas
//      d'image publiée : la section reste MALGRÉ TOUT rendue, sur un cadre de
//      marque plutôt que sur une image cassée.
//
//  Le repli est un `data:` URI : aucune entrée `images.remotePatterns` n'est
//  requise dans `next.config.js` — il n'y a plus aucun domaine externe.
// ────────────────────────────────────────────────────────────────────────────

/** Palette AfroStyle — doit rester alignée sur `src/app/globals.css`. */
const PALETTE = {
  ivory: "#FAF8F5",
  champagne: "#C5A059",
  band: "#101B2A",
  obsidian: "#0D0D0D",
} as const;

/** Format éditorial attendu pour chaque emplacement de l'accueil. */
export type PlaceholderRatio = "product" | "portrait" | "landscape" | "banner";

const RATIOS: Record<PlaceholderRatio, { width: number; height: number }> = {
  product: { width: 800, height: 1000 },
  portrait: { width: 900, height: 1200 },
  landscape: { width: 1600, height: 900 },
  banner: { width: 1920, height: 820 },
};

/** Échappe les caractères interdits dans un nœud texte XML. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Complète une URL du CDN Shopify avec ses paramètres de transformation.
 *
 * Shopify sert les médias en pleine résolution (parfois 4000 px de large) : le
 * Hero n'en affiche que ~1920. On demande donc la variante à la bonne largeur
 * EN AMONT, pour que l'imageur Next.js ne récupère jamais le fichier original.
 *
 * ⚠️ On ne touche QUE les hôtes CDN Shopify : une source distante ou une donnée
 * locale ne doit jamais être réécrite (les query strings y ont un sens
 * éditorial : `?auto=format&fit=crop&w=…`).
 */
export function withShopifyCdnWidth(url: string, width: number): string {
  if (!url || !url.startsWith("https://cdn.shopify.com/")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}width=${Math.round(width)}`;
}

/**
 * Compose le SVG de repli : dégradé bleu nuit → obsidienne, trame « kente »
 * champagne et monogramme AfroStyle. `seed` décale la trame pour que deux
 * visuels de repli d'une même grille ne soient jamais identiques.
 */
function buildSvg({
  width,
  height,
  label,
  seed,
}: {
  width: number;
  height: number;
  label: string;
  seed: number;
}): string {
  const cx = width / 2;
  const cy = height / 2;
  const unit = Math.min(width, height);
  const radius = Math.round(unit * 0.26);
  const step = Math.max(24, Math.round(unit * 0.06));
  // Décalage déterministe : même `seed` → même trame (rendu ISR stable).
  const offset = (seed % 7) * 8;
  const textSize = Math.max(11, Math.round(unit * 0.035));
  const subSize = Math.max(9, Math.round(unit * 0.022));

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}">`,
    "<defs>",
    '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0%" stop-color="${PALETTE.band}"/>`,
    `<stop offset="55%" stop-color="${PALETTE.obsidian}"/>`,
    `<stop offset="100%" stop-color="${PALETTE.obsidian}"/>`,
    "</linearGradient>",
    '<radialGradient id="glow" cx="50%" cy="42%" r="58%">',
    `<stop offset="0%" stop-color="${PALETTE.champagne}" stop-opacity="0.18"/>`,
    `<stop offset="100%" stop-color="${PALETTE.champagne}" stop-opacity="0"/>`,
    "</radialGradient>",
    `<pattern id="kente" width="${step * 2}" height="${step * 2}" patternUnits="userSpaceOnUse" patternTransform="translate(${offset} ${offset})">`,
    `<rect width="${step}" height="${step * 2}" fill="${PALETTE.champagne}" opacity="0.07"/>`,
    `<rect x="${step}" width="2" height="${step * 2}" fill="${PALETTE.champagne}" opacity="0.12"/>`,
    `<rect x="${step + 10}" width="2" height="${step * 2}" fill="${PALETTE.champagne}" opacity="0.05"/>`,
    `<rect y="${step}" width="${step * 2}" height="1" fill="${PALETTE.champagne}" opacity="0.09"/>`,
    "</pattern>",
    "</defs>",
    `<rect width="${width}" height="${height}" fill="url(#bg)"/>`,
    `<rect width="${width}" height="${height}" fill="url(#kente)"/>`,
    `<rect width="${width}" height="${height}" fill="url(#glow)"/>`,
    '<g fill="none">',
    `<circle cx="${cx}" cy="${cy}" r="${radius}" stroke="${PALETTE.champagne}" stroke-opacity="0.3" stroke-width="1.5"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${Math.round(radius * 0.62)}" stroke="${PALETTE.champagne}" stroke-opacity="0.16" stroke-width="1"/>`,
    "</g>",
    `<text x="${cx}" y="${Math.round(cy + textSize * 0.35)}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${textSize}" letter-spacing="${Math.max(2, Math.round(textSize * 0.14))}" fill="${PALETTE.champagne}">AfroStyle</text>`,
    `<rect x="${Math.round(cx - radius * 0.55)}" y="${Math.round(cy + radius * 0.42)}" width="${Math.round(radius * 1.1)}" height="1" fill="${PALETTE.champagne}" opacity="0.5"/>`,
    `<text x="${cx}" y="${Math.round(cy + radius * 0.42 + subSize * 2.1)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${subSize}" letter-spacing="${Math.max(2, Math.round(subSize * 0.16))}" fill="${PALETTE.ivory}" fill-opacity="0.62">${escapeXml(label.toUpperCase())}</text>`,
    "</svg>",
  ].join("");
}

/** Mémoïsation : le SVG ne dépend que du ratio / label / seed. */
const PLACEHOLDER_CACHE = new Map<string, string>();

/**
 * Placeholder SVG de marque (data-URI), aux couleurs de la charte AfroStyle.
 *
 * Remplace l'ancien `FALLBACK_PRODUCT_IMAGE` (lien Unsplash codé en dur qui
 * renvoyait 404). Rétro-compatible : l'appel sans argument reste valide.
 *
 * @param ratio  format éditorial attendu (pilote le viewBox width/height)
 * @param label  libellé affiché sous le monogramme (ex. « Visuel produit »)
 * @param seed   décale la trame : deux replis d'une même grille diffèrent
 */
export function getSvgPlaceholder({
  ratio = "product",
  label = "Visuel indisponible",
  seed = 0,
}: { ratio?: PlaceholderRatio; label?: string; seed?: number } = {}): string {
  const key = `${ratio}|${label}|${seed}`;
  const cached = PLACEHOLDER_CACHE.get(key);
  if (cached) return cached;

  const { width, height } = RATIOS[ratio];
  const encoded = encodeURIComponent(buildSvg({ width, height, label, seed }));
  const uri = `data:image/svg+xml;charset=UTF-8,${encoded}`;

  PLACEHOLDER_CACHE.set(key, uri);
  return uri;
}

/** Repli produit — data-URI local, jamais une requête réseau. */
export const FALLBACK_PRODUCT_IMAGE: string = getSvgPlaceholder({
  ratio: "product",
  label: "Visuel produit",
});

/** Texte alternatif accessible pour le fallback produit. */
export const FALLBACK_IMAGE_ALT: string =
  "Visuel de repli AfroStyle — la photo de cette création n'est pas encore disponible";

/**
 * `true` si l'URL est un placeholder local (data-URI / blob) : ces visuels ne
 * sont jamais publiables sur les réseaux sociaux ni importables dans Shopify.
 */
export function isLocalPlaceholder(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("data:") || url.startsWith("blob:");
}
