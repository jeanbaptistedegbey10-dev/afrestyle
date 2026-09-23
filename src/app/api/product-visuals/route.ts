// src/app/api/product-visuals/route.ts
// API route servant les URLs de visuels produits pour la page d'accueil.
//
// Stratégie de cache / ISR :
// - La route est révalidée toutes les 5 minutes (revalidate = 300s).
// - En cas de mutation catalogue, le tag "product-visuals" est réinvalidé via
//   /api/revalidate ou un webhook Shopify (products/create, products/delete…).
// - On utilise la même source de vérité que la page d'accueil :
//   getProductVisualsUrls() → getAllProductsCatalog() (URLs Shopify uniquement).

import { NextResponse } from "next/server";
import { getProductVisualsUrls } from "@/constants/images";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const catalogSize = Number.parseInt(url.searchParams.get("catalogSize") ?? "12", 10);
  const size = Number.isFinite(catalogSize) && catalogSize > 0 ? catalogSize : 12;

  try {
    const urls = await getProductVisualsUrls({ catalogSize: size });
    return NextResponse.json(
      { urls, count: urls.length, source: "product-visuals-api" },
      {
        headers: {
          "x-product-visuals-source": "product-visuals-api",
        },
      },
    );
  } catch (error) {
    console.error("[api/product-visuals]", error);
    return NextResponse.json(
      {
        urls: [],
        count: 0,
        source: "product-visuals-api",
        error: "Impossible de charger les visuels produits.",
      },
      {
        status: 500,
        headers: {
          "x-product-visuals-source": "product-visuals-api",
        },
      },
    );
  }
}

