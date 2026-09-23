// src/components/product/EmptyCollection.tsx
// ────────────────────────────────────────────────────────────────────────────
//  État vide éditorial du catalogue (Phase 5 — Luxe & Éditorial).
// ────────────────────────────────────────────────────────────────────────────
import Link from "next/link";

export default function EmptyCollection() {
  return (
    <div className="flex flex-col items-center border-y border-neutral-200 px-6 py-24 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
        N° — Sélection
      </p>
      <h2 className="mt-4 max-w-md font-serif text-3xl leading-tight text-neutral-900 md:text-4xl">
        Aucune création ne correspond à votre sélection
      </h2>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-500">
        Affinez votre recherche ou explorez l’ensemble de nos pièces —
        chaque création raconte une histoire.
      </p>
      <Link
        href="/collections"
        className="mt-8 border-b border-neutral-900 pb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-900 transition-colors duration-300 hover:text-neutral-500"
      >
        Réinitialiser les filtres
      </Link>
    </div>
  );
}
