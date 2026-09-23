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
    formats: ["image/avif", "image/webp"],
  },
  // Server Actions : stables depuis Next 15 — pas de bloc `experimental` requis
  // (l'ancien `serverActions.allowedOrigins` affichait une bannière
  // « Experiments (use with caution) » au démarrage ; l'origine same-origin
  // est le comportement par défaut et suffit en dev comme en production).
};

module.exports = nextConfig;
