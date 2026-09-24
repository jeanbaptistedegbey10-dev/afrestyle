// src/components/home/HeroSection.tsx — Éditorial Luxe, double thème Ivory/Obsidian
"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { IMAGES } from "@/constants/images";
import SafeImage from "@/components/ui/SafeImage";

// Engagements de marque — volontairement NON chiffrés : aucune promesse de
// volume invérifiable ne doit apparaître tant que le catalogue ne la justifie
// pas (ex. « 87 créateurs », « 2 400 pièces »). Ces affirmations restent vraies
// quel que soit l'état du catalogue.
const ENGAGEMENTS = [
  { num: "100 %", label: "Confection africaine" },
  { num: "Fait main", label: "Savoir-faire d'héritage" },
  { num: "Direct", label: "Du créateur à vous" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-bg-2 py-16 sm:py-20 lg:py-24">
      {/* Fond — dégradé thématique subtil (ivoire → sable clair / obsidienne → anthracite) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, var(--bg) 0%, var(--bg-2) 45%, var(--surface-2) 100%)",
        }}
      />

      {/* Halo doré — profondeur */}
      <div
        className="absolute -top-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--gold-soft) 0%, transparent 65%)",
        }}
      />

      {/* Motif grille subtil */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.05,
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 30px, var(--gold) 30px, var(--gold) 31px),
            repeating-linear-gradient(90deg, transparent, transparent 30px, var(--gold) 30px, var(--gold) 31px)
          `,
        }}
      />

      {/* Conteneur standardisé — grille éditoriale 2 colonnes */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Colonne texte */}
          <div className="lg:col-span-5 space-y-6 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase px-4 py-2 rounded-sm bg-gold-soft text-gold-dark dark:text-gold border border-gold/40">
              <span className="w-5 h-px bg-gold inline-block" />
              Nouvelle collection 2026
            </div>

            {/* Titre — Serif géant */}
            <h1
              className="font-serif leading-[0.95] text-text"
              style={{ fontSize: "clamp(2.75rem, 5vw, 4.5rem)" }}
            >
              L&apos;Afrique
              <br />
              réinvente
              <br />
              <em className="text-gold-dark dark:text-gold">le luxe</em>
            </h1>

            <p className="text-text-2 text-base md:text-lg leading-relaxed max-w-[440px]">
              Des créateurs d&apos;exception. Des tissus d&apos;héritage. Une mode
              contemporaine qui honore ses racines.
            </p>

            {/* CTA — micro-interactions */}
            <div className="flex items-center gap-4 flex-wrap pt-2">
              <Link
                href="/collections"
                className="group btn-primary hover:shadow-[0_8px_24px_var(--gold-soft)] hover:-translate-y-0.5"
              >
                Explorer la collection
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/lookbook"
                className="btn-outline hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
              >
                Voir le lookbook
              </Link>
            </div>

            {/* Engagements — marqueurs qualitatifs, non chiffrés */}
            <div className="flex flex-wrap gap-8 pt-6 border-t border-line">
              {ENGAGEMENTS.map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-3xl font-bold text-gold-dark dark:text-gold">
                    {s.num}
                  </div>
                  <div className="text-text-2 text-xs tracking-widest uppercase mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne visuelle — média hero */}
          <div className="lg:col-span-7">
            <div className="relative w-full aspect-[4/5] lg:aspect-square rounded-2xl overflow-hidden border border-line shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              {/* Visuel — photo créateur vedette (Unsplash HD, fallback local) */}
              <SafeImage
                src={IMAGES.hero}
                alt="Mannequin portant une haute tenue africaine élégante — femme en ensemble Pagne/Wax"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />

              {/* Voile dégradé — profondeur dorée + lisibilité de la carte flottante */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

              {/* Carte flottante — info collection */}
              <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 rounded-xl border border-line bg-nav backdrop-blur-md px-5 py-4 flex items-center justify-between shadow-sm">
                <div className="min-w-0">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-text-3">
                    En vedette
                  </p>
                  <p className="mt-0.5 truncate font-serif text-base text-text">
                    Collection Kente{" "}
                    <em className="text-gold-dark dark:text-gold">2026</em>
                  </p>
                </div>
                <Link
                  href="/lookbook"
                  aria-label="Voir le lookbook"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-text text-bg transition-all duration-300 hover:bg-gold hover:text-gold-contrast"
                >
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
