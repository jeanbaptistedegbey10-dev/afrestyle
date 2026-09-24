// src/app/api/products/route.ts
// ────────────────────────────────────────────────────────────────────────────
//  API Route cursor-based du catalogue (Phase 5).
//  GET /api/products?gender=femme&cursor=<endCursor>&first=12
//  (alias legacy acceptés : genre, category — cf. resolveGender()).
//  Utilisée par <LoadMoreProducts /> pour concaténer les pages suivantes
//  sans recharger la page. La construction query/tri est partagée avec
//  la page serveur via @/lib/collections (source de vérité unique).
// ────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify/products";
import {
  COLLECTION_PAGE_SIZE,
  buildCollectionQuery,
  resolveCollectionSort,
  type CollectionFilterParams,
} from "@/lib/collections";

export const dynamic = "force-dynamic";

function clampFirst(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return COLLECTION_PAGE_SIZE;
  return Math.min(Math.max(n, 1), 50);
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const sp = url.searchParams;

  const params: CollectionFilterParams = {
    gender: sp.get("gender") ?? undefined,
    genre: sp.get("genre") ?? undefined,
    category: sp.get("category") ?? undefined,
    pays: sp.get("pays") ?? undefined,
    tissu: sp.get("tissu") ?? undefined,
    style: sp.get("style") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    q: sp.get("q") ?? undefined,
  };

  const sort = resolveCollectionSort(params.sort);
  const query = buildCollectionQuery(params);
  const first = clampFirst(sp.get("first"));
  const after = sp.get("cursor") ?? undefined;

  try {
    const { products, pageInfo } = await getProducts({
      first,
      after,
      query: query || undefined,
      sortKey: sort.sortKey,
      reverse: sort.reverse,
    });

    return NextResponse.json({ products, pageInfo });
  } catch (error) {
    console.error("[api/products]", error);
    return NextResponse.json(
      { error: "Impossible de charger les produits." },
      { status: 500 },
    );
  }
}
