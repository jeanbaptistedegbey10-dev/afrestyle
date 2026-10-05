// src/app/wishlist/WishlistView.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  CORPS DE LA PAGE FAVORIS — composant client.
//
//  Pourquoi un composant client : la wishlist vit dans `localStorage`
//  (`useWishlistStore`), donc elle est INEXISTANTE au rendu serveur. La page
//  `/wishlist` reste un Server Component (SEO + métadonnées) et délègue
//  l'affichage interactif à ce composant.
//
//  RÉHYDRATATION : à la visite, les handles locaux sont ré-expécutés contre la
//  Storefront API (`resolveWishlistProducts`) pour rafraîchir prix / visuel /
//  disponibilité et purger les pièces retirées du catalogue. Tant que la
//  résolution n'a pas abouti, on affiche le SNAPSHOT local (rendu instantané,
//  jamais d'écran vide).
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import { useWishlist } from "@/hooks/useWishlist";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import { resolveWishlistProducts } from "@/lib/actions/wishlist.actions";
import SafeImage from "@/components/ui/SafeImage";
import { withShopifyCdnWidth } from "@/lib/assets/images";

export default function WishlistView() {
  const mounted = useMounted();
  const { items, count, removeItem, clearAll } = useWishlist();
  const reconcile = useWishlistStore((state) => state.reconcile);
  // `useRef` (et non un état) : ce drapeau ne doit jamais déclencher de rendu,
  // il sert uniquement à garantir UN SEUL appel de résolution par visite.
  const syncStarted = useRef(false);

  // Réhydratation Shopify — une seule fois par visite de page.
  //
  // Aucun `setState` ici (règle `react-hooks/set-state-in-effect`) : le
  // résultat est poussé DIRECTEMENT dans le store Zustand, qui est la source
  // de vérité de la liste. Le rendu suivant affiche donc les données fraîches
  // sans état de chargement intermédiaire — le squelette couvre déjà l'hydratation.
  useEffect(() => {
    if (syncStarted.current) return;
    syncStarted.current = true;

    // Lecture directe du store : la liste peut avoir changé entre le rendu et
    // l'effet, et l'effet ne doit pas se redéclencher sur chaque favori.
    const handles = useWishlistStore
      .getState()
      .items.map((item) => item.handle);
    if (handles.length === 0) return;

    let cancelled = false;

    void (async () => {
      try {
        const { items: fresh } = await resolveWishlistProducts(handles);
        if (cancelled) return;

        // `reconcile` fait tout le travail : il rafraîchit prix / visuels des
        // favoris résolus ET purge les handles absents de `fresh` (produits
        // retirés du catalogue). Un seul `set`, donc un seul rendu.
        reconcile(fresh);
      } catch {
        // Échec réseau : on conserve le snapshot local (dégradation silencieuse).
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reconcile]);

  // ── Squelette de chargement (premier rendu, avant hydratation localStorage) ──
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 size={28} className="animate-spin text-gold-dark dark:text-gold" />
        <p className="text-[11px] uppercase tracking-[0.25em] text-text-3">
          Chargement de vos favoris
        </p>
      </div>
    );
  }

  // ── État vide éditorial ────────────────────────────────────────────────────
  if (count === 0) {
    return (
      <div className="flex flex-col items-center border-y border-line px-6 py-24 text-center">
        <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-surface text-gold-dark dark:text-gold">
          <Heart size={26} />
        </span>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-text-3">
          N° — Vos sélections
        </p>
        <h2 className="mt-4 max-w-md font-serif text-3xl leading-tight text-text md:text-4xl">
          Aucune pièce enregistrée pour le moment
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-2">
          Touchez le cœur d&apos;une création pour la retrouver ici — vos favoris
          sont conservés sur cet appareil.
        </p>
        <Link href="/collections" className="btn-outline mt-8">
          Explorer la collection
        </Link>
      </div>
    );
  }


  // ── Grille des favoris ─────────────────────────────────────────────────────
  return (
    <div>
      {/* Barre de pilotage : compteur + vidage */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <p className="text-[11px] uppercase tracking-[0.25em] text-text-3">
          {count} pièce{count > 1 ? "s" : ""} enregistrée{count > 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-text-3 transition-colors duration-300 hover:text-accent-dark"
        >
          <Trash2 size={13} aria-hidden="true" />
          Tout retirer
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.handle}
            className="group relative flex flex-col rounded-sm border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl"
          >
            {/* Retirer des favoris — toujours atteignable au toucher */}
            <button
              type="button"
              onClick={() => removeItem(item.handle)}
              aria-label={`Retirer ${item.title} des favoris`}
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-sm border border-line bg-surface text-gold shadow-sm transition-all duration-300 hover:border-gold"
            >
              <Heart size={14} className="fill-gold text-gold" aria-hidden="true" />
            </button>

            <Link
              href={`/products/${item.handle}`}
              className="block"
              tabIndex={-1}
              aria-hidden="true"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-sm">
                <SafeImage
                  src={item.image ? withShopifyCdnWidth(item.image, 800) : null}
                  alt={item.imageAlt ?? item.title}
                  fallbackAlt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
            </Link>

            <div className="flex flex-1 flex-col p-4">
              {item.vendor ? (
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-text-3">
                  {item.vendor}
                </p>
              ) : null}
              <h3 className="font-serif text-base leading-snug text-text">
                <Link
                  href={`/products/${item.handle}`}
                  className="transition-colors duration-300 hover:text-gold-dark dark:hover:text-gold"
                >
                  {item.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm font-medium text-text">
                {item.priceFormatted}
              </p>

              {!item.availableForSale ? (
                <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-accent-dark">
                  Épuisé
                </p>
              ) : null}

              <Link
                href={`/products/${item.handle}`}
                className="btn-outline mt-4 w-full justify-center py-2.5 text-[10px]"
              >
                <ShoppingBag size={12} aria-hidden="true" />
                {item.availableForSale ? "Voir la pièce" : "Découvrir"}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
