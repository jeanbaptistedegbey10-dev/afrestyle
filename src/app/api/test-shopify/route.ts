// src/app/api/test-shopify/route.ts
// Endpoint de diagnostic — GET /api/test-shopify
//
// Passe par le client STOREFRONT (token public) : ce endpoint ne doit exposer
// que des lectures publiques. Les opérations d'administration se testent via
// un server action protégé (`adminFetch`), jamais depuis une URL publique.
//
// PHASE 2 — route dev/test protégée : exige le header
// `x-admin-secret: <ADMIN_SECRET_TOKEN>`, sinon HTTP 401 Unauthorized.

import { NextResponse } from "next/server";
import { storefrontFetch } from "@/lib/shopify/storefrontClient";
import { SHOPIFY_API_VERSION } from "@/lib/shopify/version";
import { hasValidAdminHeader } from "@/lib/auth/adminAuth";

export async function GET(request: Request) {
  // ── Garde dev/test : header x-admin-secret requis ─────────────────────
  if (!hasValidAdminHeader(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const data = await storefrontFetch<{
      shop: { name: string; primaryDomain: { url: string } };
    }>({
      query: `
        query {
          shop {
            name
            primaryDomain { url }
          }
        }
      `,
      cache: "no-store",
    });

    return NextResponse.json({
      success: true,
      apiVersion: SHOPIFY_API_VERSION,
      shop: data.data.shop,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        apiVersion: SHOPIFY_API_VERSION,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

