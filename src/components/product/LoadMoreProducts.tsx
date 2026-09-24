// src/components/product/LoadMoreProducts.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Bouton "Découvrir plus" + infinite scroll optionnel (Phase 5).
//  Concatène les pages suivantes via GET /api/products?cursor=<endCursor>.
//  Design sobre : bordure fine neutre, pas de pill générique.
// ────────────────────────────────────────────────────────────────────────────
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { CollectionPageInfo } from "@/lib/collections";
import type { Product } from "@/lib/shopify/types";

type ApiPayload = {
  products: Product[];
  pageInfo: CollectionPageInfo;
};

type LoadMoreProductsProps = {
  /** Filtres courants déjà sérialisés pour l'API route (sans cursor). */
  apiParams: Record<string, string>;
  pageInfo: CollectionPageInfo;
  onAppend: (products: Product[], pageInfo: CollectionPageInfo) => void;
  /** Active l'infinite scroll en plus du bouton (désactivé par défaut). */
  infiniteScroll?: boolean;
};

export default function LoadMoreProducts({
  apiParams,
  pageInfo: initialPageInfo,
  onAppend,
  infiniteScroll = false,
}: LoadMoreProductsProps) {
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !pageInfo.hasNextPage || !pageInfo.endCursor) return;
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams(apiParams);
      sp.set("cursor", pageInfo.endCursor);
      const res = await fetch(`/api/products?${sp.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ApiPayload;
      setPageInfo(data.pageInfo);
      onAppend(data.products, data.pageInfo);
    } catch {
      setError(
        "La suite de la sélection est momentanément indisponible — merci de réessayer dans un instant.",
      );
    } finally {
      setLoading(false);
    }
  }, [apiParams, loading, onAppend, pageInfo]);

  // Infinite scroll progressif (IntersectionObserver) — le bouton reste visible.
  useEffect(() => {
    if (!infiniteScroll) return;
    const el = sentinelRef.current;
    if (!el || !pageInfo.hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [infiniteScroll, loadMore, pageInfo.hasNextPage]);

  if (!pageInfo.hasNextPage && !loading) return null;

  return (
    <div className="mt-14 flex flex-col items-center gap-3">
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      <button
        type="button"
        onClick={() => void loadMore()}
        disabled={loading}
        className="border border-text px-10 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-text transition-colors duration-300 hover:bg-text hover:text-bg disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Chargement…
          </span>
        ) : (
          "Découvrir plus"
        )}
      </button>
      {error && <p className="text-xs text-text-3">{error}</p>}
    </div>
  );
}
