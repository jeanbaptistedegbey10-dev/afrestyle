// src/app/robots.ts
// ────────────────────────────────────────────────────────────────────────────
//  Robots.txt dynamique Next.js App Router (Phase 6).
//  Autorise l'indexation globale, bloque les routes privées (/admin/*, /api/*),
//  et pointe vers le sitemap canonique.
// ────────────────────────────────────────────────────────────────────────────

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
