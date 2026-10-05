// src/lib/shopify/sections.ts
// ───────────────────────────────────────────────────────────────────────────────
//  SECTIONS ÉDITORIALES DE L'ACCUEIL — pilotées par les Metaobjects `home_section`
//  (Storefront API).
// ───────────────────────────────────────────────────────────────────────────────
//
//  CONTRAT : Shopify Admin est le SEUL poste de pilotage. Aucune chaîne de titre,
//  aucun lien de CTA, aucun choix de mise en page ne vit dans le code.
//
//  DÉGRADATION (obligatoire, sinon une erreur de config = page blanche) :
//    1. Metaobjects publiés → rendus tels quels, triés par `position`.
//    2. Métadonnée illisible / type non exposé / boutique injoignable → repli
//       éditorial local (`EDITORIAL_FALLBACK_SECTIONS` ci-dessous).
//    3. Section sans image ET sans titre → ignorée (une section vide casserait la
//       mise en page et allongerait inutilement le LCP).
//    4. `active: false` → masquée sans la supprimer depuis l'admin.
//
//  ⚠️ Serveur uniquement : ce module appelle `storefrontFetch`, il ne doit
//     jamais être importé depuis un composant "use client".
// ───────────────────────────────────────────────────────────────────────────────

import { IMAGES } from "@/constants/images";
import { toErrorMessage } from "./errors";
import { storefrontFetch } from "./storefrontClient";
import type { ShopifyMetaobjectField } from "./hero";
import {
  GET_HOME_SECTIONS_QUERY,
  HOME_SECTION_METAOBJECT_TYPE,
} from "./queries/sections";

/** Tag de cache : invalidé par le webhook `metaobjects/*`. */
export const SECTIONS_CACHE_TAG = "home-sections";

/** Nombre maximal de sections rendues (au-delà, la home devient un scroll interminable). */
const MAX_SECTIONS = 8;

/** Disposition éditoriale : modifiable ici SEULEMENT (piloté par le champ `layout`). */
export type HomeSectionLayout = "image_left" | "image_right" | "full_banner";

/** Valeurs de `layout` acceptées. */
export const HOME_SECTION_LAYOUTS: readonly HomeSectionLayout[] = [
  "image_left",
  "image_right",
  "full_banner",
];

/**
 * Synonymes tolérés pour le champ texte `layout` de l'admin.
 *
 * `layout` est une saisie LIBRE dans Shopify Admin (on documentait jusqu'ici
 * `image_left | image_right | full_banner`). Un marchand saisissant
 * `full_width` — ou `image-left`, `IMAGE LEFT`… — ne doit pas voir sa section
 * dégradée en `image_left` par défaut : on normalise donc explicitement vers la
 * disposition canonique.
 */
const HOME_SECTION_LAYOUT_ALIASES: Readonly<Record<string, HomeSectionLayout>> = {
  image_left: "image_left",
  left: "image_left",
  image_right: "image_right",
  right: "image_right",
  full_banner: "full_banner",
  full_width: "full_banner",
  full_width_banner: "full_banner",
  fullwidth: "full_banner",
  banner: "full_banner",
  wide: "full_banner",
};

/**
 * Rôles éditorials de l'accueil — un emplacement par RÔLE dans le flux.
 *
 * L'accueil réserve EXACTEMENT trois emplacements (cf. `splitHomeSections`) :
 * c'est ce qui crée le rythme premium sans empiler un mur de blocs identiques
 * ni dupliquer la grille produits.
 */
export type HomeSectionRole = "storytelling" | "lookbook" | "materials";

/** Les trois rôles, dans l'ordre du flux de la home. */
export const HOME_SECTION_ROLES: readonly HomeSectionRole[] = [
  "storytelling",
  "lookbook",
  "materials",
];

/**
 * Nombre de sections éditoriales GARANTI sur l'accueil.
 *
 * Invariant de rendu : `splitHomeSections()` retourne toujours 3 sections non
 * nulles, complétées par les sections démo locales si Shopify en publie moins.
 */
export const MIN_HOME_SECTIONS = 3;

