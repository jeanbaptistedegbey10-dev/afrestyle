// src/lib/shopify/about.ts
// ───────────────────────────────────────────────────────────────────────────────
//  CARTES ÉDITORIALES DE /ABOUT — pilotées par les Metaobjects `editorial_card`
//  (Storefront API).
// ───────────────────────────────────────────────────────────────────────────────
//
//  CONTRAT : Shopify Admin est le SEUL poste de pilotage. Aucun titre, aucun
//  paragraphe et aucun visuel de la section « Journal des matières » ne vit
//  dans le code — le tableau `ABOUT_FALLBACK_CARDS` ci-dessous n'est plus qu'un
//  filet de sécurité.
//
//  DÉGRADATION (obligatoire, sinon une erreur de config = page amputée) :
//    1. Metaobjects publiés → rendus tels quels, triés par `position` croissant.
//    2. Métadonnée illisible / type non exposé / boutique injoignable → repli
//       éditorial local (`ABOUT_FALLBACK_CARDS`).
//    3. Carte sans image ET sans titre → ignorée (une carte vide casserait la
//       mise en page de la grille).
//    4. `active: false` → masquée sans la supprimer depuis l'admin.
//    5. Moins de `MIN_ABOUT_CARDS` (3) cartes publiées → les emplacements vacants
//       sont complétés par le repli local : la grille garde toujours ses trois
//       temps éditoriaux.
//
//  ⚠️ Serveur uniquement : ce module appelle `storefrontFetch`, il ne doit
//     jamais être importé depuis un composant "use client".
// ───────────────────────────────────────────────────────────────────────────────

import { IMAGES } from "@/constants/images";
import { toErrorMessage } from "./errors";
import { storefrontFetch } from "./storefrontClient";
import type { ShopifyMetaobjectField } from "./hero";
import {
  ABOUT_CARD_METAOBJECT_TYPES,
  GET_ABOUT_CARDS_QUERY,
} from "./queries/about";

/** Tag de cache : invalidé par le webhook `metaobjects/*`. */
export const ABOUT_CARDS_CACHE_TAG = "about-cards";

/** Nombre maximal de cartes rendues (au-delà, /about devient un scroll interminable). */
const MAX_ABOUT_CARDS = 6;

/**
 * Nombre de cartes éditoriales GARANTI sur /about.
 *
 * Invariant de rendu : la grille « Journal des matières » occupe toujours trois
 * emplacements (1 pleine largeur + 2 en vis-à-vis), comme avant le branchement
 * Storefront.
 */
export const MIN_ABOUT_CARDS = 3;

/** Carte normalisée, directement consommable par le composant serveur. */
export type AboutEditorialCard = {
  id: string;
  handle: string;
  /** Sur-libellé court au-dessus du titre. */
  eyebrow: string | null;
  /** Titre principal (requis pour le rendu). */
  title: string;
  /** Paragraphe éditorial. */
  text: string | null;
  /** URL brute du CDN Shopify (largeur appliquée par le composant selon la carte). */
  image: string | null;
  imageAlt: string;
  /** Ordre éditorial croissant — `MAX_SAFE_INTEGER` si non renseigné (poussé en fin). */
  position: number;
};
/**
 * Repli éditorial local — garantit la section « Journal des matières » même
 * boutique vide, type `editorial_card` non exposé ou réseau coupé.
 *
 * ⚠️ Ces textes ne sont lus QUE si le marchand n'a publié aucune carte
 *    correspondante dans Shopify Admin. Dès qu'il en publie, la grille affiche
 *    le contenu de l'admin ; les emplacements restés vacants conservent ces
 *    replis, dont `position` suit l'ordre d'affichage historique (1, 2, 3).
 */
export const ABOUT_FALLBACK_CARDS: readonly AboutEditorialCard[] = [
  {
    id: "fallback-about-matieres",
    handle: "fallback-matieres",
    eyebrow: "Matières & palette",
    title: "Une histoire de matières",
    text: "Des images d’ambiance pour préserver la lecture ivoire, bleu nuit et champagne de la maison.",
    image: IMAGES.story,
    imageAlt:
      "Ambiance éditoriale de mode africaine utilisée pour présenter la palette des matières AfroStyle.",
    position: 1,
  },
  {
    id: "fallback-about-silhouettes",
    handle: "fallback-silhouettes",
    eyebrow: "Silhouettes",
    title: "Le dessin en mouvement",
    text: "Une direction artistique qui regarde la confection africaine avec une sensibilité contemporaine.",
    image: IMAGES.lookbook[0],
    imageAlt:
      "Silhouette africaine éditoriale présentée comme image d’ambiance, sans portrait de créateur associé.",
    position: 2,
  },
  {
    id: "fallback-about-parure",
    handle: "fallback-parure",
    eyebrow: "Détails & héritage",
    title: "La parure comme signature",
    text: "Accessoires, textures et finitions donnent du relief au récit visuel de chaque création.",
    image: IMAGES.lookbook[2],
    imageAlt:
      "Parure et accessoires de mode africaine photographiés comme illustration éditoriale d’ambiance.",
    position: 3,
  },
];

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
 * Un `active` absent vaut « true » : un marchand qui publie une carte sans
 * renseigner la case ne doit pas voir sa page se vider.
 */
function isActive(fields: Map<string, ShopifyMetaobjectField>): boolean {
  const raw = fields.get("active")?.value?.trim().toLowerCase();
  if (!raw) return true;
  return raw !== "false" && raw !== "0";
}

