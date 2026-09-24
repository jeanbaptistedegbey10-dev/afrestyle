// src/lib/shopify/image-pipeline.ts
// ────────────────────────────────────────────────────────────────────────────
//  PIPELINE D'IMAGES PRODUITS — brief éditorial + recherche multi-sources.
//
//  Ce module est la SOURCE DE VÉRITÉ de trois choses :
//   1. le BRIEF d'images e-commerce haut de gamme (AFROSTYLE_IMAGE_BRIEF) qui
//      décrit la direction artistique attendue pour chaque visuel produit ;
//   2. la RECHERCHE d'images : requêtes diversifiées (fiche + tags pays /
//      matière / style) envoyées à plusieurs sources (Unsplash API, Pexels API,
//      Openverse, Wikimedia Commons) + un pool curaté hors-ligne ;
//   3. les TEXTES ALTERNATIFS (`alt`) descriptifs et factuels générés pour
//      chaque image (accessibilité WCAG 2.2 — 1.1.1 « Contenu non textuel »).
//
//  Règles de conception :
//   • SERVEUR UNIQUEMENT (fetch sortant, aucun secret en dur) — jamais importé
//     dans un composant `"use client"`.
//   • ZÉRO dépendance interne : ce fichier n'importe rien afin de pouvoir être
//     chargé aussi bien par Next.js (`@/lib/shopify/image-pipeline`) que par un
//     script CLI exécuté avec `tsx` (`../src/lib/shopify/image-pipeline`).
//   • Aucune exception ne remonte : une source indisponible renvoie `[]`, un
//     visuel invalide est écarté, le meilleur candidat vérifié gagne.
//
//  Unicité : l'appelant fournit l'ensemble des URLs déjà utilisées
//  (`usedImageUrls`) ; ces visuels sont écartés afin que chaque produit reçoive
//  une image principale UNIQUE.
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
//  1. BRIEF ÉDITORIAL (direction artistique des visuels produits)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Brief d'images e-commerce haut de gamme AfroStyle.
 *
 * Tout visuel produit assigné automatiquement doit respecter cette direction :
 * produit porté, posture naturelle, lumière studio douce, fond sobre,
 * conservation stricte des coupes et des motifs, prise de vue plein pied.
 */
export const AFROSTYLE_IMAGE_BRIEF =
  "Photographie éditoriale de mode africaine contemporaine haut de gamme. " +
  "Produit porté par un mannequin avec posture naturelle et élégante, " +
  "éclairage studio doux, fond sobre et épuré. " +
  "Conservation stricte des coupes, motifs (Wax, Kente, Bogolan) et textures. " +
  "Prise de vue plein pied et cadrages de précision.";

/**
 * Déclinaison opérationnelle du brief : fragments injectés dans les requêtes de
 * recherche d'images (les moteurs indexent en anglais, les termes français du
 * brief sont donc doublés par leur équivalent anglais).
 */
export const IMAGE_BRIEF_QUERY_TOKENS: readonly string[] = [
  "editorial fashion photography",
  "contemporary african fashion",
  "model wearing outfit full body",
  "natural elegant pose",
  "soft studio lighting",
  "plain clean background",
  "full length shot",
  "handmade african textile",
];

/** Cadrages alignés sur « prise de vue plein pied et cadrages de précision ». */
export const IMAGE_CADRAGES: readonly string[] = [
  "prise de vue plein pied",
  "cadrage de précision sur le motif",
  "vue rapprochée de la matière",
  "cadrage de précision sur la coupe",
];

/** Largeur minimale acceptée pour un visuel produit (netteté du cadrage). */
export const IMAGE_MIN_WIDTH = 800;
/** Largeur demandée aux CDN pour l'image principale (qualité haut de gamme). */
export const IMAGE_TARGET_WIDTH = 1600;
/** Qualité JPEG demandée aux CDN. */
export const IMAGE_TARGET_QUALITY = 85;
/** Délai maximal d'une vérification d'URL (ms). */
const VERIFY_TIMEOUT_MS = 9000;
/** Délai maximal d'une requête de recherche (ms). */
const SEARCH_TIMEOUT_MS = 11000;
/** User-Agent explicite (exigé par les API Wikimedia / Openverse). */
const PIPELINE_USER_AGENT =
  "afrestyle-image-pipeline/1.0 (+https://afrestyle.vercel.app)";

// ────────────────────────────────────────────────────────────────────────────
//  2. CONTEXTE PRODUIT → FAITS ÉDITORIAUX
// ────────────────────────────────────────────────────────────────────────────

/** Contexte produit minimal nécessaire pour choisir un visuel pertinent. */
export type ProductImageContext = {
  /** Identifiant Shopify (gid ou numérique) — sert de graine déterministe. */
  id?: string | null;
  handle?: string | null;
  title: string;
  vendor?: string | null;
  /** Type Shopify (« Vêtement », « Accessoire »…). */
  productType?: string | null;
  tags?: string[] | null;
  /** Champs déjà normalisés par la couche produit (facultatifs). */
  country?: string | null;
  fabric?: string | null;
  style?: string | null;
};

/** Faits éditoriaux dérivés d'une fiche produit (langue FR + termes de recherche EN). */
export type ProductImageFacts = {
  title: string;
  seed: string;
  tags: string[];
  fabric: string | null;
  fabricFr: string | null;
  fabricEn: string[];
  country: string | null;
  countryFr: string | null;
  countryEn: string | null;
  style: string | null;
  styleFr: string | null;
  styleEn: string[];
  gender: "femme" | "homme" | "unisexe" | null;
  productTypeFr: string;
  isAccessory: boolean;
};

const FABRIC_DICTIONARY: Record<string, { fr: string; en: string[] }> = {
  wax: { fr: "wax", en: ["wax print", "ankara", "african print"] },
  kente: { fr: "kente", en: ["kente cloth", "kente"] },
  bogolan: { fr: "bogolan", en: ["bogolan", "mud cloth"] },
  bazin: { fr: "bazin riche", en: ["bazin", "brocade"] },
  kanga: { fr: "kanga", en: ["kanga", "kitenge"] },
  kitenge: { fr: "kitenge", en: ["kitenge", "african fabric"] },
  coton: { fr: "coton", en: ["cotton"] },
  soie: { fr: "soie", en: ["silk"] },
  ndop: { fr: "ndop", en: ["ndop", "indigo cloth"] },
  toghu: { fr: "toghu", en: ["toghu", "embroidered cloth"] },
  raphia: { fr: "raphia", en: ["raffia"] },
  lin: { fr: "lin", en: ["linen"] },
  dentelle: { fr: "dentelle", en: ["lace"] },
};

const COUNTRY_DICTIONARY: Record<string, { fr: string; en: string }> = {
  benin: { fr: "Bénin", en: "Benin" },
  ghana: { fr: "Ghana", en: "Ghana" },
  senegal: { fr: "Sénégal", en: "Senegal" },
  mali: { fr: "Mali", en: "Mali" },
  nigeria: { fr: "Nigeria", en: "Nigeria" },
  "cote-divoire": { fr: "Côte d'Ivoire", en: "Ivory Coast" },
  cameroun: { fr: "Cameroun", en: "Cameroon" },
  kenya: { fr: "Kenya", en: "Kenya" },
  guinee: { fr: "Guinée", en: "Guinea" },
  togo: { fr: "Togo", en: "Togo" },
  "burkina-faso": { fr: "Burkina Faso", en: "Burkina Faso" },
  tanzanie: { fr: "Tanzanie", en: "Tanzania" },
  ethiopie: { fr: "Éthiopie", en: "Ethiopia" },
  "afrique-du-sud": { fr: "Afrique du Sud", en: "South Africa" },
  maroc: { fr: "Maroc", en: "Morocco" },
  rwanda: { fr: "Rwanda", en: "Rwanda" },
  gabon: { fr: "Gabon", en: "Gabon" },
  congo: { fr: "Congo", en: "Congo" },
};