/** Section normalisée, directement consommable par un composant serveur. */
export type HomeSection = {
  id: string;
  handle: string;
  /** Titre principal (requis pour le rendu). */
  title: string;
  /** Sur-libellé court au-dessus du titre. */
  eyebrow: string | null;
  subtitle: string | null;
  /** Paragraphe éditorial principal. */
  body: string | null;
  /** URL brute du CDN Shopify (largeur appliquée par le composant selon le layout). */
  image: string | null;
  imageAlt: string;
  buttonText: string | null;
  buttonLink: string | null;
  layout: HomeSectionLayout;
  /** Ordre éditorial croissant — `MAX_SAFE_INTEGER` si non renseigné (poussé en fin). */
  position: number;
};
/**
 * Repli éditorial local — garantit une home jamais vide, même boutique
 * inexistante ou type `home_section` non exposé.
 *
 * Une section démo par RÔLE et par DISPOSITION, dans l'ordre exact du flux :
 *
 *   1. `image_left`  → storytelling  — L'élégance & le savoir-faire
 *   2. `full_banner` → lookbook     — bannière d'immersion
 *   3. `image_right` → matières     — matières & engagement éthique
 *
 * `position` suit cet ordre : le tri éditorial de `byEditorialOrder` rend donc
 * ce repli dans le même rythme que des metaobjects réellement publiés.
 */
export const EDITORIAL_FALLBACK_SECTIONS: HomeSection[] = [
  {
    id: "fallback-section-savoir-faire",
    handle: "fallback-savoir-faire",
    title: "Un savoir-faire transmis de main en main",
    eyebrow: "Nos ateliers",
    subtitle: "L'élégance & le savoir-faire",
    body:
      "Chaque pièce est façonnée dans nos ateliers partenaires, du tracé de la coupe à la pose finale du dernier fil. Nous travaillons avec des mains qui connaissent la matière — wax, kente, bogolan — et qui savent la faire vivre sur une silhouette contemporaine.",
    image: IMAGES.story,
    imageAlt:
      "Geste d'atelier et matière textile — ambiance éditoriale AfroStyle.",
    buttonText: "Découvrir notre savoir-faire",
    buttonLink: "/about",
    layout: "image_left",
    position: 1,
  },
  {
    id: "fallback-section-lookbook",
    handle: "fallback-lookbook",
    title: "L'élégance en images",
    eyebrow: "Lookbook",
    subtitle: "Accra · Abidjan · Bamako · Dakar",
    body:
      "De la piste d'Accra au boulevard d'Abidjan, notre lookbook rassemble les silhouettes de la saison — un voyage visuel entre héritage et création contemporaine.",
    image: IMAGES.lookbook[3],
    imageAlt:
      "Grand boubou brodé photographié en cadrage éditorial pour le lookbook.",
    buttonText: "Voir le lookbook",
    buttonLink: "/lookbook",
    layout: "full_banner",
    position: 2,
  },
  {
    id: "fallback-section-matieres",
    handle: "fallback-matieres",
    title: "Des matières qui gardent une mémoire",
    eyebrow: "Matières & engagement éthique",
    subtitle: "Wax, kente, bogolan, bazin",
    body:
      "Une palette ivoire, bleu nuit et champagne habille des textiles choisis pour leur tenue dans le temps. Nous privilégions les fibres naturelles et les teintures qui respectent la peau autant que le fil.",
    image: IMAGES.lookbook[1],
    imageAlt:
      "Détail de matière et de motif wax mis en scène en ambiance éditoriale.",
    buttonText: "Explorer les collections",
    buttonLink: "/collections",
    layout: "image_right",
    position: 3,
  },
];

/**
 * Disposition canonique attendue pour chaque rôle éditorial.
 *
 * C'est le contrat de composition de la home : si une section demo doit
 * compléter un emplacement, elle portera la disposition qui va avec.
 */
const ROLE_LAYOUT: Readonly<Record<HomeSectionRole, HomeSectionLayout>> = {
  storytelling: "image_left",
  lookbook: "full_banner",
  materials: "image_right",
};

/**
 * Section démo associée à un rôle éditorial.
 *
 * Sert au COMPLÈTEMENT automatique : si un marchand publie 1 seul metaobject
 * `home_section`, les deux emplacements restants reçoivent la section démo du
 * rôle correspondant — la home garde ainsi ses 3 temps éditoriaux.
 *
 * Le repli final (`EDITORIAL_FALLBACK_SECTIONS[0]`) est la garantie que la
 * fonction renvoie TOUJOURS une section exploitable : aucune page blanche.
 */
function getDemoSectionForRole(role: HomeSectionRole): HomeSection {
  return (
    EDITORIAL_FALLBACK_SECTIONS.find(
      (section) => section.layout === ROLE_LAYOUT[role],
    ) ?? EDITORIAL_FALLBACK_SECTIONS[0]
  );
}

