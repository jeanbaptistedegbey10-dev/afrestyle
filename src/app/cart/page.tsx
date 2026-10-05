// src/app/cart/page.tsx — Panier (Server Component)
// ─────────────────────────────────────────────────────────────────────────────
//  Vue complète du panier (le `CartDrawer` reste l'UX rapide d'ajout).
//
//  La liste vit dans `localStorage` : elle est absente du rendu serveur. Cette
//  page reste un Server Component (métadonnées, en-tête éditorial) et délègue
//  l'affichage interactif à `CartView`, qui ré-expécute le panier contre la
//  Storefront API via `syncCart()`.
//
//  `noindex` volontaire : page personnelle, dépendante d'un navigateur.
// ─────────────────────────────────────────────────────────────────────────────
import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import CartView from "./CartView";

export const metadata: Metadata = {
  title: "Mon panier",
  description:
    "Retrouvez le contenu de votre panier AfroStyle et proceedez à votre commande en toute sécurité.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* En-tête éditorial — même gabarit que /collections et /wishlist */}
      <header className="border-b border-line px-6 py-14 text-center md:py-20">
        <p className="mb-3 flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold-dark dark:text-gold">
          <ShoppingBag size={13} aria-hidden="true" />
          Votre sélection
        </p>
        <h1 className="font-serif text-4xl leading-tight text-text md:text-6xl">
          Mon <em className="text-gold-dark dark:text-gold">panier</em>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-text-2">
          Votre panier est synchronisé avec notre boutique — vos prix et
          disponibilités sont toujours à jour.
        </p>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <CartView />
      </div>
    </div>
  );
}
