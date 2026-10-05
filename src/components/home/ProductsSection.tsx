// src/components/home/ProductsSection.tsx — Grilles produits éditoriales, double thème
// ───────────────────────────────────────────────────────────────────────────────
//  Grille produits RÉUTILISÉE deux fois sur l'accueil, via `variant` :
//
//    1. `featured` → « Pièces phares »          (fond crème éditoriale + pills)
//    2. `season`   → « Sélection de la Saison » (bande bleu nuit, rupture)
//
//  RYTHME DE GRILLE : `lg:grid-cols-4` → 8 pièces = EXACTEMENT 2 lignes de
//  4 colonnes. Le nombre de pièces est arbitré par `src/app/page.tsx`
//  (`FEATURED_PRODUCT_LIMIT` / `SEASON_PRODUCT_LIMIT`), jamais ici.
//
//  RUPTURE VISUELLE : chaque variante porte sa propre surface (crème ↔ bleu
//  nuit) pour ne jamais produire deux sections identiques dos à dos sur la
//  home (design system AfroStyle, cf. `.clinerules`).
//
//  COPY : les chaînes éditoriales vivent dans `VARIANTS` ci-dessous ; la page
//  d'accueil ne fait que choisir la variante et passer les produits.
//
//  VISUELS : `productVisuals` contient des visuels RÉELS du catalogue Shopify
//  (jamais des images codées en dur). `visualsOffset` décale l'indexation afin
//  que la 2ᵉ grille n'affiche pas les mêmes replis que la 1ʳᵉ.
//
//  Le composant reste client : les pills de catégories (variante `featured`)
//  naviguent côté client. La variante `season` n'a aucune interaction.
// ───────────────────────────────────────────────────────────────────────────────
"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/assets/images";
import type { Product } from "@/lib/shopify/types";

// Clés d'URL unifiées : `gender` partout (accueil → footer → /shop → /collections).
const CATEGORIES = [
  { label: "Tout voir",     url: "/collections" },
  { label: "Femme",        url: "/collections?gender=femme" },
  { label: "Homme",        url: "/collections?gender=homme" },
  { label: "Accessoires",  url: "/collections?gender=accessoire" },
  { label: "Wax",          url: "/collections?tissu=wax" },
  { label: "Kente",        url: "/collections?tissu=kente" },
  { label: "Bogolan",      url: "/collections?tissu=bogolan" },
  { label: "Streetwear",   url: "/collections?style=streetwear" },
  { label: "Traditionnel", url: "/collections?style=traditionnel" },
];

/** Surfaces et teintes — une entrée par rupture de fond du flux éditorial. */
const TONES = {
  // Crème éditoriale : alterne avec les bandes bleu nuit voisines.
  cream: {
    section: "border-y border-separator-gold bg-section-cream",
    eyebrow: "text-gold-dark dark:text-gold",
    rule: "bg-separator-gold",
    // `dark:` explicites : le titre/sous-titre basculent TOUJOURS en clair
    // en mode sombre, sans dépendre d'une résolution indirecte du token.
    title: "text-slate-900 dark:text-white",
    highlight: "text-gold-dark dark:text-gold",
    subtitle: "text-slate-600 dark:text-slate-300",
    seeAll:
      "text-slate-600 dark:text-slate-300 hover:text-gold-dark dark:hover:text-gold",
    empty: "border-separator-gold bg-section-cream-2",
    // Bouton contour : un aplat plein sur fond crème casserait le rythme.
    cta: "btn-outline",
    // Surface de la carte : suit le thème (les variantes `dark:` de
    // <ProductCard /> suffisent).
    cardTone: "light" as const,
  },
  // Bande bleu nuit : rupture franche imposée par le design system. Les cartes
  // conservent leur surface claire (`bg-surface`) : le relief reste maximal.
  band: {
    section: "border-y border-band-gold/25 bg-band",
    eyebrow: "text-band-gold",
    rule: "bg-band-gold/40",
    title: "text-band-text",
    highlight: "text-band-gold-hover",
    subtitle: "text-band-text-2",
    seeAll: "text-band-text-2 hover:text-band-gold",
    empty: "border-band-gold/30 bg-band-2",
    // `btn-outline` utilise `var(--text)` : illisible sur la bande bleu nuit.
    cta: "btn-primary bg-band-gold text-band hover:bg-band-gold-hover",
    // ⚠️ `--band` est INVARIANT (déclaré sous `:root, .dark`) : `tone="dark"`
    // force chez <ProductCard /> une palette claire dans les DEUX modes —
    // sinon le texte serait navy sur navy en mode clair.
    cardTone: "dark" as const,
  },
} as const;

export type ProductsSectionTone = keyof typeof TONES;

type VariantConfig = {
  /** Sur-titre au-dessus du titre, précédé d'un filet champagne. */
  eyebrow: string;
  /** Partie « normale » du titre. */
  title: string;
  /** Partie mise en italique champagne (rendue dans <em>). */
  titleHighlight: string;
  /** Sous-titre éditorial (`null` = pas de sous-titre). */
  subtitle: string | null;
  tone: ProductsSectionTone;
  /** Les pills de filtres ne servent qu'à la grille principale. */
  showCategoryPills: boolean;
  /** Libellé du lien « … → » en haut à droite. */
  seeAllLabel: string;
  seeAllHref: string;
  /** CTA de pied de section. */
  ctaLabel: string;
  emptyTitle: string;
  emptyText: string;
};