const STYLE_DICTIONARY: Record<string, { fr: string; en: string[] }> = {
  moderne: { fr: "coupe contemporaine", en: ["modern", "contemporary cut"] },
  traditionnel: {
    fr: "inspiration traditionnelle",
    en: ["traditional", "ceremonial"],
  },
  luxe: { fr: "esprit couture", en: ["luxury", "haute couture", "elegant"] },
  streetwear: { fr: "esprit streetwear", en: ["streetwear", "urban"] },
  "sur-mesure": {
    fr: "pièce sur-mesure",
    en: ["tailored", "bespoke", "atelier"],
  },
  ethique: {
    fr: "confection éthique",
    en: ["sustainable", "upcycled", "handmade"],
  },
  broderie: { fr: "broderie main", en: ["embroidery", "embroidered"] },
  upcyclage: { fr: "pièce upcyclée", en: ["upcycled", "recycled"] },
};

/** Extrait la valeur d'un tag préfixé (`pays-benin` → `benin`). */
function readPrefixedTag(tags: string[], prefix: string): string | null {
  const found = tags.find((tag) => tag.toLowerCase().startsWith(`${prefix}-`));
  if (!found) return null;
  return found.slice(prefix.length + 1).trim().toLowerCase() || null;
}

/**
 * Transforme une fiche produit (Shopify brut ou normalisé) en faits éditoriaux
 * exploitables pour la recherche d'images et la génération des `alt`.
 */
export function deriveImageFacts(ctx: ProductImageContext): ProductImageFacts {
  const tags = (ctx.tags ?? []).map((tag) => String(tag));
  const lowerTags = tags.map((tag) => tag.toLowerCase());

  const fabric =
    (ctx.fabric ? String(ctx.fabric).toLowerCase() : null) ??
    readPrefixedTag(lowerTags, "tissu");
  const country =
    (ctx.country ? String(ctx.country).toLowerCase() : null) ??
    readPrefixedTag(lowerTags, "pays");
  const style =
    (ctx.style ? String(ctx.style).toLowerCase() : null) ??
    readPrefixedTag(lowerTags, "style");

  const fabricEntry = fabric ? FABRIC_DICTIONARY[fabric] : undefined;
  const countryEntry = country ? COUNTRY_DICTIONARY[country] : undefined;
  const styleEntry = style ? STYLE_DICTIONARY[style] : undefined;

  const hasFemme = lowerTags.includes("femme");
  const hasHomme = lowerTags.includes("homme");
  const gender =
    hasFemme && hasHomme
      ? "unisexe"
      : lowerTags.includes("unisexe")
        ? "unisexe"
        : hasFemme
          ? "femme"
          : hasHomme
            ? "homme"
            : null;

  const rawType = (ctx.productType ?? "").toLowerCase();
  const isAccessory =
    rawType.includes("accessoire") || lowerTags.includes("accessoire");
  const productTypeFr = isAccessory
    ? "accessoire"
    : rawType.includes("vêtement") ||
        rawType.includes("vetement") ||
        rawType.includes("fashion") ||
        !rawType
      ? "vêtement"
      : rawType;

  return {
    title: ctx.title,
    seed: ctx.id || ctx.handle || ctx.title,
    tags,
    fabric,
    fabricFr: fabricEntry?.fr ?? fabric,
    fabricEn: fabricEntry?.en ?? (fabric ? [fabric] : []),
    country,
    countryFr: countryEntry?.fr ?? country,
    countryEn: countryEntry?.en ?? country,
    style,
    styleFr: styleEntry?.fr ?? style,
    styleEn: styleEntry?.en ?? (style ? [style] : []),
    gender,
    productTypeFr,
    isAccessory,
  };
}

/**
 * Ensemble de mots-clés (FR + EN) décrivant un produit : sert à mesurer la
 * pertinence d'un visuel candidat vis-à-vis de la fiche et de ses tags.
 */
export function productKeywordSet(facts: ProductImageFacts): string[] {
  const keywords = new Set<string>();
  if (facts.fabric) keywords.add(facts.fabric);
  for (const term of facts.fabricEn) keywords.add(term);
  if (facts.country) keywords.add(facts.country);
  if (facts.countryEn) keywords.add(facts.countryEn.toLowerCase());
  if (facts.style) keywords.add(facts.style);
  for (const term of facts.styleEn) keywords.add(term);
  if (facts.gender) keywords.add(facts.gender);
  keywords.add(facts.isAccessory ? "accessory" : "clothing");
  for (const tag of facts.tags) keywords.add(tag.toLowerCase());
  return [...keywords].filter(Boolean);
}

// ────────────────────────────────────────────────────────────────────────────
//  3. TEXTES ALTERNATIFS DESCRIPTIFS ET FACTUELS (`alt`)
// ────────────────────────────────────────────────────────────────────────────

export type BuildImageAltOptions = {
  /** Rang du visuel dans la galerie (1 = principal). */
  position?: number;
  /**
   * Description fournie par la source (métadonnées de l'image). Elle n'est
   * ajoutée que lorsqu'elle a été nettoyée ; aucune mise en scène n'est inventée.
   */
  visualDescription?: string | null;
  /**
   * `generated` décrit les cartes SVG produites par le seed DEV. Dans ce cas,
   * `price` est le prix réellement écrit sur la carte.
   */
  kind?: "product" | "generated";
  price?: string | null;
};

/**
 * Construit un `alt` descriptif et factuel pour un visuel produit.
 *
 * Le texte s'appuie uniquement sur la fiche (titre, type, matière, style, pays)
 * et, si elle est disponible, sur la description retournée par la source du
 * visuel. Il ne suppose ni mannequin, ni pose, ni éclairage, ni cadrage : ces
 * caractéristiques seraient invérifiables depuis les métadonnées Shopify.
 */
export function buildImageAlt(
  ctx: ProductImageContext,
  options: BuildImageAltOptions = {},
): string {
  const facts = deriveImageFacts(ctx);
  const position = Math.max(1, Math.floor(options.position ?? 1));
  const type = facts.isAccessory ? "un accessoire" : `un ${facts.productTypeFr}`;
  const matiere = facts.fabricFr ? ` en ${facts.fabricFr}` : "";
  const details = [`${type}${matiere}`];
  if (facts.styleFr) details.push(`style ${facts.styleFr}`);
  if (facts.countryFr) details.push(`pays associé : ${facts.countryFr}`);

  if (options.kind === "generated") {
    const brand = ctx.vendor?.trim();
    const price = options.price?.trim();
    return (
      `Carte produit générée pour ${facts.title}` +
      (brand ? `, ${brand}` : "") +
      (price ? `, avec le prix ${price} € indiqué` : "") +
      "."
    );
  }

  const rank = position === 1 ? "visuel principal" : `visuel complémentaire ${position}`;
  const sourceDescription = stripHtml(options.visualDescription)
    ?.replace(/\s+/g, " ")
    .trim();
  const usefulDescription =
    sourceDescription &&
    !sourceDescription.startsWith("http") &&
    !sourceDescription.toLocaleLowerCase("fr").includes("file:")
      ? sourceDescription.slice(0, 220).trim()
      : null;
  const visual = usefulDescription
    ? ` ${usefulDescription.charAt(0).toUpperCase()}${usefulDescription.slice(1).replace(/[.!?]+$/, "")}.`
    : "";



  return `${facts.title} — ${rank} : ${details.join(", ")}.${visual}`;
}

