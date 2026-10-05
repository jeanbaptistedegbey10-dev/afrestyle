// src/lib/shopify/hero.ts
// ────────────────────────────────────────────────────────────────────────────
//  DIAPORAMA DU HERO — piloté par les Metaobjects `hero_slide` (Storefront API)
// ────────────────────────────────────────────────────────────────────────────
//
//  CONTRAT : tant qu'un seul diaporama peut être publié de façon idempotente
//  (champ `position` + champ `active`), Shopify Admin est le SEUL poste de
//  pilotage. Aucune chaîne de titre, aucun lien de CTA ne vit dans le code.
//
//  DÉGRADATION (obligatoire, sinon une erreur de config = page blanche) :
//    1. Metaobjects publiés → rendus tels quels.
//    2. Métadonnée Shopify en erreur / type non exposé / boutique injoignable
//       → repli sur les visuels éditoriaux locaux (`constants/images.ts`).
//    3. Slide sans image ET sans titre → ignorée (une slide vide casserait le
//       carrousel et le LCP).
//
//  ⚠️ Serveur uniquement : ce module appelle `storefrontFetch`, il ne doit
//     jamais être importé depuis un composant "use client".
// ────────────────────────────────────────────────────────────────────────────

import { IMAGES } from "@/constants/images";
import { withShopifyCdnWidth } from "@/lib/assets/images";
import { toErrorMessage } from "./errors";
import { storefrontFetch } from "./storefrontClient";
import { HERO_METAOBJECT_TYPE, GET_HERO_SLIDES_QUERY } from "./queries/hero";
import type { ShopifyImage } from "./types";

/** Tag de cache : invalidé par le webhook `metaobjects/*`. */
export const HERO_CACHE_TAG = "hero";

/** Nombre maximal de slides acceptés (au-delà, la home devient un scrollable). */
const MAX_SLIDES = 8;

/** Largeur de rendu du visuel Hero (le CDN Shopify sert la variante correspondante). */
const HERO_IMAGE_WIDTH = 1920;

/** Forme d'un `MetaobjectField` renvoyé par le Storefront. */
export type ShopifyMetaobjectField = {
  key: string;
  type: string;
  value: string | null;
  reference: {
    __typename: "MediaImage";
    alt: string | null;
    image: ShopifyImage;
  } | null;
};

type ShopifyMetaobject = {
  id: string;
  handle: string;
  fields: ShopifyMetaobjectField[];
};

/** Slide normalisée, directement consommable par le composant client. */
export type HeroSlide = {
  id: string;
  handle: string;
  /** URL prête à l'emploi (largeur Hero déjà appliquée). */
  image: string;
  imageAlt: string;
  eyebrow: string | null;
  title: string;
  /** Fragment mis en italique champagne dans le titre (optionnel). */
  titleHighlight: string | null;
  subtitle: string | null;
  href: string | null;
  buttonText: string | null;
  secondaryHref: string | null;
  secondaryText: string | null;
};

/** Indexe les champs d'une entrée par clé (`fields` n'est pas ordonné côté API). */
function indexFields(fields: ShopifyMetaobjectField[]): Map<string, ShopifyMetaobjectField> {
  const map = new Map<string, ShopifyMetaobjectField>();
  for (const field of fields) {
    if (field && !map.has(field.key)) map.set(field.key, field);
  }
  return map;
}

function text(field: ShopifyMetaobjectField | undefined): string | null {
  const value = field?.value?.trim();
  return value ? value : null;
}

/**
 * Extrait l'URL d'un champ `file_reference`.
 *
 * `value` contient un GID (`gid://shopify/MediaImage/…`) : on ne l'utilise que
 * comme filet, la vraie source est `reference.image.url`. Si le média a été
 * révoqué, `reference` est null et le champ est considéré vide.
 */
function mediaUrl(field: ShopifyMetaobjectField | undefined): string | null {
  const image = field?.reference?.image;
  if (!image?.url) return null;
  return withShopifyCdnWidth(image.url, HERO_IMAGE_WIDTH);
}

function mediaAlt(field: ShopifyMetaobjectField | undefined, fallback: string): string {
  const image = field?.reference?.image;
  return (
    field?.reference?.alt?.trim() || image?.altText?.trim() || fallback
  );
}

/**
 * Un `active` absent vaut « true » : un marchand qui publie une slide sans
 * renseigner la case ne doit pas voir son diaporama vide.
 */
function isActive(fields: Map<string, ShopifyMetaobjectField>): boolean {
  const raw = fields.get("active")?.value?.trim().toLowerCase();
  if (!raw) return true;
  return raw !== "false" && raw !== "0";
}
function toSlide(node: ShopifyMetaobject): HeroSlide | null {
  const fields = indexFields(node.fields ?? []);
  if (!isActive(fields)) return null;

  const title = text(fields.get("title"));
  const image = mediaUrl(fields.get("image"));

  // Slide inexploitable : ni visuel ni titre → on l'écarte plutôt que de
  // casser le rendu du carrousel et de dégrader le LCP.
  if (!image || !title) return null;

  return {
    id: node.id,
    handle: node.handle,
    image,
    imageAlt: mediaAlt(fields.get("image"), title),
    eyebrow: text(fields.get("eyebrow")),
    title,
    titleHighlight: text(fields.get("title_highlight")),
    subtitle: text(fields.get("subtitle")),
    href: text(fields.get("link")),
    buttonText: text(fields.get("button_text")),
    secondaryHref: text(fields.get("secondary_link")),
    secondaryText: text(fields.get("secondary_button_text")),
  };
}

