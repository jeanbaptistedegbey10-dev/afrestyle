// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Autorise les images venant de Shopify CDN (produits, variantes, assets)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/e/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/cdn/**",
      },
      {
        protocol: "https",
        hostname: "shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.myshopify.com",
      },
      // Autorise les visuels Unsplash HD (hero, catégories, lookbook)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // ⚠️ Next 16 met en cache une image optimisée pendant 4 h par défaut
    // (`minimumCacheTTL: 14400`). Or les visuels produits sont ré-uploadés
    // dans Shopify Admin sous la MÊME URL (`/files/…jpg?v=…`) : une pièce
    // mise à jour resterait donc invisible 4 heures. On désactive ce cache
    // pour que le premier rafraîchissement affiche l'image réellement servie
    // par le CDN Shopify (le CDN Shopify conserve, lui, sa propre gestion).
    minimumCacheTTL: 0,
    formats: ["image/avif", "image/webp"],
  },
  // Server Actions : stables depuis Next 15 — pas de bloc `experimental` requis
  // (l'ancien `serverActions.allowedOrigins` affichait une bannière
  // « Experiments (use with caution) » au démarrage ; l'origine same-origin
  // est le comportement par défaut et suffit en dev comme en production).
};

module.exports = nextConfig;
