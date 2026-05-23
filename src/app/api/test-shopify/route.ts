// src/app/api/test-shopify/route.ts
// C'est une API Route Next.js — accessible via GET /api/test-shopify
// "route.ts" est la convention App Router pour les endpoints API

import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify/client";

export async function GET() {
  try {
    const data = await shopifyFetch<{
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
      shop: data.data.shop,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