/**
 * Normalise une entrée `editorial_card`.
 *
 * @returns `null` si la carte est inactive ou inexploitable (ni image ni titre).
 */
function toCard(node: {
  id: string;
  handle: string;
  fields: ShopifyMetaobjectField[];
}): AboutEditorialCard | null {
  const fields = indexFields(node.fields ?? []);
  if (!isActive(fields)) return null;

  const title = text(fields.get("title"));
  const image = mediaUrl(fields.get("image"));

  // Carte inexploitable : ni titre ET ni visuel → on l'écarte. Un titre seul
  // suffit : le composant rend alors le placeholder SVG de marque (pas d'image
  // cassée). Exiger les deux reviendrait à supprimer du contenu éditorial.
  if (!image && !title) return null;

  const position = Number.parseInt(fields.get("position")?.value ?? "", 10);

  return {
    id: node.id,
    handle: node.handle,
    eyebrow: text(fields.get("eyebrow")),
    title: title ?? "",
    text: text(fields.get("body")),
    image,
    imageAlt: mediaAlt(fields.get("image"), `Visuel éditorial — ${title ?? "AfroStyle"}`),
    position: Number.isFinite(position) ? position : Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Ordre éditorial : champ `position` numérique croissant, puis handle.
 *
 * Le Storefront ne sait pas trier sur un champ de métaobjet (`sortKey: "id"` est
 * un tri technique) : c'est donc ici, côté serveur, que l'ordre éditorial du
 * marchand est appliqué. Les handles préfixés « 01- », « 02- » se rangent
 * naturellement (numeric) et servent de secours quand `position` est absent.
 */
function byEditorialOrder(a: AboutEditorialCard, b: AboutEditorialCard): number {
  if (a.position !== b.position) return a.position - b.position;
  return a.handle.localeCompare(b.handle, "fr", {
    numeric: true,
    sensitivity: "base",
  });
}
/**
 * Complète les cartes publiées pour garantir `MIN_ABOUT_CARDS` entrées.
 *
 * Principe : le contenu du marchand est TOUJOURS prioritaire. On n'ajoute un
 * repli que pour combler les emplacements vacants, et jamais deux fois la même
 * carte (déduplication par `id`).
 *
 * @param published cartes issues des metaobjects, déjà normalisées
 * @param first    plafond de rendu ; le minimum de 3 prime sur ce plafond
 */
function completeWithFallbacks(
  published: AboutEditorialCard[],
  first: number = MAX_ABOUT_CARDS,
): AboutEditorialCard[] {
  const ordered = [...published].sort(byEditorialOrder);
  const seen = new Set(ordered.map((card) => card.id));
  const merged: AboutEditorialCard[] = [...ordered];

  for (const fallback of ABOUT_FALLBACK_CARDS) {
    if (merged.length >= MIN_ABOUT_CARDS) break;
    if (seen.has(fallback.id)) continue;
    seen.add(fallback.id);
    merged.push(fallback);
  }

  // Tri final refait APRÈS complétion : la grille doit rester lisible même
  // quand le marchand n'a renseigné `position` que sur certaines cartes.
  return merged
    .sort(byEditorialOrder)
    .slice(0, Math.max(first, MIN_ABOUT_CARDS));
}

/**
 * Cartes éditoriales de /about, prêtes à rendre.
 *
 * Le type métaobjet est résolu en tolérant `editorial_card` PUIS `about_card` :
 * le premier type qui répond avec des nœuds l'emporte. Une boutique qui a
 * publié ses cartes sous l'un ou l'autre nom est donc servie sans toucher au
 * code.
 *
 * @returns jamais un tableau vide, et TOUJOURS au moins `MIN_ABOUT_CARDS` (3)
 *          entrées : le repli éditorial local complète les emplacements vacants,
 *          donc aucune section amputée n'est possible même boutique vide.
 */
export async function getAboutEditorialCards({
  first = MAX_ABOUT_CARDS,
}: { first?: number } = {}): Promise<AboutEditorialCard[]> {
  const cards: AboutEditorialCard[] = [];
  const failures: string[] = [];

  for (const type of ABOUT_CARD_METAOBJECT_TYPES) {
    try {
      const data = await storefrontFetch<{
        metaobjects: {
          nodes: { id: string; handle: string; fields: ShopifyMetaobjectField[] }[];
        };
      }>({
        query: GET_ABOUT_CARDS_QUERY,
        variables: { type, first },
        tags: [ABOUT_CARDS_CACHE_TAG],
      });

      const nodes = data.data.metaobjects?.nodes ?? [];
      if (nodes.length === 0) continue;

      for (const node of nodes) {
        const card = toCard(node);
        if (card) cards.push(card);
      }
      // Un type a répondu avec du contenu : inutile d'interroger l'autre.
      break;
    } catch (error) {
      // Type absent (erreur GraphQL) ou boutique momentanément injoignable :
      // on note l'échec et on essaie le type suivant avant de basculer sur le repli.
      failures.push(`${type} (${toErrorMessage(error)})`);
    }
  }

  if (cards.length === 0) {
    console.warn(
      `[shopify:about] Metaobjects « ${ABOUT_CARD_METAOBJECT_TYPES.join(" / ")} » ` +
        `illisibles ou vides — repli sur les cartes éditoriales locales. ` +
        (failures.length ? `Tentatives : ${failures.join(", ")}. ` : "") +
        `Vérifiez que le type est exposé dans Settings > Storefront API > Metaobjects.`,
    );
  }

  return completeWithFallbacks(cards, first);
}