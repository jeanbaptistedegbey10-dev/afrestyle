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
  // Active les React Server Components (activé par défaut dans Next.js 14)
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

module.exports = nextConfig;
