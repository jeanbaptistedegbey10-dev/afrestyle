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

export type SyncProductImagesOptions = {
  /** Si true, affiche ce qui serait fait sans écrire en Admin. */
  dryRun?: boolean;
  /** Nombre de produits à traiter par exécution (évite les timeouts). */
  batchSize?: number;
  /** Si défini, traitement limité aux produits dont le handle commence par ce préfixe. */
  handlePrefix?: string;
};

export type SyncProductImagesResult = {
  processed: number;
  created: number;
  skipped: number;
  errors: string[];
  dryRun: boolean;
};

/**
 * Synchronise les médias produits en réimportant les URLs existantes dans le
 * Storefront afin de pérenniser les images (endpoint Admin → médias pérennes).
 */
export async function syncProductImages({
  dryRun = false,
  batchSize = 50,
  handlePrefix,
}: SyncProductImagesOptions = {}): Promise<SyncProductImagesResult> {
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!token) {
    return {
      processed: 0,
      created: 0,
      skipped: 0,
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

  for (const product of products) {
    processed++;

    // Détermine les images à pérenniser (produit + variantes).
    const imageUrls = new Map<string, string>();
    for (const image of product.images) {
      if (image.url) imageUrls.set(image.url, image.altText ?? "");
    }
    for (const variant of product.variants) {
      const vi = variant.image;
      if (vi?.url && !imageUrls.has(vi.url)) {
        imageUrls.set(vi.url, vi.altText ?? "");
      }
    }

    if (imageUrls.size === 0) {
      skipped++;
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

  return { processed, created, skipped, errors, dryRun };
}