/** Vrai si l'`alt` existant est vide ou se contente de répéter le titre produit. */
export function isDescriptiveAlt(
  alt: string | null | undefined,
  ctx: ProductImageContext,
): boolean {
  const value = (alt ?? "").trim();
  if (value.length < 30) return false;
  const normalized = value.toLocaleLowerCase("fr");
  const title = ctx.title.trim().toLocaleLowerCase("fr");
  if (title && (normalized === title || normalized === `${title}.`)) return false;
  if (normalized.includes("http://") || normalized.includes("https://")) return false;

  const hasProductDescription =
    normalized.includes("visuel") ||
    normalized.includes("photograph") ||
    normalized.includes("carte produit") ||
    normalized.includes("mannequin") ||
    normalized.includes("modèle") ||
    normalized.includes("porté") ||
    normalized.includes("détail") ||
    normalized.includes("tissu") ||
    normalized.includes("motif");
  return hasProductDescription;
}

// ────────────────────────────────────────────────────────────────────────────
//  4. CANDIDATS D'IMAGES : REQUÊTES, SOURCES, SCORE, VÉRIFICATION
// ────────────────────────────────────────────────────────────────────────────

/** Source d'un visuel candidat. */
export type ProductImageSource =
  | "unsplash"
  | "pexels"
  | "openverse"
  | "wikimedia"
  | "curated";

/** Visuel candidat enrichi (métadonnées de provenance incluses). */
export type ProductImageCandidate = {
  /** URL finale (déjà dimensionnée pour le web). */
  url: string;
  source: ProductImageSource;
  width: number | null;
  height: number | null;
  /** Auteur / crédit (obligatoire pour les licences CC BY / BY-SA). */
  credit: string | null;
  /** Licence déclarée par la source. */
  license: string | null;
  /** Page d'origine du visuel (Commons, Flickr, Unsplash…). */
  origin: string | null;
  /** Description factuelle du visuel (issue de la source ou du pool curaté). */
  label: string | null;
  /** Requête ayant produit le candidat. */
  query: string;
  /** Score de pertinence / qualité (plus grand = meilleur). */
  score: number;
};

/** Options communes aux fonctions de recherche. */
export type ImageSearchOptions = {
  /** URLs déjà utilisées : écartées pour garantir l'unicité des visuels. */
  usedImageUrls?: Iterable<string>;
  /** Sources interrogées (défaut : toutes celles disponibles). */
  sources?: ProductImageSource[];
  /** Nombre maximal de requêtes envoyées (défaut : 3). */
  maxQueries?: number;
  /** Résultats demandés par source et par requête (défaut : 12). */
  perSourceLimit?: number;
  /** Largeur minimale acceptée (défaut : IMAGE_MIN_WIDTH). */
  minWidth?: number;
  /** Vérifie réellement l'URL avant de la retenir (défaut : true). */
  verify?: boolean;
};

/** Hash FNV-1a — graine déterministe (même produit ⇒ même point de départ). */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Vrai si l'URL ne peut pas être importée par Shopify (placeholder local). */
export function isPlaceholderImageUrl(url: string): boolean {
  return !url || url.startsWith("data:") || url.startsWith("blob:") || url.endsWith(".svg");
}

/**
 * Clé d'identité d'un visuel : deux URLs de tailles différentes désignant la
 * même photo produisent la même clé (garantit l'unicité réelle des visuels).
 */
