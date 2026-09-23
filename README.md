This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Synchronisation des médias produits Shopify

Ce projet inclut un mécanisme de synchronisation des URLs d'images Shopify sur les produits (Admin API → Storefront). Cela permet de pérenniser les médias dans le Storefront afin que les pages `/shop`, `/collections/[handle]` et l'accueil bénéficient d'images stables.

### Prérequis

- `SHOPIFY_ADMIN_ACCESS_TOKEN` défini dans `.env.local` (scopes : `write_products`, `read_publications`, `write_publications`, `write_media_images`).
- Le Storefront doit être activé et accessible.

### Usage

#### Via la route API

```bash
# Simulation (dry-run)
curl "http://localhost:3000/api/sync/product-images?dryRun=true"

# Synchronisation réelle
curl "http://localhost:3000/api/sync/product-images"
```

#### Via le script CLI

```bash
# Simulation (dry-run)
npx tsx scripts/sync-product-images.ts --dry-run

# Synchronisation réelle
npx tsx scripts/sync-product-images.ts
```

### Sécurité

Cette opération est serveur uniquement et ne doit jamais être exposée publiquement non authentifiée. Voir `/api/sync/product-images/route.ts`.

### Intégration ISR / cache

Après une synchronisation réussie, la route réinvalide les tags `product-visuals`, `products` et `catalog` pour que les pages `/shop`, `/collections/[handle]` et l'accueil se mettent à jour.

### Résultat

La synchronisation pérennise les médias dans le Storefront afin que les pages `/shop`, `/collections/[handle]` et l'accueil bénéficient d'images stables.
## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

