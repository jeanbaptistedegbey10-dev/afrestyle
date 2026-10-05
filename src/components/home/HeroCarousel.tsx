// src/components/home/HeroCarousel.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Diaporama du Hero — client, piloté par Embla Carousel.
//  Les données (HeroSlide[]) viennent de `lib/shopify/hero.ts` (Metaobjects
//  Shopify) : ce composant ne contient AUCUNE chaîne éditoriale.
// ────────────────────────────────────────────────────────────────────────────
//
//  Embla plutôt que Swiper : ~7 ko gzippé, sans dépendance DOM, et surtout
//  sans CSS obligatoire — le style reste piloté par les tokens du design
//  system (`.clinerules`), ce qui garantit la cohérence clair/sombre.
//
//  Accessibilité (WCAG 2.2) :
//   • pause automatique au survol ET au focus clavier (2.2.2) ;
//   • `prefers-reduced-motion` → aucun défilement automatique (2.3.3) ;
//   • zone `aria-roledescription="carrousel"` + puces et flèches étiquetés ;
//   • un seul `<h1>` (première slide), les suivantes passent en `<h2>`.
//
//  Performance : un seul `priority` (slide 0 = LCP), les suivantes en `lazy`.
// ────────────────────────────────────────────────────────────────────────────
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/lib/shopify/hero";

/** Cadence du diaporama (ms) — lente et feutrée, jamais un rythme « promotion ». */
const SLIDE_INTERVAL_MS = 6000;

/** Durée de la transition Embla (en unités Embla : plus haut = plus lent). */
const SLIDE_DURATION = 32;

/** Engagements de marque — non chiffrés (cf. .clinerules : aucune promesse invérifiable). */
const ENGAGEMENTS = [
  { num: "100 %", label: "Confection africaine" },
  { num: "Fait main", label: "Savoir-faire d'héritage" },
  { num: "Direct", label: "Du créateur à vous" },
];

