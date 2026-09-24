// src/components/layout/Footer.tsx — Éditorial Luxe, double thème Ivory/Obsidian
"use client";

import Link from "next/link";

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
    <footer className="bg-surface-2 border-t border-line text-text pt-14 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-line">
          {/* Brand */}
          <div>
            <p className="font-serif text-2xl text-text mb-3">
              Afro<span className="text-gold-dark dark:text-gold italic font-normal">Style</span>
            </p>
            <p className="text-text-2 text-sm leading-relaxed mb-6 max-w-[240px]">
              La première destination premium pour la mode africaine contemporaine.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-line bg-surface text-text-2 flex items-center justify-center text-xs transition-all duration-200 hover:border-gold hover:text-gold-dark dark:hover:text-gold hover:-translate-y-0.5"
                >
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Boutique" links={SHOP_LINKS} />
          <FooterCol title="Maison" links={MAISON_LINKS} />
          <FooterCol title="Aide" links={HELP_LINKS} />
        </div>

        {/* Bottom */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
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
    <div>
      <p className="text-gold-dark dark:text-gold text-[0.7rem] tracking-[0.2em] uppercase mb-5">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-text-2 text-sm transition-colors duration-200 hover:text-gold-dark dark:hover:text-gold"
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