export function imageKey(url: string): string {
  const withoutQuery = (url || "").split("?")[0].split("#")[0].toLowerCase();
  return withoutQuery
    .replace(/\/(\d+)px-/g, "/") // miniature Wikimedia
    .replace(/_(b|c|h|k|m|n|q|s|t|z|w)\.(jpe?g|png)$/g, ".$2") // tailles Flickr
    .replace(/^https?:\/\//, "");
}

/** Largeur de miniature Wikimedia demandée (au-delà de l'original → HTTP 400). */
export const IMAGE_WIKIMEDIA_THUMB_WIDTH = 1280;

/** Ajoute / remplace les paramètres CDN d'une URL image. */
export function toDisplayUrl(
  url: string,
  width: number = IMAGE_TARGET_WIDTH,
  quality: number = IMAGE_TARGET_QUALITY,
): string {
  if (!url) return url;
  if (/images\.unsplash\.com\//.test(url)) {
    const [base, query] = url.split("?");
    const params = new URLSearchParams(query ?? "");
    params.set("auto", "format");
    // `crop` recadrerait le sujet : la brief demande un sujet entier.
    params.delete("crop");
    params.set("fit", "max");
    params.set("w", String(Math.max(1, width)));
    params.set("q", String(Math.min(100, Math.max(1, quality))));
    return `${base}?${params.toString()}`;
  }
  if (/upload\.wikimedia\.org\/.*\/thumb\//.test(url)) {
    // Wikimedia refuse les miniatures plus larges que l'original (HTTP 400) :
    // on plafonne la largeur demandée à la taille générée du pool.
    const requested = Math.min(width, IMAGE_WIKIMEDIA_THUMB_WIDTH);
    return url.replace(/\/(\d+)px-/, `/${requested}px-`);
  }
  return url;
}

/**
 * Construit une liste ORDONNÉE de requêtes de recherche pour un produit :
 * combinaisons du brief éditorial + tags (matière, pays, style, genre).
 * L'ordre est décalé par la graine du produit afin que deux fiches proches ne
 * sollicitent pas la même requête en premier (diversification des résultats).
 */
export function buildImageSearchQueries(
  ctx: ProductImageContext,
  options: { limit?: number } = {},
): string[] {
  const facts = deriveImageFacts(ctx);
  const limit = Math.max(1, options.limit ?? 3);
  const genderEn =
    facts.gender === "femme" ? "woman" : facts.gender === "homme" ? "man" : "model";
  const fabricEn = facts.fabricEn[0] ?? "african print";
  const countryEn = facts.countryEn ?? "";
  const typeEn = facts.isAccessory ? "accessory" : "outfit";
  const styleEn = facts.styleEn[0] ?? "contemporary";

  const rawQueries = [
    `${fabricEn} ${typeEn} african ${genderEn} ${IMAGE_BRIEF_QUERY_TOKENS[0]}`,
    `${countryEn} ${fabricEn} traditional ${typeEn} model ${IMAGE_BRIEF_QUERY_TOKENS[4]}`,
    `${fabricEn} ${styleEn} ${genderEn} african fashion ${IMAGE_BRIEF_QUERY_TOKENS[6]}`,
    `${fabricEn} ${IMAGE_BRIEF_QUERY_TOKENS[7]} pattern detail`,
    `${ctx.title} ${countryEn} african fashion`,
    `contemporary african fashion ${genderEn} ${IMAGE_BRIEF_QUERY_TOKENS[3]}`,
    `african ${typeEn} ${fabricEn} ${genderEn} studio editorial portrait`,
    `${countryEn} african fashion ${styleEn} ${facts.isAccessory ? "jewelry" : "clothing"}`,
    `${ctx.title} ${fabricEn} ${styleEn} fashion detail`,
  ];

  // Normalise puis déduplique les requêtes (ex. deux produits sans tag pays).
  const seen = new Set<string>();
  const queries: string[] = [];
  for (const raw of rawQueries) {
    const query = raw.replace(/\s+/g, " ").trim();
    const key = query.toLowerCase();
    if (query.length <= 8 || seen.has(key)) continue;
    seen.add(key);
    queries.push(query);
  }

  if (queries.length === 0) return [];

  // Décalage déterministe : deux fiches proches ne partent pas de la même requête.
  const offset = hashString(facts.seed) % queries.length;
  const rotated = [...queries.slice(offset), ...queries.slice(0, offset)];
  return rotated.slice(0, limit);
}

// ─── Filtres de licence (usage commercial uniquement) ───────────────────────

/** Rejette les licences NC (non commercial) / ND (pas de dérivé). */
function isCommercialLicense(license: string | null | undefined): boolean {
  if (!license) return true; // licence inconnue : cas traité par la source
  const value = license.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  if (value.includes("noncommercial") || value.includes("noderiv")) return false;
  return !/(^|-)(nc|nd)(-|$)/.test(value);
}

/** Requête HTTP JSON tolérante : renvoie `null` au lieu de lever une erreur. */
async function httpJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = SEARCH_TIMEOUT_MS,
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": PIPELINE_USER_AGENT,
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Retire les balises HTML des métadonnées (crédits, descriptions Commons). */
function stripHtml(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

/** Normalise une URL Flickr vers une taille web raisonnable (≤ 1024 px). */
function normalizeFlickrUrl(url: string): string {
  if (!/staticflickr\.com\//.test(url)) return url;
  return url.replace(/_(o|m|n|q|s|t|z|c)\.(jpe?g|png)$/i, "_b.$2");
}

/** Candidat brut renvoyé par une source, avant score et requête. */
type RawCandidate = Omit<ProductImageCandidate, "query" | "score"> & {
  title?: string | null;
};

// ─── Sources de recherche (une fonction par fournisseur) ────────────────────

/** Unsplash API officielle (`UNSPLASH_ACCESS_KEY`) — qualité éditoriale. */
async function searchUnsplashApi(
  query: string,
  limit: number,
  minWidth: number,
): Promise<RawCandidate[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY ?? process.env.UNSPLASH_API_KEY;
  if (!key) return [];

  const url =
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
    `&per_page=${limit}&orientation=portrait&content_filter=high`;
  const data = await httpJson<{
    results?: {
      urls: { raw: string; regular: string };
      width: number;
      height: number;
      alt_description: string | null;
      description: string | null;
      user?: { name?: string };
      links?: { html?: string };
    }[];
  }>(url, {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
  });

  return (data?.results ?? [])
    .filter((photo) => (photo.width ?? 0) >= minWidth)
    .map((photo) => ({
      url: toDisplayUrl(photo.urls.raw || photo.urls.regular),
      source: "unsplash" as ProductImageSource,
      width: photo.width,
      height: photo.height,
      credit: photo.user?.name ?? "Unsplash",
      license: "Unsplash License",
      origin: photo.links?.html ?? "https://unsplash.com",
      label: photo.alt_description ?? photo.description ?? null,
      title: photo.description ?? photo.alt_description ?? null,
    }));
}

/** Pexels API (`PEXELS_API_KEY`) — banque complémentaire d'images libres. */
async function searchPexelsApi(
  query: string,
  limit: number,
  minWidth: number,
): Promise<RawCandidate[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
    `&per_page=${limit}&orientation=portrait`;
  const data = await httpJson<{
    photos?: {
      src: { large2x: string; large: string; original: string };
      width: number;
      height: number;
      alt: string | null;
      photographer: string | null;
      url: string | null;
    }[];
  }>(url, { headers: { Authorization: key } });

  return (data?.photos ?? [])
    .filter((photo) => (photo.width ?? 0) >= minWidth)
    .map((photo) => ({
      url: photo.src.large2x || photo.src.large || photo.src.original,
      source: "pexels" as ProductImageSource,
      width: photo.width,
      height: photo.height,
      credit: photo.photographer ?? "Pexels",
      license: "Pexels License",
      origin: photo.url ?? "https://www.pexels.com",
      label: photo.alt ?? null,
      title: photo.alt ?? null,
    }));
}

/** Openverse (agrégateur CC, sans clé) — diversité de sources et de pays. */
async function searchOpenverse(
  query: string,
  limit: number,
  minWidth: number,
): Promise<RawCandidate[]> {
  const url =
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
    `&page_size=${limit}&mature=false&license_type=commercial`;
  const data = await httpJson<{
    results?: {
      url: string;
      thumbnail?: string | null;
      width: number;
      height: number;
      title: string | null;
      creator: string | null;
      license: string | null;
      foreign_landing_url: string | null;
      provider: string | null;
    }[];
  }>(url);

  return (data?.results ?? [])
    .filter(
      (item) =>
        (item.width ?? 0) >= minWidth && isCommercialLicense(item.license),
    )
    .map((item) => ({
      url: normalizeFlickrUrl(item.url),
      source: "openverse" as ProductImageSource,
      width: item.width,
      height: item.height,
      credit: item.creator ?? item.provider ?? "Openverse",
      license: item.license ? `CC ${item.license.toUpperCase()}` : null,
      origin: item.foreign_landing_url ?? "https://openverse.org",
      label: item.title ?? null,
      title: item.title ?? null,
    }));
}

/** Wikimedia Commons (API publique, licences libres) — fonds documentaire. */
async function searchWikimedia(
  query: string,
  limit: number,
  minWidth: number,
): Promise<RawCandidate[]> {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6` +
    `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime|extmetadata` +
    `&iiurlwidth=${IMAGE_TARGET_WIDTH}`;
  const data = await httpJson<{
    query?: {
      pages?: Record<
        string,
        {
          title: string;
          imageinfo?: {
            url: string;
            thumburl?: string;
            width: number;
            height: number;
            mime: string;
            descriptionurl?: string;
            extmetadata?: Record<string, { value?: string }>;
          }[];
        }
      >;
    };
  }>(url);

  const candidates: RawCandidate[] = [];

  for (const page of Object.values(data?.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (!/^image\/(jpeg|png|webp)$/.test(info.mime)) continue;
    if ((info.width ?? 0) < minWidth) continue;

    const meta = info.extmetadata ?? {};
    const license = stripHtml(meta.LicenseShortName?.value);
    if (!isCommercialLicense(license)) continue;

    candidates.push({
      url: (info.thumburl || info.url).split("?")[0],
      source: "wikimedia",
      width: info.width,
      height: info.height,
      credit: stripHtml(meta.Artist?.value) ?? "Wikimedia Commons",
      license,
      origin: info.descriptionurl ?? "https://commons.wikimedia.org",
      label: stripHtml(meta.ImageDescription?.value) ?? stripHtml(page.title),
      title: stripHtml(page.title),
    });
  }

  return candidates;
}

// ─── Score de pertinence (fiche + tags + brief) ─────────────────────────────

type CandidateScore = {
  score: number;
  /** Nombre de tags structurants trouvés dans les métadonnées réelles. */
  structuralMatches: number;
};

/** Évalue un candidat à partir des faits produit et de ses métadonnées sources. */
function scoreCandidate(
  candidate: RawCandidate,
  facts: ProductImageFacts,
): CandidateScore {
  const factMetadata = [candidate.title, candidate.label, candidate.origin]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en");
  const includes = (term: string) => factMetadata.includes(term.toLocaleLowerCase("en"));

  let score = 0;
  let structuralMatches = 0;

  if (facts.fabricEn.some(includes)) {
    score += 7;
    structuralMatches++;
  }
  if (
    (facts.countryEn && includes(facts.countryEn)) ||
    (facts.countryFr && includes(facts.countryFr))
  ) {
    score += 5;
    structuralMatches++;
  }
  if (facts.styleEn.some(includes)) {
    score += 3;
    structuralMatches++;
  }

  const genderEn =
    facts.gender === "femme" ? "woman" : facts.gender === "homme" ? "man" : "model";
  if (includes(genderEn)) score += 2;

  if (facts.isAccessory) {
    if (/(accessor|bag|jewel|scarf|hat|sac|pochette|bijou)/.test(factMetadata)) {
      score += 3;
      structuralMatches++;
    }
  } else if (
    /(dress|outfit|garment|robe|shirt|suit|boubou|agbada|clothing|fashion)/.test(
      factMetadata,
    )
  ) {
    score += 3;
    structuralMatches++;
  }

  if (/(fashion|model|mannequin|runway|podium|défil|defil)/.test(factMetadata)) {
    score += 3;
  }
  if (/(pattern|textile|fabric|motif|tissu)/.test(factMetadata)) score += 1;
  if (/(african|afrique)/.test(factMetadata)) score += 1;

  const width = candidate.width ?? 0;
  const height = candidate.height ?? 0;
  if (width >= IMAGE_TARGET_WIDTH) score += 3;
  else if (width >= 1200) score += 2;
  else if (width >= IMAGE_MIN_WIDTH) score += 1;
  if (width > 0 && height >= width) score += 2;
  if (candidate.source === "unsplash" || candidate.source === "pexels") score += 1;

  return { score, structuralMatches };
}

// ─── Vérification réelle d'un visuel (netteté / disponibilité) ──────────────

/** Résultat d'une vérification d'URL distante. */
export type ImageVerification = {
  ok: boolean;
  status: number | null;
  contentType: string | null;
  bytes: number | null;
};

/**
 * Vérifie qu'une URL sert bien une image exploitable : statut 200/206, type
 * `image/*` (jamais un SVG ni une page HTML) et charge utile suffisante.
 */
export async function verifyImageUrl(
  url: string,
  _options: { minWidth?: number } = {},
): Promise<ImageVerification> {
  const invalid: ImageVerification = {
    ok: false,
    status: null,
    contentType: null,
    bytes: null,
  };
  if (isPlaceholderImageUrl(url)) return invalid;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": PIPELINE_USER_AGENT, Range: "bytes=0-65535" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });

    const contentType = response.headers.get("content-type");
    const lengthHeader = response.headers.get("content-length");
    const bytes = lengthHeader ? Number(lengthHeader) : null;

    try {
      await response.body?.cancel();
    } catch {
      // Le corps est déjà consommé / non lisible : sans conséquence.
    }

    const okStatus = response.status === 200 || response.status === 206;
    const okType =
      !!contentType && contentType.startsWith("image/") && !contentType.includes("svg");
    // 206 = réponse partielle (Range) : la taille ne reflète pas le fichier.
    const okBytes = response.status === 206 || bytes === null || bytes > 8 * 1024;

    return {
      ok: okStatus && okType && okBytes,
      status: response.status,
      contentType,
      bytes,
    };
  } catch {
    return invalid;
  }
}

// ─── Orchestrateur : requêtes × sources → candidats classés et vérifiés ─────

/** Sources actuellement exploitables (clé API présente ou source ouverte). */
export function listConfiguredSources(): ProductImageSource[] {
  const sources: ProductImageSource[] = [];
  if (process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY) {
    sources.push("unsplash");
  }
  if (process.env.PEXELS_API_KEY) sources.push("pexels");
  // Sources ouvertes, sans clé : toujours disponibles.
  sources.push("openverse", "wikimedia");
  return sources;
}

/** Interroge une source donnée (aucune exception ne remonte). */
async function fetchFromSource(
  source: ProductImageSource,
  query: string,
  limit: number,
  minWidth: number,
): Promise<RawCandidate[]> {
  switch (source) {
    case "unsplash":
      return searchUnsplashApi(query, limit, minWidth);
    case "pexels":
      return searchPexelsApi(query, limit, minWidth);
    case "openverse":
      return searchOpenverse(query, limit, minWidth);
    case "wikimedia":
      return searchWikimedia(query, limit, minWidth);
    default:
      return [];
  }
}

/**
 * Recherche des visuels pour un produit : plusieurs requêtes (brief + tags)
 * envoyées en parallèle à plusieurs sources, dédoublonnées par identité de
 * photo, scorées puis vérifiées (les meilleurs d'abord).
 *
 * Les URLs listées dans `usedImageUrls` sont écartées : chaque produit reçoit
 * ainsi une image principale unique.
 */
export async function searchProductImages(
  ctx: ProductImageContext,
  options: ImageSearchOptions = {},
): Promise<ProductImageCandidate[]> {
  const facts = deriveImageFacts(ctx);
  const minWidth = options.minWidth ?? IMAGE_MIN_WIDTH;
  const perSourceLimit = options.perSourceLimit ?? 12;
  const sources = (options.sources ?? listConfiguredSources()).filter(
    (source) => source !== "curated",
  );
  const queries = buildImageSearchQueries(ctx, {
    limit: options.maxQueries ?? 3,
  });

  if (sources.length === 0 || queries.length === 0) return [];

  const usedKeys = new Set<string>();
  for (const url of options.usedImageUrls ?? []) usedKeys.add(imageKey(url));

  const collected = new Map<string, ProductImageCandidate>();

  for (const query of queries) {
    const batches = await Promise.all(
      sources.map((source) => fetchFromSource(source, query, perSourceLimit, minWidth)),
    );

    for (const raw of batches.flat()) {
      if (!raw.url || isPlaceholderImageUrl(raw.url)) continue;
      const key = imageKey(raw.url);
      if (!key || usedKeys.has(key)) continue;

      const relevance = scoreCandidate(raw, facts);
      const hasStructuredTags =
        facts.fabric !== null || facts.country !== null || facts.style !== null;
      if (hasStructuredTags && relevance.structuralMatches === 0) continue;

      const scored: ProductImageCandidate = {
        ...raw,
        query,
        score: relevance.score,
      };
      const existing = collected.get(key);
      if (!existing || scored.score > existing.score) collected.set(key, scored);
    }
  }

  // La requête n'apporte pas de preuve de correspondance. On conserve
  // néanmoins les résultats génériques comme dernier recours seulement.
  const sorted = [...collected.values()].sort(
    (a, b) => b.score - a.score || a.query.localeCompare(b.query),
  );
  if (options.verify === false) return sorted;

  // Vérifie en parallèle les meilleurs candidats et ne garde que les valides.
  const probes = await Promise.all(
    sorted.slice(0, 6).map((candidate) => verifyImageUrl(candidate.url)),
  );
  return sorted.slice(0, 6).filter((_candidate, index) => probes[index].ok);
}

/**
 * Sélectionne l'image principale d'un produit : meilleur candidat de recherche
 * vérifié, sinon repli sur le pool curaté (hors-ligne, licences libres).
 */
export async function findProductMainImage(
  ctx: ProductImageContext,
  options: ImageSearchOptions = {},
): Promise<ProductImageCandidate | null> {
  const searched = await searchProductImages(ctx, options);
  if (searched.length > 0) return searched[0];
  return selectCuratedImage(ctx, { usedImageUrls: options.usedImageUrls });
}

/** Formate le crédit d'un visuel (obligatoire pour les licences CC BY / BY-SA). */
export function formatImageCredit(candidate: ProductImageCandidate): string {
  const parts = [candidate.credit?.trim(), candidate.license?.trim()].filter(
    Boolean,
  );
  if (candidate.origin) parts.push(candidate.origin as string);
  return parts.join(" — ");
}

// ────────────────────────────────────────────────────────────────────────────
//  5. POOL CURATÉ (repli hors-ligne, licences libres, brief respecté)
//
//  Chaque entrée a été VÉRIFIÉE (HTTP 200, `image/jpeg`, largeur utile) et sa
//  licence autorise un usage commercial. Les crédits sont conservés pour
//  satisfaire les obligations d'attribution (CC BY / CC BY-SA) : ils sont
//  repris dans `formatImageCredit()` et dans le rapport généré par le script
//  `scripts/auto-assign-shopify-images.ts`.
// ────────────────────────────────────────────────────────────────────────────

/** Entrée du pool curaté. */
export type CuratedImageEntry = {
  url: string;
  source: "unsplash" | "wikimedia";
  /** Mots-clés de rattachement (matière, pays, genre, type de pièce). */
  keywords: string[];
  /** Description factuelle du visuel. */
  label: string;
  credit: string;
  license: string;
  origin: string;
  width: number;
  height: number;
};

/** URL CDN Unsplash (les paramètres de taille sont ajoutés par `toDisplayUrl`). */
const U = (id: string) => `https://images.unsplash.com/${id}`;

/**
 * Visuels éditoriaux Unsplash déjà utilisés par la mise en page AfroStyle
 * (hero, univers, lookbook) — reuse autorisé par la licence Unsplash.
 */
const CURATED_UNSPLASH: CuratedImageEntry[] = [
  {
    url: U("photo-1614291129226-41dae34c2128"),
    source: "unsplash",
    keywords: ["editorial", "femme", "luxe"],
    label: "silhouette éditoriale en tenue africaine contemporaine",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1696962678565-bee84e6b9cb6"),
    source: "unsplash",
    keywords: ["editorial", "femme", "wax"],
    label: "silhouette en pagne wax lors d'une séance éditoriale",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1667366982563-dbeedf5281b9"),
    source: "unsplash",
    keywords: ["editorial", "homme", "kente"],
    label: "silhouette masculine en tenue africaine contemporaine",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1493655161922-ef98929de9d8"),
    source: "unsplash",
    keywords: ["editorial", "accessoire", "wax"],
    label: "accessoires africains présentés en studio",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1708170236295-20ab8fbadcef"),
    source: "unsplash",
    keywords: ["editorial", "femme", "bazin", "luxe", "sur-mesure"],
    label: "grand boubou porté lors d'une séance éditoriale",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1531123414780-f74242c2b052"),
    source: "unsplash",
    keywords: ["editorial", "kente", "femme"],
    label: "silhouette en pagne sur fond sobre",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1578509566163-068acd11b8e7"),
    source: "unsplash",
    keywords: ["editorial", "kente", "homme"],
    label: "tenue en kente présentée en studio",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1687052001151-316f9356dbc0"),
    source: "unsplash",
    keywords: ["editorial", "wax"],
    label: "portrait éditorial d'une tenue en wax",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1611853904829-6d0f4034ce2f"),
    source: "unsplash",
    keywords: ["editorial", "wax", "moderne", "cote-divoire"],
    label: "tenue en wax contemporain portée en extérieur",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1625646741211-711bdd65c570"),
    source: "unsplash",
    keywords: ["editorial", "soie", "accessoire"],
    label: "étoffe de soie drapée, détail de matière",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1515658323406-25d61c141a6e"),
    source: "unsplash",
    keywords: ["editorial", "accessoire", "femme", "mali"],
    label: "parure de perles et coiffure tressée",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
  {
    url: U("photo-1567401893414-76b7b1e5a7a5"),
    source: "unsplash",
    keywords: ["editorial", "wax", "femme", "traditionnel"],
    label: "tenue traditionnelle en pagne imprimé portée par un mannequin",
    credit: "Unsplash",
    license: "Unsplash License",
    origin: "https://unsplash.com",
    width: 1600,
    height: 2000,
  },
];

/** Raccourci de déclaration d'un visuel Wikimedia Commons (licence + crédit). */
function W(
  url: string,
  keywords: string[],
  label: string,
  credit: string,
  license: string,
  origin: string,
  width: number,
  height: number,
): CuratedImageEntry {
  return { url, source: "wikimedia", keywords, label, credit, license, origin, width, height };
}

const COMMONS_FILE = (file: string) =>
  `https://commons.wikimedia.org/wiki/File:${file}`;

/**
 * Visuels Wikimedia Commons sélectionnés pour leur pertinence éditoriale
 * (défilés, tenues traditionnelles, détails de tissus) et leur licence
 * compatible avec un usage commercial.
 */
const CURATED_WIKIMEDIA: CuratedImageEntry[] = [
  // ── Bénin ──────────────────────────────────────────────────────────────────
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bazin_riche.jpg/1280px-Bazin_riche.jpg",
    ["bazin", "benin", "femme", "luxe", "traditionnel"],
    "tenue en bazin riche portée par un mannequin",
    "Osia Zannou",
    "CC BY-SA 4.0",
    COMMONS_FILE("Bazin_riche.jpg"),
    657,
    1280,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Culture_and_apparel.jpg/1280px-Culture_and_apparel.jpg",
    ["benin", "femme", "wax", "traditionnel"],
    "tenue traditionnelle béninoise portée lors d'une séance photo",
    "Chimène Chalvet",
    "CC BY-SA 4.0",
    COMMONS_FILE("Culture_and_apparel.jpg"),
    4000,
    6000,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Clothing_and_cultue.jpg/1280px-Clothing_and_cultue.jpg",
    ["benin", "homme", "traditionnel"],
    "tenue béninoise portée par un mannequin, plein pied",
    "Chimène Chalvet",
    "CC BY-SA 4.0",
    COMMONS_FILE("Clothing_and_cultue.jpg"),
    4000,
    6000,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Collection_Nou-Yoyo_au_d%C3%A9fil%C3%A9_Benin_Fashion_Runway_2022_01.jpg/1280px-Collection_Nou-Yoyo_au_d%C3%A9fil%C3%A9_Benin_Fashion_Runway_2022_01.jpg",
    ["benin", "femme", "luxe", "wax", "moderne"],
    "silhouette de la collection Nou-Yoyo au défilé Benin Fashion Runway 2022",
    "Freed Armel",
    "CC BY-SA 4.0",
    COMMONS_FILE("Collection_Nou-Yoyo_au_défilé_Benin_Fashion_Runway_2022_01.jpg"),
    863,
    1051,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Collection_Nou-Yoyo_au_d%C3%A9fil%C3%A9_Benin_Fashion_Runway_2022_04.jpg/1280px-Collection_Nou-Yoyo_au_d%C3%A9fil%C3%A9_Benin_Fashion_Runway_2022_04.jpg",
    ["benin", "femme", "luxe", "sur-mesure", "moderne"],
    "silhouette de la collection Nou-Yoyo au défilé Benin Fashion Runway 2022",
    "Freed Armel",
    "CC BY-SA 4.0",
    COMMONS_FILE("Collection_Nou-Yoyo_au_défilé_Benin_Fashion_Runway_2022_04.jpg"),
    798,
    1090,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Collection_Nou-Yoyo_au_d%C3%A9fil%C3%A9_Benin_Fashion_Runway_2022_06.jpg/1280px-Collection_Nou-Yoyo_au_d%C3%A9fil%C3%A9_Benin_Fashion_Runway_2022_06.jpg",
    ["benin", "homme", "luxe", "wax"],
    "silhouette de la collection Nou-Yoyo au défilé Benin Fashion Runway 2022",
    "Freed Armel",
    "CC BY-SA 4.0",
    COMMONS_FILE("Collection_Nou-Yoyo_au_défilé_Benin_Fashion_Runway_2022_06.jpg"),
    863,
    1029,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Collection_Nou-Yoyo_au_d%C3%A9fil%C3%A9_Benin_Fashion_Runway_2022_08.jpg/1280px-Collection_Nou-Yoyo_au_d%C3%A9fil%C3%A9_Benin_Fashion_Runway_2022_08.jpg",
    ["benin", "femme", "wax", "luxe"],
    "silhouette de la collection Nou-Yoyo au défilé Benin Fashion Runway 2022",
    "Freed Armel",
    "CC BY-SA 4.0",
    COMMONS_FILE("Collection_Nou-Yoyo_au_défilé_Benin_Fashion_Runway_2022_08.jpg"),
    735,
    1117,
  ),

  // ── Ghana (kente, accessoires) ─────────────────────────────────────────────
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Ghanaian_bride_in_traditional_Kente_cloth_with_bridal_fan.jpg/1280px-Ghanaian_bride_in_traditional_Kente_cloth_with_bridal_fan.jpg",
    ["kente", "ghana", "femme", "traditionnel", "luxe"],
    "mariée ghanéenne en tenue traditionnelle kente avec éventail",
    "Kofiarkohbaidoo",
    "CC BY-SA 4.0",
    COMMONS_FILE("Ghanaian_bride_in_traditional_Kente_cloth_with_bridal_fan.jpg"),
    4020,
    5723,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Kete_Dancer.jpg/1280px-Kete_Dancer.jpg",
    ["kente", "ghana", "homme", "traditionnel"],
    "danseur kete en tenue kente traditionnelle",
    "Ahiaticourage",
    "CC BY-SA 4.0",
    COMMONS_FILE("Kete_Dancer.jpg"),
    3456,
    4178,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/North_Ghana_Traditional_Kente.jpg/1280px-North_Ghana_Traditional_Kente.jpg",
    ["kente", "ghana", "homme", "traditionnel"],
    "tenue traditionnelle en kente du nord du Ghana",
    "Sbbpoole69",
    "CC BY-SA 4.0",
    COMMONS_FILE("North_Ghana_Traditional_Kente.jpg"),
    3024,
    4032,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Traditional_Kente_of_Volta_region.jpg/1280px-Traditional_Kente_of_Volta_region.jpg",
    ["kente", "ghana", "coton", "traditionnel"],
    "détail d'un kente tissé main de la région de la Volta",
    "Warmglow",
    "CC0",
    COMMONS_FILE("Traditional_Kente_of_Volta_region.jpg"),
    3120,
    4160,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Kente_from_Volta_region%2C_Design_of_the_palm_tree.jpg/1280px-Kente_from_Volta_region%2C_Design_of_the_palm_tree.jpg",
    ["kente", "ghana", "coton"],
    "détail du motif « palmier » d'un kente de la Volta (Ghana)",
    "Warmglow",
    "CC0",
    COMMONS_FILE("Kente_from_Volta_region,_Design_of_the_palm_tree.jpg"),
    3120,
    4160,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Jewelry_fashion_show%2C_Ghana.jpg/1280px-Jewelry_fashion_show%2C_Ghana.jpg",
    ["ghana", "accessoire", "femme", "luxe"],
    "présentation de bijoux lors d'un défilé de mode au Ghana",
    "ZSM",
    "CC BY-SA 4.0",
    COMMONS_FILE("Jewelry_fashion_show,_Ghana.jpg"),
    2176,
    3264,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/A_Kente_Festival.jpg/1280px-A_Kente_Festival.jpg",
    ["kente", "ghana", "traditionnel"],
    "cérémonie du festival kente au Ghana, tenues traditionnelles",
    "Ahiaticourage",
    "CC BY-SA 4.0",
    COMMONS_FILE("A_Kente_Festival.jpg"),
    5184,
    3058,
  ),

  // ── Nigeria (défilés) ─────────────────────────────────────────────────────
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/LFDW3_-56.jpg/1280px-LFDW3_-56.jpg",
    ["nigeria", "femme", "moderne", "luxe"],
    "mannequin sur le podium du Lagos Fashion Week",
    'Chidi "Lex Ash" Ashimole',
    "CC BY-SA 4.0",
    COMMONS_FILE("LFDW3_-56.jpg"),
    1667,
    2500,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/LFDW3_-64.jpg/1280px-LFDW3_-64.jpg",
    ["nigeria", "femme", "moderne", "luxe"],
    "mannequin sur le podium du Lagos Fashion Week",
    'Chidi "Lex Ash" Ashimole',
    "CC BY-SA 4.0",
    COMMONS_FILE("LFDW3_-64.jpg"),
    1667,
    2500,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/LFDW3_-129.jpg/1280px-LFDW3_-129.jpg",
    ["nigeria", "femme", "moderne", "sur-mesure"],
    "mannequin sur le podium du Lagos Fashion Week",
    'Chidi "Lex Ash" Ashimole',
    "CC BY-SA 4.0",
    COMMONS_FILE("LFDW3_-129.jpg"),
    1667,
    2500,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/LFDW3_-135.jpg/1280px-LFDW3_-135.jpg",
    ["nigeria", "homme", "moderne", "streetwear"],
    "mannequin sur le podium du Lagos Fashion Week",
    'Chidi "Lex Ash" Ashimole',
    "CC BY-SA 4.0",
    COMMONS_FILE("LFDW3_-135.jpg"),
    1667,
    2500,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Pelli_at_a_fashion_show%2C_April_2012.jpg/1280px-Pelli_at_a_fashion_show%2C_April_2012.jpg",
    ["nigeria", "femme", "moderne"],
    "mannequin lors d'un défilé de mode à Lagos",
    "Greengreenboi",
    "CC BY-SA 3.0",
    COMMONS_FILE("Pelli_at_a_fashion_show,_April_2012.jpg"),
    1280,
    1920,
  ),

  // ── Mali (bogolan) ────────────────────────────────────────────────────────
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/BogolanMali3.JPG/1280px-BogolanMali3.JPG",
    ["bogolan", "mali", "coton", "traditionnel"],
    "tissu bogolan teint à la main au Mali",
    "BluesyPete",
    "CC BY-SA 3.0",
    COMMONS_FILE("BogolanMali3.JPG"),
    2201,
    2934,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/BogolanMali31.JPG/1280px-BogolanMali31.JPG",
    ["bogolan", "mali", "coton"],
    "détail d'un bogolan malien, teinture naturelle à la boue",
    "BluesyPete",
    "CC BY-SA 3.0",
    COMMONS_FILE("BogolanMali31.JPG"),
    2304,
    3072,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/BogolanMali32.JPG/1280px-BogolanMali32.JPG",
    ["bogolan", "mali", "coton", "sur-mesure"],
    "bogolan malien présenté à plat, motif géométrique",
    "BluesyPete",
    "CC BY-SA 3.0",
    COMMONS_FILE("BogolanMali32.JPG"),
    2027,
    2805,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/S%C3%A9gou_%2811%29.JPG/1280px-S%C3%A9gou_%2811%29.JPG",
    ["bogolan", "mali", "femme", "traditionnel"],
    "tenue en bogolan portée à Ségou (Mali)",
    "Oberson",
    "CC BY-SA 4.0",
    COMMONS_FILE("Ségou_(11).JPG"),
    1200,
    1600,
  ),

  // ── Cameroun (toghu, ndop) ────────────────────────────────────────────────
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Toghu.jpg/1280px-Toghu.jpg",
    ["toghu", "cameroun", "homme", "traditionnel"],
    "tenue traditionnelle toghu du Nord-Ouest du Cameroun",
    "Serieminou",
    "CC BY-SA 4.0",
    COMMONS_FILE("Toghu.jpg"),
    3000,
    4000,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Robes_Toghu.jpg/1280px-Robes_Toghu.jpg",
    ["toghu", "cameroun", "femme", "luxe", "broderie"],
    "robes toghu brodées main du Cameroun",
    "Serieminou",
    "CC BY-SA 4.0",
    COMMONS_FILE("Robes_Toghu.jpg"),
    3000,
    4000,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Toghu_clotch._Vetement_en_toghu_du_Cameroun.jpg/1280px-Toghu_clotch._Vetement_en_toghu_du_Cameroun.jpg",
    ["toghu", "cameroun", "ndop", "homme", "traditionnel"],
    "vêtement en toghu du Cameroun porté par un mannequin",
    "Serieminou",
    "CC BY-SA 4.0",
    COMMONS_FILE("Toghu_clotch._Vetement_en_toghu_du_Cameroun.jpg"),
    3000,
    4000,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Toghu_cloth%2C_north_west_region_cameroon.jpg/1280px-Toghu_cloth%2C_north_west_region_cameroon.jpg",
    ["toghu", "cameroun", "coton"],
    "détail d'un tissu toghu de la région du Nord-Ouest du Cameroun",
    "Serieminou",
    "CC BY-SA 4.0",
    COMMONS_FILE("Toghu_cloth,_north_west_region_cameroon.jpg"),
    3000,
    4000,
  ),

  // ── Togo (accessoires en pagne wax) ───────────────────────────────────────
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cr%C3%A9ation%2C_sac_de_sortie_pour_femme_en_pagne_Wax_01.jpg/1280px-Cr%C3%A9ation%2C_sac_de_sortie_pour_femme_en_pagne_Wax_01.jpg",
    ["wax", "togo", "accessoire", "femme"],
    "sac à main en pagne wax fait main (Lomé)",
    "Step May",
    "CC BY-SA 4.0",
    COMMONS_FILE("Création,_sac_de_sortie_pour_femme_en_pagne_Wax_01.jpg"),
    1920,
    1280,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Cr%C3%A9ation%2C_sac_de_sortie_pour_femme_en_pagne_Wax_02.jpg/1280px-Cr%C3%A9ation%2C_sac_de_sortie_pour_femme_en_pagne_Wax_02.jpg",
    ["wax", "togo", "accessoire", "femme"],
    "sac en pagne wax fait main, détail des finitions",
    "Step May",
    "CC BY-SA 4.0",
    COMMONS_FILE("Création,_sac_de_sortie_pour_femme_en_pagne_Wax_02.jpg"),
    1920,
    1280,
  ),
  W(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Cr%C3%A9ation%2C_petit_sac_en_pagne_Wax.jpg/1280px-Cr%C3%A9ation%2C_petit_sac_en_pagne_Wax.jpg",
    ["wax", "togo", "accessoire"],
    "petit sac en pagne wax fait main",
    "Step May",
    "CC BY-SA 4.0",
    COMMONS_FILE("Création,_petit_sac_en_pagne_Wax.jpg"),
    1280,
    1920,
  ),
];