type HeroCarouselProps = {
  slides: HeroSlide[];
};

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const count = slides.length;
  // Une seule slide = pas de boucle ni d'autoplay (sinon Embla tourne dans le vide).
  const isCarousel = count > 1;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: SLIDE_INTERVAL_MS,
        stopOnInteraction: false, // un clic sur une flèche ne fige pas le carrousel
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    [],
  );
  const plugins = useMemo(() => (isCarousel ? [autoplay] : []), [autoplay, isCarousel]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: isCarousel, align: "start", duration: SLIDE_DURATION },
    plugins,
  );

  // Index courant — alimenté par Embla (aucun `setState` dans un effet de rendu).
  useEffect(() => {
    if (!emblaApi) return;
    const sync = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    sync();
    emblaApi.on("select", sync).on("reInit", sync);
    return () => {
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi]);

  // `prefers-reduced-motion` : on coupe l'autoplay, la navigation manuelle reste.
  useEffect(() => {
    if (!emblaApi || !isCarousel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      autoplay.stop();
    }
  }, [emblaApi, autoplay, isCarousel]);

  // Le contenu vient du serveur : à chaque publication Shopify le nombre de
  // slides peut changer, Embla doit recalculer ses snaps.
  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, count]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  if (count === 0) return null;

  return (
    <section
      className="relative isolate flex min-h-[620px] overflow-hidden bg-band text-band-text sm:min-h-[680px] lg:min-h-[720px]"
      aria-roledescription="carrousel"
      aria-label="Diaporama éditorial AfroStyle"
    >
      {/* Viewport Embla : `overflow-hidden` recadre le débordement des slides. */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => {
            // Un seul <h1> sur la page : les slides suivantes passent en <h2>
            // (même style, hiérarchie sémantique correcte pour le SEO).
            const Heading = index === 0 ? "h1" : "h2";

            return (
              <div
                key={slide.id}
                className="relative min-w-0 flex-[0_0_100%]"
                role="group"
                aria-roledescription="diapositive"
                aria-label={`${index + 1} sur ${count}`}
              >
                <div className="relative min-h-[620px] w-full sm:min-h-[680px] lg:min-h-[720px]">
                  <SafeImage
                    src={slide.image}
                    alt={slide.imageAlt}
                    fill
                    priority={index === 0}
                    loading={index === 0 ? undefined : "lazy"}
                    sizes="100vw"
                    className="object-cover object-center"
                    fallbackAlt={slide.imageAlt}
                  />

                  {/* Voiles de lisibilité — asymétriques : le visuel reste visible,
                      le texte conserve un contraste AAA sur les deux thèmes. */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#101B2A] via-[#101B2A]/40 to-black/20"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-0 hidden bg-gradient-to-r from-[#101B2A]/70 via-[#101B2A]/10 to-transparent lg:block"
                    aria-hidden="true"
                  />

                  <div className="relative z-10 mx-auto flex h-full min-h-[inherit] w-full max-w-7xl flex-col justify-end px-4 pb-8 pt-16 sm:px-6 sm:pb-10 sm:pt-20 lg:justify-center lg:px-8 lg:py-24">
                    <div className="max-w-xl space-y-4 sm:space-y-5">
                      {slide.eyebrow ? (
                        <p className="w-fit border border-band-gold/50 bg-band/60 px-4 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-band-gold backdrop-blur-sm sm:py-2 sm:text-[0.65rem]">
                          {slide.eyebrow}
                        </p>
                      ) : null}

                      <Heading
                        className="font-serif leading-[0.95] text-band-text"
                        style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
                      >
                        {slide.title}
                        {slide.titleHighlight ? (
                          <>
                            {" "}
                            <em className="font-normal text-band-gold-hover">
                              {slide.titleHighlight}
                            </em>
                          </>
                        ) : null}
                      </Heading>

                      {slide.subtitle ? (
                        <p className="max-w-lg text-sm leading-snug text-band-text-2 sm:text-base sm:leading-relaxed">
                          {slide.subtitle}
                        </p>
                      ) : null}

                      {slide.href && slide.buttonText ? (
                        <div className="flex flex-col gap-2.5 pt-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                          <Link
                            href={slide.href}
                            className="btn-primary min-h-12 w-full justify-center bg-gold text-gold-contrast hover:bg-band-gold-hover sm:w-auto"
                          >
                            {slide.buttonText}
                            <ArrowRight size={15} aria-hidden="true" />
                          </Link>
                          {slide.secondaryHref && slide.secondaryText ? (
                            <Link
                              href={slide.secondaryHref}
                              className="inline-flex min-h-12 w-full items-center justify-center border border-band-gold/70 px-6 text-xs font-medium uppercase tracking-[0.14em] text-band-text transition-colors duration-300 hover:bg-band-text hover:text-band sm:w-auto"
                            >
                              {slide.secondaryText}
                            </Link>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Engagements — marqueurs qualitatifs, jamais chiffrés. */}
                      <div className="grid grid-cols-3 gap-2 border-t border-band-gold/20 pt-4 text-center sm:gap-4 sm:pt-5 lg:flex lg:flex-wrap lg:gap-x-10 lg:pt-6 lg:text-left">
                        {ENGAGEMENTS.map((item) => (
                          <div key={item.label} className="min-w-0">
                            <div className="font-serif text-xl font-bold leading-none text-band-gold-hover sm:text-2xl lg:text-3xl">
                              {item.num}
                            </div>
                            <div className="mt-1 text-[0.6rem] uppercase leading-snug tracking-[0.1em] text-band-text-2 sm:text-[0.65rem] sm:tracking-[0.14em] lg:mt-1.5 lg:text-xs lg:tracking-widest">
                              {item.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Halo champagne + motif grille — fixes, au-dessus des slides. */}
      <div
        className="pointer-events-none absolute -top-1/4 -right-1/4 h-[60vw] w-[60vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--band-gold-soft) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.05,
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 30px, var(--band-gold) 30px, var(--band-gold) 31px),
            repeating-linear-gradient(90deg, transparent, transparent 30px, var(--band-gold) 30px, var(--band-gold) 31px)
          `,
        }}
        aria-hidden="true"
      />

      {/* Navigation — flèches (≥ 44 px) + puces or champagne. */}
      {isCarousel ? (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Diapositive précédente"
            className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-band-gold/40 bg-band/50 text-band-text backdrop-blur-sm transition-colors duration-300 hover:bg-band-text hover:text-band md:flex"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Diapositive suivante"
            className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-band-gold/40 bg-band/50 text-band-text backdrop-blur-sm transition-colors duration-300 hover:bg-band-text hover:text-band md:flex"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>

          <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 lg:bottom-4">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={`Afficher la diapositive ${index + 1} sur ${count}`}
                aria-current={index === selectedIndex}
                className="flex h-11 w-9 items-center justify-center"
              >
                <span
                  className={cn(
                    "block h-2 rounded-full transition-all duration-500",
                    index === selectedIndex
                      ? "w-6 bg-champagne"
                      : "w-2 bg-champagne/40 hover:bg-champagne/70",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}