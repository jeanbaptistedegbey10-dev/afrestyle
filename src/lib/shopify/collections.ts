// src/lib/shopify/collections.ts
// ────────────────────────────────────────────────────────────────────────────
//  BANNÈRES DE CATÉGORIES — pilotées par les Metafields `custom.banner_*`
//  attachés aux Collections (Storefront API).
// ────────────────────────────────────────────────────────────────────────────
//
//  Deux usages, une seule source de vérité Shopify :
//   • `getCategoryBanners()` → grille « Nos univers » de l'accueil : toutes les
//     collections ayant une bannière, triées par `banner_position`.
//   • `getCollectionBanner(handle)` → bandeau de `/collections/[handle]`.
//
//  Règles de rendu (une collection sans image n'apparaît PAS) :
//   • sans `banner_image` → repli sur `collection.image` (photo de la
//     collection), sinon aucun rendu ;
//   • `banner_active: false` → masquée ;
//   • `banner_link` / `banner_button_text` absents → la page de la collection et
//     le libellé « Explorer ».
// ────────────────────────────────────────────────────────────────────────────

import { withShopifyCdnWidth } from "@/lib/assets/images";
import { toErrorMessage } from "./errors";
import { storefrontFetch } from "./storefrontClient";
import {
  GET_COLLECTION_BANNER_QUERY,
  GET_COLLECTION_BANNERS_QUERY,
} from "./queries/collections";
import type { ShopifyMetaobjectField } from "./hero";
import type { ShopifyImage } from "./types";

/** Tags de cache : invalidés par les webhooks `collections/*` et `metaobjects/*`. */
export const BANNER_CACHE_TAGS = ["banners", "collections"] as const;

/** Nombre de collections interrogées pour la grille d'accueil. */
const MAX_BANNERS = 12;

/** Largeur de rendu des visuels de bannière. */
const BANNER_IMAGE_WIDTH = 1000;

type ShopifyBannerMetafield = ShopifyMetaobjectField;

type ShopifyCollectionBannerNode = {
  id: string;
  handle: string;
  title: string;
  image: ShopifyImage | null;
  metafields: (ShopifyBannerMetafield | null)[];
};

/** Bannière normalisée, consommable par un composant serveur. */
export type CollectionBanner = {
  id: string;
  handle: string;
  title: string;
  subtitle: string | null;
  image: string;
  imageAlt: string;
  href: string;
  buttonText: string;
  position: number;
};

function indexMetafields(
  metafields: (ShopifyBannerMetafield | null)[],
): Map<string, ShopifyBannerMetafield> {
  const map = new Map<string, ShopifyBannerMetafield>();
  for (const metafield of metafields) {
    if (metafield && !map.has(metafield.key)) map.set(metafield.key, metafield);
  }
  return map;
}

function metaText(field: ShopifyBannerMetafield | undefined): string | null {
  const value = field?.value?.trim();
  return value ? value : null;
}

/** `file_reference` → URL via `reference` (le GID contenu dans `value` est inexploitable). */
function metaImageUrl(field: ShopifyBannerMetafield | undefined): string | null {
  const image = field?.reference?.image;
  if (!image?.url) return null;
  return withShopifyCdnWidth(image.url, BANNER_IMAGE_WIDTH);
}

function isMetaActive(fields: Map<string, ShopifyBannerMetafield>): boolean {
  const raw = fields.get("banner_active")?.value?.trim().toLowerCase();
  if (!raw) return true;
  return raw !== "false" && raw !== "0";
}

function toBanner(node: ShopifyCollectionBannerNode): CollectionBanner | null {
  const fields = indexMetafields(node.metafields ?? []);
  if (!isMetaActive(fields)) return null;

  const title = metaText(fields.get("banner_title")) ?? node.title;
  // 1. média de bannière · 2. photo de la collection · 3. rien (carte écartée).
  const image =
    metaImageUrl(fields.get("banner_image")) ??
    (node.image?.url ? withShopifyCdnWidth(node.image.url, BANNER_IMAGE_WIDTH) : null);
  if (!image) return null;

  const imageField = fields.get("banner_image");

  return {
    id: node.id,
    handle: node.handle,
    title,
    subtitle: metaText(fields.get("banner_subtitle")),
    image,
    imageAlt:
      metaText(fields.get("banner_alt")) ||
      imageField?.reference?.alt?.trim() ||
      imageField?.reference?.image?.altText?.trim() ||
      `Visuel de la collection ${title}`,
    href: metaText(fields.get("banner_link")) || `/collections/${node.handle}`,
    buttonText: metaText(fields.get("banner_button_text")) || "Explorer",
    position: Number.parseInt(fields.get("banner_position")?.value ?? "", 10) || 0,
  };
}

/**
 * Bannières de la grille d'accueil.
 * @returns un tableau éventuellement vide (l'appelant décide du repli éditorial).
 */
export async function getCategoryBanners({
  first = MAX_BANNERS,
}: { first?: number } = {}): Promise<CollectionBanner[]> {
  try {
    const data = await storefrontFetch<{
      collections: { nodes: ShopifyCollectionBannerNode[] };
    }>({
      query: GET_COLLECTION_BANNERS_QUERY,
      variables: { first },
      tags: [...BANNER_CACHE_TAGS],
    });

    const banners = (data.data.collections?.nodes ?? [])
      .map(toBanner)
      .filter((banner): banner is CollectionBanner => banner !== null);

    return banners.sort(byEditorialOrder);
  } catch (error) {
    console.warn(
      `[shopify:banners] Metafields de bannière illisibles (${toErrorMessage(error)}) — ` +
        `les univers afficheront leurs visuels éditoriaux de repli.`,
    );
    return [];
  }
}

/**
 * Bannière d'une collection pour sa page dédiée.
 * @returns `null` si la collection n'existe pas ou n'a aucun visuel exploitable.
 */
export async function getCollectionBanner(
  handle: string,
): Promise<CollectionBanner | null> {
  try {
    const data = await storefrontFetch<{
      collection: ShopifyCollectionBannerNode | null;
    }>({
      query: GET_COLLECTION_BANNER_QUERY,
      variables: { handle },
      tags: [...BANNER_CACHE_TAGS, `collection-${handle}`],
    });

    return data.data.collection ? toBanner(data.data.collection) : null;
  } catch (error) {
    console.warn(
      `[shopify:banners] Bannière de « ${handle} » illisible (${toErrorMessage(error)}).`,
    );
    return null;
  }
}

/** Tri éditorial : `banner_position` croissant, puis titre (ordre naturel FR). */
function byEditorialOrder(a: CollectionBanner, b: CollectionBanner): number {
  if (a.position !== b.position) return a.position - b.position;
  return a.title.localeCompare(b.title, "fr", { numeric: true, sensitivity: "base" });
}