// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Heart, Search, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

// Plus d'import UserIcon ici !

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems, openCart } = useCart();

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
  { href: "/designers/apply", label: "Devenir créateur" },
];

  return (
    <>
      <div className="bg-gold text-ink text-center text-xs tracking-widest uppercase py-2 px-4 font-medium">
        <span className="opacity-60 mr-3">✦</span>
        Livraison internationale gratuite dès 150€
        <span className="opacity-60 ml-3">✦</span>
      </div>

      <nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          isScrolled ? "bg-ink/95 backdrop-blur-md border-b border-gold/20 py-3" : "bg-ink py-4"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          <Link href="/" className="font-serif text-2xl font-bold" style={{ color: "#D4AF37" }}>
            Afro<span style={{ color: "#F5F0E8", fontStyle: "italic", fontWeight: 400 }}>Style</span>
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs tracking-widest uppercase font-medium transition-colors duration-200"
                  style={{ color: "#D4CCBA" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <button
              aria-label="Rechercher"
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border transition-all duration-200"
              style={{ borderColor: "rgba(212,175,55,0.25)", color: "#D4CCBA" }}
            >
              <Search size={15} />
            </button>

            <Link
              href="/wishlist"
              aria-label="Ma wishlist"
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border transition-all duration-200"
              style={{ borderColor: "rgba(212,175,55,0.25)", color: "#D4CCBA" }}
            >
              <Heart size={15} />
            </Link>

            {/* Lien account simple — pas de Server Component ici */}
            <Link
              href="/account"
              aria-label="Mon compte"
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border transition-all duration-200"
              style={{ borderColor: "rgba(212,175,55,0.25)", color: "#D4CCBA" }}
            >
              {/* Icône SVG inline — évite l'import de lucide dans ce contexte */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>

            <button
              onClick={openCart}
              aria-label="Panier"
              className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase px-4 py-2 transition-colors duration-200"
              style={{ background: "#D4AF37", color: "#0F172A", borderRadius: "2px" }}
            >
              <ShoppingBag size={14} />
              <span className="hidden sm:inline">Panier</span>
              {totalItems > 0 && (
                <span
                  className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  style={{ background: "#0F172A", color: "#D4AF37" }}
                >
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              className="md:hidden"
              style={{ color: "#F5F0E8" }}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            className="md:hidden border-t animate-fade-in"
            style={{ background: "#1E293B", borderColor: "rgba(212,175,55,0.1)" }}
          >
            <ul className="flex flex-col px-6 py-4 gap-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm tracking-widest uppercase block py-2 border-b transition-colors"
                    style={{ color: "#F5F0E8", borderColor: "rgba(212,175,55,0.1)" }}
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