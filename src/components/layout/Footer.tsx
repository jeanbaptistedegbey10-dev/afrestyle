// src/components/layout/Footer.tsx — Éditorial Luxe, double thème Ivory/Obsidian
"use client";

import Link from "next/link";
import { SHIPPING_AND_RETURNS_RULE } from "@/constants/store";

type FooterLink = { label: string; href: string };

// Clé canonique des filtres : `gender` (alignée accueil / footer / /shop).
const SHOP_LINKS: FooterLink[] = [
  { label: "Femme", href: "/collections?gender=femme" },
  { label: "Homme", href: "/collections?gender=homme" },
  { label: "Accessoires", href: "/collections?gender=accessoire" },
  { label: "Toute la collection", href: "/collections" },
];

const MAISON_LINKS: FooterLink[] = [
  { label: "Notre histoire", href: "/about" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "La collection", href: "/collections" },
];

const HELP_LINKS: FooterLink[] = [
  { label: "Livraison", href: "/shipping" },
  { label: "Retours & Échanges", href: "/returns" },
  { label: "Foire aux questions", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

// URLs complètes et valides (audit P1) — à ajuster dès que les comptes
// officiels changent de handle.
const SOCIALS: FooterLink[] = [
  { label: "Instagram", href: "https://instagram.com/afrestyle" },
  { label: "TikTok", href: "https://www.tiktok.com/@afrestyle" },
  { label: "Pinterest", href: "https://www.pinterest.com/afrestyle" },
];

export default function Footer() {
  // Année dynamique (2026 et suivantes) — calculée à chaque rendu.
  // `suppressHydrationWarning` couvre le basculement d'année pendant une session.
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-2 border-t border-line text-text pt-10 pb-5 sm:pt-14 sm:pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 pb-8 border-b border-line lg:grid-cols-4 lg:gap-10">
          {/* Brand — pleine largeur sur mobile, une colonne sur desktop */}
          <div className="col-span-2 lg:col-span-1">
            <p className="font-serif text-2xl text-text mb-2.5">
              Afro<span className="text-gold-dark dark:text-gold italic font-normal">Style</span>
            </p>
            <p className="text-text-2 text-sm leading-relaxed mb-4 max-w-[240px]">
              La première destination premium pour la mode africaine contemporaine.
            </p>
            <div className="flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-11 h-11 rounded-full border border-line bg-surface text-text-2 flex items-center justify-center text-xs font-medium transition-all duration-200 hover:border-gold hover:text-gold-dark dark:hover:text-gold hover:-translate-y-0.5"
                >
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Sur mobile : les 11 liens passent en deux colonnes compactes.
              Sur desktop : les trois familles occupent les trois dernières colonnes. */}
          <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:col-span-3 lg:gap-x-8">
            <FooterCol title="Boutique" links={SHOP_LINKS} />
            <FooterCol title="Maison" links={MAISON_LINKS} />
            <FooterCol title="Aide" links={HELP_LINKS} />
          </div>
        </div>

        {/* Conditions commerciales — formulation UNIQUE (src/constants/store.ts),
            identique à l'accueil, aux fiches produit et à la FAQ. */}
        <p className="pt-6 text-center text-[11px] uppercase tracking-[0.2em] text-text-3">
          {SHIPPING_AND_RETURNS_RULE}
        </p>

        {/* Bottom */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <p className="text-text-3 text-xs" suppressHydrationWarning>
            © {year} AfroStyle. Tous droits réservés.
          </p>
          <div className="flex gap-2">
            <PayBadge label="Visa" />
            <PayBadge label="Mastercard" />
            <PayBadge label="PayPal" />
            <PayBadge label="Shop Pay" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="min-w-0">
      <p className="text-gold-dark dark:text-gold text-[0.7rem] tracking-[0.2em] uppercase mb-2 sm:mb-5">
        {title}
      </p>
      <ul className="space-y-0.5 sm:space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center text-text-2 text-sm leading-snug transition-colors duration-200 hover:text-gold-dark dark:hover:text-gold"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PayBadge({ label }: { label: string }) {
  return (
    <span className="text-[0.65rem] px-2.5 py-1 border border-line bg-surface text-text-3 rounded-sm">
      {label}
    </span>
  );
}