/** Indexe les champs d'une entrée par clé (`fields` n'est pas ordonné côté API). */
function indexFields(
  fields: ShopifyMetaobjectField[],
): Map<string, ShopifyMetaobjectField> {
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

/** `file_reference` → URL CDN. `value` ne contient qu'un GID : seule `reference` est utile. */
function mediaUrl(field: ShopifyMetaobjectField | undefined): string | null {
  return field?.reference?.image?.url ?? null;
}

function mediaAlt(field: ShopifyMetaobjectField | undefined, fallback: string): string {
  const image = field?.reference?.image;
  return field?.reference?.alt?.trim() || image?.altText?.trim() || fallback;
}

/**
 * Un `active` absent vaut « true » : un marchand qui publie une section sans
 * renseigner la case ne doit pas voir sa home se vider.
 */
function isActive(fields: Map<string, ShopifyMetaobjectField>): boolean {
  const raw = fields.get("active")?.value?.trim().toLowerCase();
  if (!raw) return true;
  return raw !== "false" && raw !== "0";
}

/**
 * Normalise le champ `layout`.
 *
 * L'admin est saisie libre : on tolère la casse, les espaces et les tirets
 * (`image-left`, `IMAGE LEFT`…) ainsi que les synonymes documentés
 * (`full_width` → `full_banner`, `left`/`right`, `banner`…). Si la valeur reste
 * inconnue, on retombe sur `image_left` — plutôt que d'écarter la section, on
 * dégrade seulement sa mise en page.
 */
function toLayout(field: ShopifyMetaobjectField | undefined): HomeSectionLayout {
  const raw = field?.value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return HOME_SECTION_LAYOUT_ALIASES[raw ?? ""] ?? "image_left";
}
/**
 * Normalise une entrée `home_section`.
 * @returns `null` si la section est inactive ou inexploitable (ni image ni titre).
 */
function toSection(node: {
  id: string;
  handle: string;
  fields: ShopifyMetaobjectField[];
}): HomeSection | null {
  const fields = indexFields(node.fields ?? []);
  if (!isActive(fields)) return null;

  const title = text(fields.get("title"));
  const image = mediaUrl(fields.get("image"));

  // Section inexploitable : ni titre ET ni visuel → on l'écarte. Un titre seul
  // suffit : le composant rend alors un placeholder SVG de marque (pas d'image
  // cassée). Exiger les deux reviendrait à supprimer du contenu éditorial.
  if (!image && !title) return null;

  const position = Number.parseInt(fields.get("position")?.value ?? "", 10);

  return {
    id: node.id,
    handle: node.handle,
    title,
    eyebrow: text(fields.get("eyebrow")),
    subtitle: text(fields.get("subtitle")),
    body: text(fields.get("body")),
    image,
    imageAlt: mediaAlt(fields.get("image"), `Visuel éditorial — ${title}`),
    buttonText: text(fields.get("button_text")),
    buttonLink: text(fields.get("button_link")),
    layout: toLayout(fields.get("layout")),
    position: Number.isFinite(position) ? position : Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Ordre éditorial : `position` numérique croissant, puis handle.
 * Les handles préfixés « 01- », « 02- » se rangent naturellement (numeric).
 */
function byEditorialOrder(a: HomeSection, b: HomeSection): number {
  if (a.position !== b.position) return a.position - b.position;
  return a.handle.localeCompare(b.handle, "fr", {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Répartit les sections éditoriales dans les trois emplacements du flux d'accueil.
 *
 * Au lieu d'empiler toutes les sections d'un bloc (ce qui produisait un mur de
 * blocs identiques et interférait avec la grille produits), la page réserve un
 * emplacement par RÔLE :
 *
 *   storytelling → avant la grille produits  (layout `image_left`)
 *   lookbook     → après la grille produits   (layout `full_banner`)
 *   materials    → en clôture de flux          (layout `image_right`)
 *
 * ── CONTRAT DE RENDU (jamais de trou éditorial) ──────────────────────────────
 * Les trois emplacements sont TOUJOURS remplis. Si le marchand a publié moins
 * de 3 metaobjects `home_section` (voir `MIN_HOME_SECTIONS`), chaque emplacement
 * vacant reçoit la section DÉMO du rôle correspondant
 * (`getDemoSectionForRole`) : la home conserve ses 3 temps éditoriaux —
 *
 *   1. `image_left`  → L'élégance & le savoir-faire
 *   2. `full_banner` → bannière lookbook / immersion
 *   3. `image_right` → matières & engagement éthique
 *
 * Les types de retour sont donc NON NULS : le composant appelant peut rendre
 * les trois sections sans conditionner, et une boutique vide ou injoignable ne
 * peut pas produire une page amputée de sa moitié éditoriale.
 *
 * Tolérances : une section au « mauvais » layout est rendue quand même dans son
 * emplacement (mieux vaut un rendu légèrement différent qu'un trou éditorial).
 * Un seul `full_banner` est retenu : c'est lui qui découpe le flux de produits.
 * Chaque section — publiée OU démo — est renvoyée AU PLUS UNE fois.
 */
export function splitHomeSections(sections: HomeSection[]): {
  storytelling: HomeSection;
  lookbook: HomeSection;
  materials: HomeSection;
} {
  // Garde-fou : la source peut être `undefined`/vide selon l'appelant.
  const pool: HomeSection[] = Array.isArray(sections) ? sections : [];

  const taken = new Set<string>();
  const pick = (layout: HomeSectionLayout): HomeSection | null =>
    pool.find((section) => section.layout === layout && !taken.has(section.id)) ??
    null;

  // 1. La bannière plein cadre : elle doit couper le flux de produits.
  const banner = pick("full_banner");
  if (banner) taken.add(banner.id);

  // 2. Storytelling : une section scindée, sinon la 1ʳᵉ restante.
  const storytelling =
    pick("image_left") ?? pool.find((section) => !taken.has(section.id)) ?? null;
  if (storytelling) taken.add(storytelling.id);

  // 3. Matières : une section scindée opposée, sinon la 1ʳᵉ restante.
  const materials =
    pick("image_right") ?? pool.find((section) => !taken.has(section.id)) ?? null;
  if (materials) taken.add(materials.id);

  return {
    // Emplacement vacant → section démo du rôle (jamais `null`).
    storytelling: storytelling ?? getDemoSectionForRole("storytelling"),
    lookbook: banner ?? getDemoSectionForRole("lookbook"),
    materials: materials ?? getDemoSectionForRole("materials"),
  };
}

/**
 * Sections éditoriales de l'accueil, prêtes à rendre.
 *
 * @returns jamais un tableau vide, et TOUJOURS au moins `MIN_HOME_SECTIONS`
 *          (3) entrées : le repli éditorial local complète les emplacements
 *          vacants, donc aucune page blanche n'est possible même boutique
 *          vide, type non exposé ou metaobjects tous inactifs.
 */
export async function getHomeSections({
  first = MAX_SECTIONS,
}: { first?: number } = {}): Promise<HomeSection[]> {
  try {
    const data = await storefrontFetch<{
      metaobjects: {
        nodes: { id: string; handle: string; fields: ShopifyMetaobjectField[] }[];
      };
    }>({
      query: GET_HOME_SECTIONS_QUERY,
      variables: { type: HOME_SECTION_METAOBJECT_TYPE, first },
      tags: [SECTIONS_CACHE_TAG],
    });

    const nodes = data.data.metaobjects?.nodes ?? [];
    if (nodes.length === 0) return completeWithFallbacks([]);

    const sections = nodes
      .map(toSection)
      .filter((section): section is HomeSection => section !== null);

    return completeWithFallbacks(sections);
  } catch (error) {
    console.warn(
      `[shopify:sections] Metaobjects « ${HOME_SECTION_METAOBJECT_TYPE} » illisibles ` +
        `(${toErrorMessage(error)}) — repli sur les sections éditoriales locales. ` +
        `Vérifiez que le type est exposé dans Settings > Storefront API > Metaobjects.`,
    );
    return completeWithFallbacks([]);
  }
}

/**
 * Complète les sections publiées pour garantir `MIN_HOME_SECTIONS` entrées.
 *
 * Principe : le contenu du marchand est TOUJOURS prioritaire. On n'ajoute une
 * section démo que pour les RÔLES qu'aucune section publiée ne couvre, et on
 * n'ajoute jamais deux fois la même section (déduplication par `id`).
 *
 * @param published sections issues des metaobjects, déjà normalisées
 * @param first    plafond de rendu ; le minimum de 3 prime sur ce plafond
 */
function completeWithFallbacks(
  published: HomeSection[],
  first: number = MAX_SECTIONS,
): HomeSection[] {
  const ordered = [...published].sort(byEditorialOrder);
  const seen = new Set(ordered.map((section) => section.id));
  const merged: HomeSection[] = [...ordered];

  if (merged.length < MIN_HOME_SECTIONS) {
    for (const section of EDITORIAL_FALLBACK_SECTIONS) {
      if (merged.length >= MIN_HOME_SECTIONS) break;
      // Une section démo ne complète que les RÔLES encore vacants : on ignore
      // celle dont la disposition est déjà couverte par une section publiée.
      const layoutCovered = ordered.some((item) => item.layout === section.layout);
      if (layoutCovered) continue;
      if (seen.has(section.id)) continue;
      seen.add(section.id);
      merged.push(section);
    }
  }

  return merged.slice(0, Math.max(first, MIN_HOME_SECTIONS));
}