// src/components/sections/EditorialSection.tsx
// ───────────────────────────────────────────────────────────────────────────────
//  SECTION ÉDITORIALE DYNAMIQUE — pilotée par un Metaobject `home_section`.
// ───────────────────────────────────────────────────────────────────────────────
//  Rend UNE entrée `home_section` reçue depuis `getHomeSections()` : aucune donnée
//  n'est codée en dur, le composant ne fait que du layout.
//
//  DISPOSITIONS (`layout`, piloté depuis Shopify Admin) :
//    • `image_left`  → visuel à gauche, texte à droite (≥ lg)
//    • `image_right` → texte à gauche, visuel à droite (≥ lg)
//    • `full_banner` → visuel pleine largeur, texte en surimpression
//
//  `tone` pilote l'alternance de fonds pour ne jamais produire deux sections
//  identiques dos à dos (design system AfroStyle).
//  `withShopifyCdnWidth` est appliqué ici, et non dans la couche de données,
//  car la largeur utile dépend du layout.
//  Composant SERVEUR : aucune directive "use client" (aucune interactivité).
// ───────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { withShopifyCdnWidth } from "@/lib/assets/images";
import SafeImage from "@/components/ui/SafeImage";
import type { HomeSection } from "@/lib/shopify/sections";

/** Largeurs demandées au CDN Shopify selon la disposition. */
const SPLIT_IMAGE_WIDTH = 1200;
const BANNER_IMAGE_WIDTH = 1920;

type EditorialSectionProps = {
  section: HomeSection;
  /** Rupture de fond alternée : `light` (ivoire) ou `dark` (bande bleu nuit). */
  tone?: "light" | "dark";
};

/**
 * Ordre visuel de la grille. Sur mobile l'image passe TOUJOURS en premier (le
 * contenu visuel porte la lecture) ; l'inversion n'intervient qu'à partir de `lg`.
 */
function splitLayout(
  layout: HomeSection["layout"],
): { grid: string; image: string; text: string } {
  const imageFirst = layout !== "image_right";
  return {
    grid: "grid items-center gap-8 lg:grid-cols-2 lg:gap-14",
    image: imageFirst ? "" : "lg:order-2",
    text: imageFirst ? "lg:order-2" : "lg:order-1",
  };
}

/** Un CTA publié dans Shopify peut viser une page interne OU un site externe. */
function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export default function EditorialSection({
  section,
  tone = "light",
}: EditorialSectionProps) {
  const { handle, title, eyebrow, subtitle, body, image, imageAlt, buttonText, buttonLink, layout } =
    section;

  const isBanner = layout === "full_banner";
  const dark = tone === "dark";
  const headingId = `section-${handle}-title`;

  // La bannière est toujours sombre (texte en surimpression) ; sinon on alterne
  // surfaces ivoire / bande bleu nuit.
  const sectionClassName = isBanner
    ? "relative isolate overflow-hidden"
    : dark
      ? "bg-band text-band-text"
      : "bg-surface-2 text-text";

  const eyebrowTone =
    isBanner || dark ? "text-band-gold" : "text-gold-dark dark:text-gold";
  const headingTone = isBanner ? "text-white" : dark ? "text-band-text" : "text-text";
  const subtitleTone = isBanner
    ? "text-white/90"
    : dark
      ? "text-band-gold"
      : "text-gold-dark dark:text-gold";
  const bodyTone = isBanner
    ? "text-white/85"
    : dark
      ? "text-band-text-2"
      : "text-text-2";
  const ctaTone =
    isBanner || dark
      ? "btn-primary bg-band-gold text-band hover:bg-band-gold-hover"
      : "btn-primary";

  const { grid, image: imageOrder, text: textOrder } = splitLayout(layout);

  // Un CTA n'est rendu que si un libellé ET une cible existent : un bouton mort
  // est pire que pas de bouton du tout.
  const cta =
    buttonText && buttonLink ? (
      isExternalHref(buttonLink) ? (
        <a
          href={buttonLink}
          className={`${ctaTone} min-h-11`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {buttonText}
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      ) : (
        <Link href={buttonLink} className={`${ctaTone} min-h-11`}>
          {buttonText}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )
    ) : null;
  // Bloc éditorial commun aux trois dispositions — seul le conteneur change.
  const copy = (
    <div className={isBanner ? "" : textOrder}>
      {eyebrow ? (
        <p
          className={`mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.25em] ${eyebrowTone}`}
        >
          {eyebrow}
          <span
            className={`inline-block h-px w-12 ${isBanner || dark ? "bg-band-gold/60" : "bg-gold/40"}`}
            aria-hidden="true"
          />
        </p>
      ) : null}

      <h2
        id={headingId}
        className={`font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl ${headingTone}`}
      >
        {title}
      </h2>

      {subtitle ? (
        <p className={`mt-4 font-serif text-lg italic leading-snug ${subtitleTone}`}>
          {subtitle}
        </p>
      ) : null}

      {body ? (
        <p className={`mt-5 max-w-xl text-sm leading-relaxed sm:text-base ${bodyTone}`}>
          {body}
        </p>
      ) : null}

      {cta ? <div className="mt-8">{cta}</div> : null}
    </div>
  );

  return (
    <section
      id={`section-${handle}`}
      aria-labelledby={headingId}
      className={`${sectionClassName} py-16 lg:py-24`}
    >
      {isBanner ? (
        // ── Plein cadre : visuel plein écran, contenu aligné à gauche ─────────
        <div className="relative isolate min-h-[440px] lg:min-h-[560px]">
          <SafeImage
            src={image ? withShopifyCdnWidth(image, BANNER_IMAGE_WIDTH) : null}
            alt={imageAlt}
            placeholderRatio="banner"
            placeholderLabel="Collection AfroStyle"
            fill
            priority={false}
            sizes="100vw"
            className="object-cover"
          />
          {/* Voile dégradé : garantit le contraste du texte (WCAG AAA) quelle que
              soit la luminance du visuel publié dans Shopify. */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25"
            aria-hidden="true"
          />
          <div className="container relative mx-auto flex min-h-[440px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:min-h-[560px] lg:px-8">
            <div className="max-w-2xl">{copy}</div>
          </div>
        </div>
      ) : (
        // ── Section scindée : visuel + colonne éditoriale ─────────────────────
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={grid}>
            <div
              className={`${imageOrder} relative overflow-hidden rounded-xl border ${
                dark ? "border-band-gold/25" : "border-line"
              } bg-surface shadow-[0_14px_36px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.45)]`}
            >
              {/* Ratio explicite : un visuel `fill` est en position absolue ;
                  sans ratio la rangée s'effondre en fin rectangle horizontal. */}
              <div className="relative aspect-[4/3] lg:aspect-[5/4]">
                <SafeImage
                  src={image ? withShopifyCdnWidth(image, SPLIT_IMAGE_WIDTH) : null}
                  alt={imageAlt}
                  placeholderRatio="landscape"
                  placeholderLabel="Editorial AfroStyle"
                  fill
                  priority={false}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>
            </div>

            {copy}
          </div>
        </div>
      )}
    </section>
  );
}