/** Pool curaté complet : visuels éditoriaux + fonds Wikimedia Commons. */
export const CURATED_EDITORIAL_POOL: readonly CuratedImageEntry[] = [
  ...CURATED_UNSPLASH,
  ...CURATED_WIKIMEDIA,
];

// ─── Sélection déterministe dans le pool curaté ─────────────────────────────

/** Score d'un visuel curaté vis-à-vis des tags / de la fiche produit. */
export function scoreCuratedEntry(
  entry: CuratedImageEntry,
  facts: ProductImageFacts,
): number {
  const keywords = new Set(entry.keywords.map((keyword) => keyword.toLowerCase()));
  let score = 0;
  if (facts.fabric && keywords.has(facts.fabric)) score += 8;
  if (facts.country && keywords.has(facts.country)) score += 5;
  if (facts.gender && keywords.has(facts.gender)) score += 3;
  if (facts.style && keywords.has(facts.style)) score += 2;
  if (facts.isAccessory && keywords.has("accessoire")) score += 2;
  if (keywords.has("editorial")) score += 1;
  if (entry.width >= 1200) score += 2;
  else if (entry.width >= IMAGE_MIN_WIDTH) score += 1;
  // Portrait = « prise de vue plein pied » (brief).
  if (entry.height >= entry.width) score += 1;
  return score;
}