/** Les deux grilles de l'accueil et leur contenu éditorial. */
const VARIANTS: Record<"featured" | "season", VariantConfig> = {
  featured: {
    eyebrow: "Sélection du moment",
    title: "Pièces",
    titleHighlight: "phares",
    subtitle: null,
    tone: "cream",
    showCategoryPills: true,
    seeAllLabel: "Voir tout →",
    seeAllHref: "/collections",
    ctaLabel: "Voir toute la collection →",
    emptyTitle: "Aucune pièce pour le moment",
    emptyText:
      "La sélection se révélera dès que nos créateurs publieront leurs nouveautés — revenez très bientôt.",
  },
  season: {
    eyebrow: "Le choix de la maison",
    title: "Sélection de la",
    titleHighlight: "Saison",
    subtitle: "Des créations uniques choisies pour vous",
    tone: "band",
    showCategoryPills: false,
    seeAllLabel: "Tout le catalogue →",
    seeAllHref: "/shop",
    ctaLabel: "Découvrir toutes les pièces →",
    emptyTitle: "La sélection se prépare",
    emptyText:
      "Nos stylistes composent cette sélection de saison — revenez très bientôt.",
  },
};

export type ProductsSectionVariant = keyof typeof VARIANTS;

type ProductsSectionProps = {
  products: Product[];
  productVisuals?: string[];
  /** Grille éditoriale à rendre (contenu + surface de fond). */
  variant?: ProductsSectionVariant;
  /** Décalage d'indexation des visuels de repli (2ᵉ grille de la home). */
  visualsOffset?: number;
};

export default function ProductsSection({
  products,
  productVisuals,
  variant = "featured",
  visualsOffset = 0,
}: ProductsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const visuals = productVisuals ?? [];

  const config = VARIANTS[variant];
  const tone = TONES[config.tone];

  // `useId` : les deux grilles coexistent sur la même page, leurs identifiants
  // doivent donc rester uniques (accessibilité `aria-labelledby`).
  const uid = useId();
  const headingId = `products-${variant}-${uid}`;
  const sectionId = `section-${variant}-${uid}`;

  function handleCategoryClick(index: number, url: string) {
    setActiveIndex(index);
    router.push(url);
  }

  /** Visuel de repli d'une carte : rotation dans le flux, jamais `undefined`. */
  function fallbackFor(index: number): string {
    if (visuals.length === 0) return FALLBACK_PRODUCT_IMAGE;
    // `||` : ignore aussi les chaînes vides du flux de visuels.
    return visuals[(index + visualsOffset) % visuals.length] || FALLBACK_PRODUCT_IMAGE;
  }

  return (
    // Surface de rupture : crème éditoriale (#FAF8F5) pour « Pièces phares »,
    // bleu nuit (#101B2A) pour « Sélection de la Saison » — filets champagne
    // discrets dans les deux cas, qui cadencent l'alternance du flux.
    <section
      id={sectionId}
      aria-labelledby={headingId}
      className={`${tone.section} py-20 lg:py-24`}
    >
      {/* Conteneur standardisé */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p
              className={`${tone.eyebrow} text-xs tracking-widest uppercase mb-3 flex items-center gap-3`}
            >
              {config.eyebrow}
              <span className={`h-px w-16 inline-block ${tone.rule}`} aria-hidden="true" />
            </p>
            <h2
              id={headingId}
              className={`font-serif text-3xl sm:text-4xl ${tone.title}`}
            >
              {config.title}{" "}
              <em className={`font-normal ${tone.highlight}`}>{config.titleHighlight}</em>
            </h2>
            {config.subtitle ? (
              <p
                className={`mt-4 max-w-2xl font-serif text-lg italic leading-snug ${tone.subtitle}`}
              >
                {config.subtitle}
              </p>
            ) : null}
          </div>
          <Link
            href={config.seeAllHref}
            className={`hidden shrink-0 text-xs tracking-widest uppercase transition-colors duration-300 sm:block ${tone.seeAll}`}
          >
            {config.seeAllLabel}
          </Link>
        </div>

        {/* Pills cliquables — grille principale uniquement : la sélection de
            saison est une sélection fermée, lui proposer des filtres fausserait
            le propos éditorial « choix de la maison ». */}
        {config.showCategoryPills ? (
          <div
            className="flex gap-2 overflow-x-auto pb-2 mb-10"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => handleCategoryClick(i, cat.url)}
                className={`flex-shrink-0 text-xs tracking-wider uppercase px-4 py-2 rounded-sm border transition-all duration-200 ${
                  activeIndex === i
                    ? "bg-gold border-gold text-gold-contrast"
                    : "bg-surface border-line text-text-2 hover:border-gold hover:text-gold-dark dark:hover:text-gold"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Grille produits — responsive : 1 / 2 / 4 colonnes, donc 8 pièces = 2 lignes pleines */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  tone={tone.cardTone}
                  fallbackImage={fallbackFor(index)}
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href={config.seeAllHref} className={tone.cta}>
                {config.ctaLabel}
              </Link>
            </div>
          </>
        ) : (
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center ${tone.empty}`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full border text-lg ${
                config.tone === "band"
                  ? "border-band-gold/40 text-band-gold"
                  : "border-gold/40 text-gold-dark dark:text-gold"
              }`}
            >
              ✦
            </span>
            <p className={`font-serif text-xl ${tone.title}`}>{config.emptyTitle}</p>
            <p className={`max-w-sm text-sm ${tone.subtitle}`}>{config.emptyText}</p>
            <Link href={config.seeAllHref} className={`mt-2 ${tone.cta}`}>
              Voir toutes les pièces
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
