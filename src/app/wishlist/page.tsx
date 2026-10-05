// src/app/wishlist/page.tsx — Favoris (Server Component)
// ─────────────────────────────────────────────────────────────────────────────
//  Page « Mes favoris ».
//
//  La liste vit dans `localStorage` : elle est donc absente du rendu serveur.
//  Cette page reste un Server Component (métadonnées, structure sémantique,
//  en-tête éditorial) et délègue l'affichage interactif à `WishlistView`.
//
//  `noindex` volontaire : une page personnelle, dépendante d'un navigateur, n'a
//  rien à faire dans un index de moteur de recherche.
// ─────────────────────────────────────────────────────────────────────────────
import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import WishlistView from "./WishlistView";

export const metadata: Metadata = {
  title: "Mes favoris",
  description:
    "Retrouvez les pièces AfroStyle que vous avez enregistrées : vos sélections personnelles, conservées sur votre appareil.",
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* En-tête éditorial — même gabarit que /collections et /lookbook */}
      <header className="border-b border-line px-6 py-14 text-center md:py-20">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold-dark dark:text-gold">
          N° — Vos sélections
        </p>
        <h1 className="font-serif text-4xl leading-tight text-text md:text-6xl">
          Mes <em className="text-gold-dark dark:text-gold">favoris</em>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-text-2">
          Les pièces que vous avez choisies, conservées sur cet appareil — prix et
          disponibilités actualisés depuis notre boutique.
        </p>
        <Link
          href="/collections"
          className="mt-6 inline-flex items-center gap-2 border-b border-gold pb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-text transition-colors duration-300 hover:text-gold-dark dark:hover:text-gold"
        >
          <Heart size={12} aria-hidden="true" />
          Poursuivre la découverte
        </Link>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <WishlistView />
      </div>
    </div>
  );
}