/** Convertit une entrée curatée en candidat exploitable par le pipeline. */
function curatedToCandidate(
  entry: CuratedImageEntry,
  score: number,
): ProductImageCandidate {
  return {
    url: toDisplayUrl(entry.url),
    source: "curated",
    width: entry.width,
    height: entry.height,
    credit: entry.credit,
    license: entry.license,
    origin: entry.origin,
    label: entry.label,
    query: `pool curaté · ${entry.keywords.join(", ")}`,
    score,
  };
}

/**
 * Choisit un visuel dans le pool curaté, en privilégiant la pertinence
 * (matière, pays, genre, style) puis l'unicité (`usedImageUrls`).
 *
 * Fonction **synchrone et hors-ligne** : elle garantit un visuel même quand
 * toutes les sources distantes sont indisponibles.
 */
export function selectCuratedImage(
  ctx: ProductImageContext,
  options: { usedImageUrls?: Iterable<string>; rotation?: number } = {},
): ProductImageCandidate | null {
  if (CURATED_EDITORIAL_POOL.length === 0) return null;

  const facts = deriveImageFacts(ctx);
  const usedKeys = new Set<string>();
  for (const url of options.usedImageUrls ?? []) usedKeys.add(imageKey(url));

  const scored = CURATED_EDITORIAL_POOL.map((entry) => ({
    entry,
    score: scoreCuratedEntry(entry, facts),
  })).sort((a, b) => b.score - a.score || b.entry.width - a.entry.width);

  const bestScore = scored[0].score;
  // 1er passage : les meilleurs visuels (à 1 point près), puis tout le pool.
  const tiers = [scored.filter((item) => item.score >= bestScore - 1), scored];

  for (const tier of tiers) {
    if (tier.length === 0) continue;
    const offset =
      hashString(`${facts.seed}:${options.rotation ?? 0}`) % tier.length;
    for (let i = 0; i < tier.length; i++) {
      const item = tier[(offset + i) % tier.length];
      if (!usedKeys.has(imageKey(item.entry.url))) {
        return curatedToCandidate(item.entry, item.score);
      }
    }
  }

  // L'unicité est stricte : si toutes les sources et tout le pool sont épuisés,
  // on ne réutilise pas un visuel existant. Le script signalera le produit comme
  // non traité plutôt que de créer un doublon.
  return null;
}

/** Taille du pool curaté (diagnostic CLI / monitoring). */
export function curatedPoolSize(): number {
  return CURATED_EDITORIAL_POOL.length;
}

/** Extrait le nom de fichier d'une URL (utile pour les rapports / logs). */
export function imageFileName(url: string): string {
  const clean = (url || "").split("?")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] || clean;
}










