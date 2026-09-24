// src/components/cart/FreeShippingProgress.tsx
// Barre de progression « livraison offerte » du tiroir panier — P0 audit.
// Seuil centralisé dans src/constants/store.ts (harmonisé bandeau/FAQ/livraison).
"use client";

import {
  FREE_SHIPPING_THRESHOLD,
  formatStoreAmount,
} from "@/constants/store";

export default function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const threshold = FREE_SHIPPING_THRESHOLD;
  const remaining = Math.max(threshold - subtotal, 0);
  const unlocked = remaining <= 0;
  const progress = Math.min((subtotal / threshold) * 100, 100);

  return (
    <div
      className="space-y-2 rounded-sm px-3 py-3"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
      }}
    >
      <p
        className="text-xs leading-relaxed"
        style={{ color: unlocked ? "var(--gold-dark)" : "var(--text-2)" }}
      >
        {unlocked ? (
          <>✦ Livraison offerte débloquée — profitez-en&nbsp;!</>
        ) : (
          <>
            Plus que{" "}
            <strong style={{ color: "var(--text)" }}>
              {formatStoreAmount(remaining)}
            </strong>{" "}
            pour profiter de la livraison offerte&nbsp;!
          </>
        )}
      </p>

      <div
        role="progressbar"
        aria-label="Progression vers la livraison offerte"
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-valuenow={Math.min(Math.round(subtotal), threshold)}
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--line)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: unlocked
              ? "var(--gold)"
              : "linear-gradient(90deg, var(--gold-dark), var(--gold))",
          }}
        />
      </div>

      <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-3)" }}>
        Livraison offerte dès {formatStoreAmount(threshold)}
      </p>
    </div>
  );
}