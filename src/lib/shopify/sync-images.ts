// src/lib/shopify/sync-images.ts
// Synchronisation des URLs d'images Shopify sur les produits (Admin API).
//
// Contexte :
// - La Storefront API renvoie les images des produits, mais parfois les médias
//   ne sont pas encore "pérennisés" dans le Storefront (ex. images importées,
//   médias temporaires, produits migrés).
// - Ce script parcourt le catalogue et, pour chaque produit sans image pérenne
//   dans le Storefront, réimporte l'URL via l'Admin API (mediaCreate / productCreateMedia).
//
// Prérequis :
// - SHOPIFY_ADMIN_ACCESS_TOKEN défini dans .env.local (scopes : write_products,
//   read_publications, write_publications, write_media_images).
// - Le Storefront doit être activé et accessible.
//
// Usage :
// - Via la route /api/sync/product-images (GET avec ?dryRun=true).
// - Ou via script CLI / Server Action selon les besoins.
//
// Sécurité :
// - Cette opération est serveur uniquement et ne doit jamais être exposée
//   publiquement non authentifiée. Voir /api/sync/product-images/route.ts.

import { adminFetch } from "./adminClient";
import { getAllProductsCatalog } from "./products";
import { GET_ADMIN_MUTATION_SET_MEDIA_FROM_URL } from "./queries/sync-images";
import {
  buildImageAlt,
  findProductMainImage,
  formatImageCredit,
  imageKey,
  isDescriptiveAlt,
  isPlaceholderImageUrl,
  type ProductImageCandidate,
  type ProductImageContext,
} from "./image-pipeline";

export type SyncProductImagesOptions = {
  /** Si true, affiche ce qui serait fait sans écrire en Admin. */
  dryRun?: boolean;
  /** Nombre de produits à traiter par exécution (évite les timeouts). */
  batchSize?: number;
  /** Si défini, traitement limité aux produits dont le handle commence par ce préfixe. */
  handlePrefix?: string;
  /**
   * Assigne un visuel issu du pipeline (brief × fiche × tags) aux produits
   * SANS image au lieu de les ignorer. Défaut : `true` — chaque produit doit
   * posséder une image principale unique et nette.
   */
  assignMissingImages?: boolean;
  /** URLs déjà utilisées : écartées pour garantir l'unicité des visuels. */
  usedImageUrls?: Iterable<string>;
  /** Quand `assignMissingImages` est actif, limite les assignations/réelle exécution. */
  maxAssignments?: number;
};

export type SyncProductImagesResult = {
  processed: number;
  created: number;
  skipped: number;
  /** Visuels manquants réellement assignés via le pipeline (brief × fiche × tags). */
  assigned: ProductImageCandidate[];
  /** En dry-run : fiche → URL planifiée (aucune écriture). */
  planned: { handle: string; title: string; url: string; source: string; alt: string }[];
  errors: string[];
  dryRun: boolean;
};

/**
 * Synchronise les médias produits :
 *  - pérennise les images existantes en réimportant leurs URLs (Admin →
 *    médias pérennes affichés dans le Storefront) ;
 *  - complète chaque `alt` vide ou réduit au titre par un texte descriptif
 *    et factuel issu du brief éditorial ;
 *  - assigne un visuel conforme au brief (brief × fiche × tags, unique,
 *    vérifié) aux produits SANS aucune image (`assignMissingImages`).
 */
