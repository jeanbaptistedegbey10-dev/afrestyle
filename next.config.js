// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Autorise les images venant de Shopify CDN
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "**.myshopify.com",
      },
    ],
  },
  // Active les React Server Components (activé par défaut dans Next.js 14)
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

module.exports = nextConfig;