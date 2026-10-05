// src/app/cart/CartView.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  CORPS DE LA PAGE PANIER — composant client.
//
//  Complément du `CartDrawer` : le tiroir reste l'UX rapide (ajout au panier),
//  cette page offre la vue complète (récapitulatif, quantités, totaux) — utile
//  sur mobile et pour les paniers volumineux.
//
//  RÉCUPÉRATION DU PANIER : au montage, `syncCart()` rejoue le panier persisté
//  contre la Storefront API (`getCart`). Si le panier a expiré côté Shopify, il
//  est purgé et l'utilisateur est prévenu — au lieu d'afficher un panier mort.
//
//  SSR : le panier vit dans `localStorage`, il est donc vide au rendu serveur.
//     `useMounted()` gate l'affichage dynamique pour éviter tout mismatch
//     d'hydratation.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Loader2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useMounted } from "@/hooks/useMounted";
import { formatPrice } from "@/lib/utils";
import SafeImage from "@/components/ui/SafeImage";
import FreeShippingProgress from "@/components/cart/FreeShippingProgress";

export default function CartView() {
  const mounted = useMounted();
  const {
    lines,
    cart,
    isLoading,
    updateItem,
    removeItem,
    checkoutUrl,
    syncCart,
  } = useCart();
  // `useRef` : garantit UNE seule synchronisation, sans setState d'effet
  // (règle `react-hooks/set-state-in-effect`).
  const syncStarted = useRef(false);

  useEffect(() => {
    if (syncStarted.current) return;
    syncStarted.current = true;
    void syncCart();
  }, [syncCart]);

  const subtotal = cart?.cost.subtotalAmount;
  const total = cart?.cost.totalAmount;
  const canCheckout = Boolean(checkoutUrl) && lines.length > 0;

  // ── Chargement / hydratation ───────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 size={28} className="animate-spin text-gold-dark dark:text-gold" />
        <p className="text-[11px] uppercase tracking-[0.25em] text-text-3">
          Récupération de votre panier
        </p>
      </div>
    );
  }

  // ── État vide ──────────────────────────────────────────────────────────────
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center border-y border-line px-6 py-24 text-center">
        <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-surface text-gold-dark dark:text-gold">
          <ShoppingBag size={26} />
        </span>
        <h2 className="font-serif text-3xl leading-tight text-text md:text-4xl">
          Votre panier est vide
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-2">
          Parcourez la collection et découvrez les pièces de la saison — chaque
          création est façonnée par nos ateliers partenaires.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/collections" className="btn-primary">
            Découvrir la collection
          </Link>
          <Link href="/wishlist" className="btn-outline">
            Voir mes favoris
          </Link>
        </div>
      </div>
    );
  }


  // ── Récapitulatif ──────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
      {/* Lignes du panier */}
      <section aria-label="Articles dans votre panier">
        <ul className="space-y-4">
          {lines.map((line) => (
            <li
              key={line.id}
              className="flex gap-4 rounded-sm border border-line bg-surface p-4 shadow-sm transition-all duration-300 hover:border-gold/40 hover:shadow-md"
            >
              <Link
                href={`/products/${line.merchandise.product.handle}`}
                className="relative h-32 w-24 shrink-0 overflow-hidden rounded-sm border border-line bg-surface-2 sm:h-40 sm:w-32"
              >
                <SafeImage
                  src={line.merchandise.image?.url ?? null}
                  alt={
                    line.merchandise.image?.altText ?? line.merchandise.product.title
                  }
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-text-3">
                      {line.merchandise.product.title}
                    </p>
                    <h3 className="mt-1 font-serif text-base leading-snug text-text">
                      <Link
                        href={`/products/${line.merchandise.product.handle}`}
                        className="transition-colors duration-300 hover:text-gold-dark dark:hover:text-gold"
                      >
                        {line.merchandise.title}
                      </Link>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.id)}
                    disabled={isLoading}
                    aria-label={`Retirer ${line.merchandise.title} du panier`}
                    className="shrink-0 p-1 text-text-3 transition-colors duration-200 hover:text-accent-dark"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                  {/* Sélecteur de quantité */}
                  <div className="flex items-center rounded-sm border border-line">
                    <button
                      type="button"
                      onClick={() => updateItem(line.id, line.quantity - 1)}
                      disabled={isLoading}
                      aria-label="Diminuer la quantité"
                      className="flex h-10 w-10 items-center justify-center text-text-2 transition-colors duration-200 hover:bg-surface-2 hover:text-text disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span
                      className="w-9 text-center text-sm font-medium text-text"
                      aria-live="polite"
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItem(line.id, line.quantity + 1)}
                      disabled={isLoading}
                      aria-label="Augmenter la quantité"
                      className="flex h-10 w-10 items-center justify-center text-text-2 transition-colors duration-200 hover:bg-surface-2 hover:text-text disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <p className="font-serif text-base font-medium text-text">
                    {formatPrice(
                      (Number(line.merchandise.price.amount) * line.quantity).toFixed(2),
                      line.merchandise.price.currencyCode,
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/collections"
          className="mt-8 inline-flex items-center gap-2 border-b border-gold pb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-text transition-colors duration-300 hover:text-gold-dark dark:hover:text-gold"
        >
          <ArrowRight size={13} className="rotate-180" aria-hidden="true" />
          Continuer mes achats
        </Link>
      </section>

      {/* Récapitulatif / checkout — collé en haut sur desktop */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-sm border border-line bg-surface p-6 shadow-sm">
          <h2 className="font-serif text-xl text-text">Récapitulatif</h2>

          <div className="mt-5">
            <FreeShippingProgress
              subtotal={subtotal ? parseFloat(subtotal.amount) : 0}
            />
          </div>

          {subtotal ? (
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-text-2">Sous-total</span>
              <span className="font-serif text-lg text-text">
                {formatPrice(subtotal.amount, subtotal.currencyCode)}
              </span>
            </div>
          ) : null}

          {total && total.amount !== subtotal?.amount ? (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-text-2">Total (taxes incluses)</span>
              <span className="font-medium text-gold-dark dark:text-gold">
                {formatPrice(total.amount, total.currencyCode)}
              </span>
            </div>
          ) : null}

          <p className="mt-4 text-xs text-text-3">
            Frais de livraison calculés au checkout
          </p>

          <a
            href={canCheckout ? checkoutUrl ?? undefined : undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!canCheckout) e.preventDefault();
            }}
            aria-disabled={!canCheckout}
            className={`btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40`}
            style={
              canCheckout
                ? undefined
                : { background: "var(--surface-2)", color: "var(--text-3)" }
            }
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <>
                Procéder au paiement
                <ExternalLink size={14} aria-hidden="true" />
              </>
            )}
          </a>

          <Link
            href="/wishlist"
            className="mt-4 block text-center text-xs text-text-2 transition-colors duration-200 hover:text-gold-dark dark:hover:text-gold"
          >
            Voir mes favoris
          </Link>
        </div>
      </aside>
    </div>
  );
}

