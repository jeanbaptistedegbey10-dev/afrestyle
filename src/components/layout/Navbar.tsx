// src/components/layout/Navbar.tsx
"use client"; // Navbar est Client Component car elle a des états (menu mobile, scroll)

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Heart, User, Search, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { getCurrentCustomer } from "@/lib/actions/auth.actions";
import UserIcon from "./UserIcon";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems, openCart } = useCart(); // totalItems est un nombre

  // Détecte le scroll pour changer le style de la navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/collections", label: "Shop" },
    { href: "/designers", label: "Designers" },
    { href: "/lookbook", label: "Lookbook" },
    { href: "/about", label: "Notre Histoire" },
  ];

  return (
    <>
      {/* Barre promotionnelle */}
      <div className="bg-gold text-ink text-center text-xs tracking-widest uppercase py-2 px-4 font-medium">
        <span className="opacity-60 mr-3">✦</span>
        Livraison internationale gratuite dès 150€
        <span className="opacity-60 ml-3">✦</span>
      </div>

      {/* Navbar principale */}
      <nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-ink/95 backdrop-blur-md border-b border-gold/20 py-3"
            : "bg-ink py-4",
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-serif text-2xl font-bold text-gold">
            Afro<span className="text-sand italic font-normal">Style</span>
          </Link>

          {/* Navigation desktop */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sand-3 text-xs tracking-widest uppercase font-medium hover:text-gold transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions (icônes droite) */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              aria-label="Rechercher"
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border border-gold/25 text-sand-3 hover:border-gold hover:text-gold transition-all duration-200"
            >
              <Search size={15} />
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              aria-label="Ma wishlist"
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border border-gold/25 text-sand-3 hover:border-gold hover:text-gold transition-all duration-200"
            >
              <Heart size={15} />
            </Link>

            {/* Account */}
            <UserIcon />

            {/* Panier — Corrigé en utilisant totalItems comme valeur */}
            <button
              onClick={openCart}
              aria-label={`Panier — ${totalItems} articles`}
              className="flex items-center gap-2 bg-gold text-ink text-xs font-medium tracking-wide uppercase px-4 py-2 rounded-sm hover:bg-gold-light transition-colors duration-200"
            >
              <ShoppingBag size={14} />
              <span className="hidden sm:inline">Panier</span>
              {totalItems > 0 && (
                <span className="bg-ink text-gold text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Burger menu mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              className="md:hidden text-sand"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

          {/* Menu mobile */}
          {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gold/10 bg-ink-2 animate-fade-in">
            <ul className="flex flex-col px-6 py-4 gap-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sand text-sm tracking-widest uppercase block py-2 border-b border-gold/10 hover:text-gold transition-colors"
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