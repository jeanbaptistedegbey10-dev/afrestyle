# Synchronisation des médias produits Shopify

Ce dossier contient les scripts et routes pour synchroniser les URLs d'images Shopify sur les produits (Admin API → Storefront).

## Contexte

La Storefront API renvoie les images des produits, mais parfois les médias ne sont pas encore "pérennisés" dans le Storefront (ex. images importées, médias temporaires, produits migrés). Ce script parcourt le catalogue et, pour chaque produit sans image pérenne dans le Storefront, réimporte l'URL via l'Admin API (`productCreateMedia`).

## Prérequis

- `SHOPIFY_ADMIN_ACCESS_TOKEN` défini dans `.env.local` (scopes : `write_products`, `read_publications`, `write_publications`, `write_media_images`).
- Le Storefront doit être activé et accessible.

## Usage

### Via la route API

```bash
# Simulation (dry-run)
curl "http://localhost:3000/api/sync/product-images?dryRun=true"

# Synchronisation réelle
curl "http://localhost:3000/api/sync/product-images"
```

### Via le script CLI

```bash
# Simulation (dry-run)
npx tsx scripts/sync-product-images.ts --dry-run

# Synchronisation réelle
npx tsx scripts/sync-product-images.ts
```

## Sécurité

Cette opération est serveur uniquement et ne doit jamais être exposée publiquement non authentifiée. Voir `/api/sync/product-images/route.ts`.

## Intégration ISR / cache

Après une synchronisation réussie, la route réinvalide les tags `product-visuals`, `products` et `catalog` pour que les pages `/shop`, `/collections/[handle]` et l'accueil se mettent à jour.

## Résultat

La synchronisation pérennise les médias dans le Storefront afin que les pages `/shop`, `/collections/[handle]` et l'accueil bénéficient d'images stables.