/**
 * Ordre éditorial : champ `position` numérique croissant, puis handle.
 * `sortKey: "id"` côté Shopify est un tri technique, pas un ordre éditorial.
 */
function sortSlides(slides: HeroSlide[], positions: Map<string, number>): HeroSlide[] {
  return [...slides].sort((a, b) => {
    const pa = positions.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const pb = positions.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb;
    // Handles préfixés « 01- », « 02- » se rangent naturellement (numeric).
    return a.handle.localeCompare(b.handle, "fr", { numeric: true, sensitivity: "base" });
  });
}

/**
 * Contenu éditorial du repli — les 4 variations du diaporama.
 *
 * ⚠️ Ces textes ne sont lus QUE si aucun metaobject `hero_slide` n'est publié
 *    (type non exposé, boutique injoignable, catalogue vide). Dès qu'un
 *    marchand publie ses slides dans Shopify Admin, CE sont elles qui sont
 *    rendues — ce tableau n'est plus qu'un filet de sécurité.
 *
 * L'ordre visuel suit `IMAGES.heroSlides` (4 replis de marque alignés sur ces
 * variations). Le sur-titre est rendu en capitales par le composant.
 */
const HERO_FALLBACK_SLIDES: ReadonlyArray<{
  eyebrow: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  href: string;
  buttonText: string;
  secondaryHref: string;
  secondaryText: string;
}> = [
  {
    eyebrow: "Maison de Haute Couture",
    title: "L'Afrique réinvente",
    titleHighlight: "le luxe",
    subtitle:
      "Une union harmonieuse entre artisanat traditionnel africain et coupes contemporaines haut de gamme.",
    href: "/shop",
    buttonText: "Découvrir la collection",
    secondaryHref: "/about",
    secondaryText: "Notre Histoire",
  },
  {
    eyebrow: "Nouvelle Collection",
    title: "Sublimer la grâce",
    titleHighlight: "authentique",
    subtitle:
      "Des créations uniques façonnées dans des étoffes d'exception pour révéler votre allure distinctive.",
    href: "/shop?category=femme",
    buttonText: "Dénicher vos pièces",
    secondaryHref: "/lookbook",
    secondaryText: "Voir le Lookbook",
  },
  {
    eyebrow: "Sur-mesure & Tradition",
    title: "L'élégance masculine",
    titleHighlight: "réinventée",
    subtitle:
      "Du veston en wax au costume Agbada moderne, l'art du bien-aller par nos maîtres artisans.",
    href: "/shop?category=homme",
    buttonText: "Série Homme",
    secondaryHref: "/about",
    secondaryText: "En savoir plus",
  },
  {
    eyebrow: "Wax, Bazin & Kente",
    title: "L'art du textile",
    titleHighlight: "africain",
    subtitle:
      "Chaque pièce raconte une histoire unique, tissée avec passion et minutie par nos créateurs.",
    href: "/shop",
    buttonText: "Explorer les matières",
    secondaryHref: "/about",
    secondaryText: "Nos Engagements",
  },
];

/**
 * Repli éditorial local — garantit un Hero même boutique vide, metaobjects non
 * exposés ou réseau coupé.
 */
function fallbackSlides(): HeroSlide[] {
  return HERO_FALLBACK_SLIDES.map((slide, index) => {
    // Un visuel de marque par variation ; le modulo protège le repli si le
    // nombre de contenus éditoriaux évolue au-delà des visuels disponibles.
    const visual = IMAGES.heroSlides[index % IMAGES.heroSlides.length];

    return {
      id: `fallback-hero-${index + 1}`,
      handle: `fallback-0${index + 1}`,
      image: visual.src,
      imageAlt: visual.alt,
      ...slide,
    };
  });
}

/**
 * Diaporama du Hero, prêt à rendre.
 *
 * @returns jamais un tableau vide (le repli local est toujours disponible).
 */
export async function getHeroSlides({
  first = MAX_SLIDES,
}: { first?: number } = {}): Promise<HeroSlide[]> {
  try {
    const data = await storefrontFetch<{ metaobjects: { nodes: ShopifyMetaobject[] } }>({
      query: GET_HERO_SLIDES_QUERY,
      variables: { type: HERO_METAOBJECT_TYPE, first },
      tags: [HERO_CACHE_TAG],
    });

    const nodes = data.data.metaobjects?.nodes ?? [];
    if (nodes.length === 0) return fallbackSlides();

    const positions = new Map<string, number>();
    const slides: HeroSlide[] = [];

    for (const node of nodes) {
      const slide = toSlide(node);
      if (!slide) continue;
      const raw = indexFields(node.fields ?? []).get("position")?.value;
      const position = Number.parseInt(raw ?? "", 10);
      if (Number.isFinite(position)) positions.set(slide.id, position);
      slides.push(slide);
    }

    return slides.length > 0 ? sortSlides(slides, positions) : fallbackSlides();
  } catch (error) {
    console.warn(
      `[shopify:hero] Metaobjects « ${HERO_METAOBJECT_TYPE} » illisibles ` +
        `(${toErrorMessage(error)}) — repli sur le diaporama éditorial local. ` +
        `Vérifiez que le type est exposé dans Settings > Storefront API > Metaobjects.`,
    );
    return fallbackSlides();
  }
}