// src/app/api/sync/product-images/route.ts
// Route de synchronisation des médias produits Shopify (Admin → Storefront).
//
// Utilisation :
// - GET /api/sync/product-images?dryRun=true  → simulation (pas d'écriture)
// - GET /api/sync/product-images              → synchronisation réelle
//
// Sécurité :
// - Cette route est réservée à l'administration. Elle doit être appelée depuis
//   un contexte authentifié (ex. webhook signé, admin dashboard, ou secret partagé).
// - Si SHOPIFY_ADMIN_ACCESS_TOKEN est manquant, la route renvoie 503 et un message explicite.
//
// Intégration ISR / cache :
// - Après une synchronisation réussie, on réinvalide le tag "product-visuals"
//   pour que les pages /shop, /collections/[handle] et l'accueil se mettent à jour.

import { NextRequest, NextResponse } from "next/server";
import { syncProductImages } from "@/lib/shopify/sync-images";
import { revalidateTag } from "next/cache";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: "SHOPIFY_ADMIN_ACCESS_TOKEN non défini — synchronisation impossible.",
      },
      { status: 503 },
    );
  }

  const dryRun =
    request.nextUrl.searchParams.get("dryRun") === "true";

  try {
    const result = await syncProductImages({ dryRun });
    if (!dryRun && result.errors.length === 0) {
      try {
        revalidateTag("product-visuals", { expire: 0 });
        revalidateTag("products", { expire: 0 });
        revalidateTag("catalog", { expire: 0 });
      } catch {
        // La réinvalidation est optionnelle pour ne pas bloquer la réponse.
      }
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[api/sync/product-images]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      },
      { status: 500 },
    );
  }
}

