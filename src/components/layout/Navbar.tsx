// src/components/layout/Navbar.tsx — Éditorial Luxe, double thème Ivory/Obsidian
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Search, Menu, X, User, Heart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, formatStoreAmount } from "@/constants/store";
import ThemeToggle from "@/components/theme/ThemeToggle";

/** Bouton icône circulaire partagé (recherche / compte / favoris). */
const iconButtonClass =
  "relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-text-2 transition-all duration-200 hover:border-gold hover:text-gold-dark dark:hover:text-gold";

/** Pastille de compteur superposée à une icône. */
function IconBadge({ count, label }: { count: number; label: string }) {
  return (
    <span
      className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-line bg-gold px-1 text-[10px] font-bold leading-none text-gold-contrast shadow-sm"
      aria-label={label}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Le panier et les favoris viennent de Zustand persisté dans localStorage : le
  // rendu SSR donne toujours 0. On n'affiche les badges qu'après montage côté
  // client pour éviter le mismatch d'hydratation.
  const mounted = useMounted();
  const { totalItems, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/collections", label: "Shop" },
    { href: "/lookbook", label: "Lookbook" },
    { href: "/about", label: "Notre Histoire" },
  ];

  // Accès rapide — visibles sur mobile ET desktop (les anciens liens compte /
  // favoris étaient masqués sur mobile, donc inaccessibles).
  // `count` vaut 0 pour un lien sans compteur : l'union de types reste stable.
  const accountLinks: {
    href: string;
    label: string;
    icon: typeof User;
    count: number;
  }[] = [
    { href: "/account", label: "Mon compte", icon: User, count: 0 },
    {
      href: "/wishlist",
      label: "Mes favoris",
      icon: Heart,
      count: wishlistCount,
    },
  ];

  return (
    <>
      {/* Bandeau — conditions commerciales alignées sur /shipping, la FAQ et
          la section Réassurance de l'accueil (seuil unique : store.ts). */}
      <div className="bg-gold text-gold-contrast text-center text-xs tracking-widest uppercase py-2 px-4 font-medium">
        <span className="opacity-70 mr-3">✦</span>
        Livraison internationale offerte dès {formatStoreAmount(FREE_SHIPPING_THRESHOLD)}
        <span className="opacity-70 ml-3">✦</span>
      </div>

      <nav
        className={cn(
          "sticky top-0 z-50 bg-nav backdrop-blur-md transition-all duration-300",
          isScrolled && "border-b border-line shadow-[0_2px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)]",
          isScrolled ? "py-3" : "py-4"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold text-text">
            Afro<span className="text-gold-dark dark:text-gold italic font-normal">Style</span>
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-text-2 text-xs tracking-widest uppercase font-medium transition-colors duration-200 hover:text-gold-dark dark:hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            {/* Bascule thème Clair/Sombre — visible sur tout le site */}
            <ThemeToggle />

            <button
              aria-label="Rechercher"
              className={cn(iconButtonClass, "hidden md:flex")}
            >
              <Search size={15} />
            </button>

            {/* Mon compte — icône Utilisateur */}
            <Link href="/account" aria-label="Mon compte" className={iconButtonClass}>
              <User size={15} />
            </Link>

            {/* Favoris — icône Cœur + compteur (mounted : badge jamais en SSR) */}
            <Link
              href="/wishlist"
              aria-label={
                wishlistCount > 0
                  ? `Mes favoris (${wishlistCount})`
                  : "Mes favoris"
              }
              className={iconButtonClass}
            >
              <Heart size={15} />
              {mounted && wishlistCount > 0 && (
                <IconBadge count={wishlistCount} label="Favoris enregistrés" />
              )}
            </Link>

            <button
              onClick={openCart}
              aria-label="Panier"
              className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase px-4 py-2 bg-text text-bg hover:bg-gold hover:text-gold-contrast transition-colors duration-200 rounded-sm"
            >
              <ShoppingBag size={14} />
              <span className="hidden sm:inline">Panier</span>
              {mounted && totalItems > 0 && (
                <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold bg-surface text-text border border-line shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              className="md:hidden text-text"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-line bg-bg animate-fade-in">
            <ul className="flex flex-col px-4 sm:px-6 lg:px-8 py-4 gap-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-text text-sm tracking-widest uppercase block py-2 border-b border-line transition-colors hover:text-gold-dark dark:hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              {/* Accès client — même parcours que la barre desktop, mais avec
                  libellé complet (plus de cibles de 9 px sur mobile). */}
              <li className="border-t border-separator-gold pt-4">
                <ul className="flex flex-col gap-3">
                  {accountLinks.map(({ href, label, icon: Icon, count }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-1 text-sm text-text-2 transition-colors hover:text-gold-dark dark:hover:text-gold"
                      >
                        <Icon size={15} aria-hidden="true" />
                        {label}
                        {mounted && count > 0 ? (
                          <span className="ml-auto text-[10px] text-text-3">{count}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}

                  {/* Le panier s'ouvre via le tiroir ; la page /cart donne le
                      récapitulatif complet et reste utile sur mobile. */}
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openCart();
                      }}
                      className="flex w-full items-center gap-3 py-1 text-sm text-text-2 transition-colors hover:text-gold-dark dark:hover:text-gold"
                    >
                      <ShoppingBag size={15} aria-hidden="true" />
                      Panier
                      {mounted && totalItems > 0 ? (
                        <span className="ml-auto text-[10px] text-text-3">
                          {totalItems}
                        </span>
                      ) : null}
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/cart"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-1 text-sm text-text-2 transition-colors hover:text-gold-dark dark:hover:text-gold"
                    >
                      <ShoppingBag size={15} aria-hidden="true" />
                      Voir le panier
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </>
  );
}