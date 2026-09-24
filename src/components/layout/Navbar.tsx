// src/components/layout/Navbar.tsx — Éditorial Luxe, double thème Ivory/Obsidian
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, formatStoreAmount } from "@/constants/store";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Le panier vient de Zustand persisté dans localStorage : le rendu SSR
  // donne toujours 0. On n'affiche le badge qu'après montage côté client
  // pour éviter le mismatch d'hydratation.
  const mounted = useMounted();
  const { totalItems, openCart } = useCart();

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

  return (
    <>
      {/* Bannière d'annonce — Or champagne */}
      <div className="bg-gold text-white text-center text-xs tracking-widest uppercase py-2 px-4 font-medium">
        <span className="opacity-70 mr-3">✦</span>
        Livraison internationale gratuite dès {formatStoreAmount(FREE_SHIPPING_THRESHOLD)}
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
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border border-line bg-surface text-text-2 transition-all duration-200 hover:border-gold hover:text-gold-dark dark:hover:text-gold"
            >
              <Search size={15} />
            </button>

            <Link
              href="/account"
              aria-label="Mon compte"
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border border-line bg-surface text-text-2 transition-all duration-200 hover:border-gold hover:text-gold-dark dark:hover:text-gold"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            <button
              onClick={openCart}
              aria-label="Panier"
              className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase px-4 py-2 bg-text text-bg hover:bg-gold hover:text-white transition-colors duration-200 rounded-sm"
            >
              <ShoppingBag size={14} />
              <span className="hidden sm:inline">Panier</span>
              {mounted && totalItems > 0 && (
                <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold bg-gold text-white">
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
            </ul>
          </div>
        )}
      </nav>
    </>
  );
}