export async function syncProductImages({
  dryRun = false,
  batchSize = 50,
  handlePrefix,
  assignMissingImages = true,
  usedImageUrls,
  maxAssignments,
}: SyncProductImagesOptions = {}): Promise<SyncProductImagesResult> {
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!token) {
    return {
      processed: 0,
      created: 0,
      skipped: 0,
      assigned: [],
      planned: [],
      errors: ["SHOPIFY_ADMIN_ACCESS_TOKEN non défini — synchronisation annulée."],
      dryRun,
    };
  }

  const catalog = await getAllProductsCatalog({ first: batchSize });
  const products = catalog.products.filter((p) => {
    if (!handlePrefix) return true;
    return p.handle.startsWith(handlePrefix);
  });

  let processed = 0;
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const assigned: ProductImageCandidate[] = [];
  const planned: SyncProductImagesResult["planned"] = [];

  const usedKeys = new Set<string>();
  for (const url of usedImageUrls ?? []) usedKeys.add(imageKey(url));
  // Les visuels déjà affichés ne sont jamais réassignés.
  for (const product of products) {
    for (const image of product.images) {
      if (image.url) usedKeys.add(imageKey(image.url));
    }
  }

  let assignmentsLeft = maxAssignments ?? Number.POSITIVE_INFINITY;

  for (const product of products) {
    processed++;

    const context: ProductImageContext = {
      id: product.id,
      handle: product.handle,
      title: product.title,
      vendor: product.vendor,
      tags: product.tags,
    };

    // Détermine les images à pérenniser (produit + variantes), sans placeholders
    // locaux (SVG / data-URI) que Shopify ne peut pas importer.
    const imageUrls = new Map<string, string>();
    let position = 0;
    for (const image of product.images) {
      if (!image.url || isPlaceholderImageUrl(image.url) || imageUrls.has(image.url)) continue;
      position++;
      const alt = isDescriptiveAlt(image.altText, context)
        ? (image.altText as string)
        : buildImageAlt(context, { position });
      imageUrls.set(image.url, alt);
    }
    for (const variant of product.variants) {
      const vi = variant.image;
      if (vi?.url && !isPlaceholderImageUrl(vi.url) && !imageUrls.has(vi.url)) {
        position++;
        const alt = isDescriptiveAlt(vi.altText, context)
          ? (vi.altText as string)
          : buildImageAlt(context, { position });
        imageUrls.set(vi.url, alt);
      }
    }

    // Produit sans image : le pipeline attribue un visuel conforme au brief
    // (unique, vérifié, lié à la fiche et à ses tags) au lieu de l'ignorer.
    if (imageUrls.size === 0) {
      if (!assignMissingImages || assignmentsLeft <= 0) {
        skipped++;
        continue;
      }

      const candidate = await findProductMainImage(context, {
        usedImageUrls: [...usedKeys],
        verify: true,
      });

      if (!candidate) {
        errors.push(`[${product.handle}] aucun visuel disponible (recherche + pool curaté).`);
        skipped++;
        continue;
      }

      const alt = buildImageAlt(context, {
        position: 1,
        visualDescription: candidate.label,
      });
      usedKeys.add(imageKey(candidate.url));
      assignmentsLeft--;

      if (dryRun) {
        planned.push({
          handle: product.handle,
          title: product.title,
          url: candidate.url,
          source: candidate.source,
          alt,
        });
        created++;
        continue;
      }

      try {
        await adminFetch<{ productCreateMedia: { media: { id: string } } }>({
          query: GET_ADMIN_MUTATION_SET_MEDIA_FROM_URL,
          variables: {
            productId: `gid://shopify/Product/${product.id}`,
            mediaUrl: candidate.url,
            alt,
          },
        });
        assigned.push(candidate);
        created++;
        console.log(
          `[sync] [${product.handle}] visuel assigné (${candidate.source}) — ${formatImageCredit(candidate)}`,
        );
      } catch (error) {
        errors.push(
          `[${product.handle}] assignation impossible : ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      continue;
    }

    if (dryRun) {
      created += imageUrls.size;
      continue;
    }

    for (const [url, altText] of imageUrls.entries()) {
      try {
        await adminFetch<{ productCreateMedia: { media: { id: string } } }>({
          query: GET_ADMIN_MUTATION_SET_MEDIA_FROM_URL,
          variables: {
            productId: `gid://shopify/Product/${product.id}`,
            mediaUrl: url,
            alt: altText,
          },
        });
        created++;
      } catch (error) {
        errors.push(
          `[${product.handle}] ${url}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  return { processed, created, skipped, assigned, planned, errors, dryRun };
}

