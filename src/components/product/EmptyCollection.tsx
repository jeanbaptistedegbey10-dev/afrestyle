// src/components/product/EmptyCollection.tsx
// ────────────────────────────────────────────────────────────────────────────
//  État vide éditorial du catalogue (Phase 5 — Luxe & Éditorial).
// ────────────────────────────────────────────────────────────────────────────
import Link from "next/link";

export default function EmptyCollection() {
  return (
    <div className="flex flex-col items-center border-y border-line px-6 py-24 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-text-3">
        N° — Sélection
      </p>
      <h2 className="mt-4 max-w-md font-serif text-3xl leading-tight text-text md:text-4xl">
        Aucune création ne correspond à votre sélection
      </h2>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-2">
        Affinez votre recherche ou explorez l’ensemble de nos pièces —
        chaque création raconte une histoire.
      </p>
      <Link
        href="/collections"
        className="mt-8 border-b border-gold pb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-text transition-colors duration-300 hover:text-gold-dark"
      >
        Réinitialiser les filtres
      </Link>
    </div>
  );
}
