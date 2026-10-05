// src/app/page.tsx
// ───────────────────────────────────────────────────────────────────────────────
//  ACCUEIL — assemblage 100 % dynamique piloté par Shopify.
// ───────────────────────────────────────────────────────────────────────────────
//
//  Sources de vérité (aucune chaîne éditoriale n'est écrite dans ce fichier) :
//
//  | Bloc                     | Source Shopify                             |
//  |--------------------------|--------------------------------------------|
//  | Diaporama Hero           | Metaobjects `hero_slide`                   |
//  | Barre de réassurance     | Constantes commerciales (store.ts)         |
//  | Grille des univers       | Metafields `custom.banner_*` des collections|
//  | Sections éditoriales     | Metaobjects `home_section` (triées position)|
//  | Pièces phares            | Produits publiés sur la boutique          |
//  | Sélection de la Saison   | Produits publiés sur la boutique          |
//
//  ⚠️ DEUX grilles de produits (`ProductsSection`, variante `featured` puis
//     variante `season`), JAMAIS la même pièce dans les deux : une SEULE lecture
//     Shopify de 16 produits (`first: FEATURED_PRODUCT_LIMIT +
//     SEASON_PRODUCT_LIMIT`) est découpée en deux blocs disjoints. Les anciens
//     doublons (`StorySection` 3 cartes + `LookbookPreview` 4 tuiles) avaient été
//     supprimés : ici c'est l'ARBITRAGE du marchand qui enrichit le flux, avec
//     deux ruptures de fond distinctes (crème puis bleu nuit).
//
//  Les quatre lectures Shopify sont lancées EN PARALLÈLE (`Promise.all`) : une
//  seule phase réseau. Chaque helper se dégrade SEUL (repli éditorial local),
//  donc l'échec de l'un n'empêche jamais le rendu des autres — pas de page
//  blanche possible.
// ───────────────────────────────────────────────────────────────────────────────
import { getProducts } from "@/lib/shopify/products";
import { getHeroSlides } from "@/lib/shopify/hero";
import { getCategoryBanners } from "@/lib/shopify/collections";
import { getHomeSections, splitHomeSections } from "@/lib/shopify/sections";
import HeroSection from "@/components/home/HeroSection";
import ValuePropositions from "@/components/sections/ValuePropositions";
import CategoriesGrid from "@/components/home/CategoriesGrid";
import EditorialSection from "@/components/sections/EditorialSection";
import ProductsSection from "@/components/home/ProductsSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import { getProductVisuals } from "@/components/home/ProductVisualsProvider";

/**
 * ISR : régénère l'accueil au plus toutes les 5 minutes (aligné sur
 * /collections et /products/[handle]). Sans cette directive, la page était
 * pré-rendue au build avec des réponses Shopify `force-cache` : visuels et prix
 * restaient figés jusqu'au prochain déploiement — une image remplacée dans
 * Shopify Admin n'apparaissait jamais.
 * Invalidation instantanée : webhook `products/*` → /api/revalidate.
 * Hero, univers ET sections éditoriales sont invalidés par `metaobjects/*` et
 * `collections/*` (mêmes tags `hero` / `banners` / `home-sections`).
 */
export const revalidate = 300;

/**
 * Grille « Pièces phares » : 8 pièces.
 * La grille passe à 4 colonnes dès `lg` (`lg:grid-cols-4`) → 8 pièces
 * remplissent EXACTEMENT 2 lignes pleines.
 */
const FEATURED_PRODUCT_LIMIT = 8;

/**
 * Grille « Sélection de la Saison » : 8 pièces, soit 2 lignes de 4 colonnes.
 * Ce sont les pièces SUIVANTES dans la même lecture catalogue : les deux
 * grilles ne partagent donc jamais une pièce.
 */
const SEASON_PRODUCT_LIMIT = 8;

export default async function HomePage() {
  const [productsResult, heroSlides, categoryBanners, homeSections] = await Promise.all([
    // Une seule requête alimente les deux grilles (pas de doublon, pas de
    // seconde phase réseau).
    getProducts({ first: FEATURED_PRODUCT_LIMIT + SEASON_PRODUCT_LIMIT }),
    getHeroSlides(),
    getCategoryBanners(),
    getHomeSections(),
  ]);
  const { products } = productsResult;

  // Découpage éditorial : les 8 premières pièces sont les « Pièces phares »,
  // les 8 suivantes la « Sélection de la Saison ». Si la boutique publie moins
  // de 16 pièces, la seconde grille affiche simplement moins de cartes — on
  // préfère une grille courte à une grille dupliquée.
  const featuredProducts = products.slice(0, FEATURED_PRODUCT_LIMIT);
  const seasonProducts = products.slice(
    FEATURED_PRODUCT_LIMIT,
    FEATURED_PRODUCT_LIMIT + SEASON_PRODUCT_LIMIT,
  );

  // Les sections éditoriales sont réparties dans les trois emplacements du flux
  // (storytelling → produits → bannière → matières) au lieu d'être empilées en
  // bloc : c'est ce qui crée le rythme premium sans répéter la grille produits.
  //
  // ⚠️ `splitHomeSections()` ne renvoie JAMAIS `null` : si Shopify publie moins
  //    de `MIN_HOME_SECTIONS` (3) metaobjects `home_section`, les emplacements
  //    vacants sont complétés par les sections démo/fallback locales. Les trois
  //    sections sont donc rendues INCONDITIONNELLEMENT ci-dessous :
  //      1. `image_left`  → L'élégance & le savoir-faire
  //      2. `full_banner` → bannière lookbook / immersion
  //      3. `image_right` → matières & engagement éthique
  const { storytelling, lookbook, materials } = splitHomeSections(homeSections);

  // Visuels produits :
  // - Si nous avons des produits Shopify, on utilise les visuels du catalogue
  //   (getAllProductsCatalog) pour alimenter les DEUX grilles produits.
  // - Sinon, ProductsSection utilise ses replis SVG locaux.
  const productVisuals = await getProductVisuals({
    catalogSize: products.length || FEATURED_PRODUCT_LIMIT + SEASON_PRODUCT_LIMIT,
  });

  return (
    <>
      {/* 1. HeroCarousel — Metaobjects `hero_slide` (repli éditorial local). */}
      <HeroSection slides={heroSlides} />

      {/* 2. ValuePropositions — barre de réassurance (store.ts). */}
      <ValuePropositions />

      {/* 3. CategoriesGrid — Metafields `custom.banner_*` des collections. */}
      <CategoriesGrid banners={categoryBanners} />

      {/* 4. Section éditoriale « storytelling » — disposition `image_left`.
          Jamais nulle : complétée par la section démo locale si absente. */}
      <EditorialSection section={storytelling} tone="dark" />

      {/* 5. « Pièces phares » — grille principale (8 pièces = 2 lignes × 4). */}
      <ProductsSection
        products={featuredProducts}
        productVisuals={productVisuals}
        variant="featured"
      />

      {/* 6. Section éditoriale « bannière / lookbook » — disposition
          `full_banner` (alias admin accepté : `full_width`). */}
      <EditorialSection section={lookbook} tone="dark" />

      {/* 7. Section éditoriale « matières & artisanat » — disposition
          `image_right`. Clôt le flux éditorial. */}
      <EditorialSection section={materials} tone="light" />

      {/* 8. « Sélection de la Saison » — 2ᵉ grille produits (8 pièces = 2 lignes
          × 4), posée sur une bande bleu nuit : la rupture de fond exigée par le
          design system entre la section éditoriale ci-dessus et la Newsletter.
          `visualsOffset` décale les visuels de repli pour ne pas répéter ceux
          de la grille principale. */}
      <ProductsSection
        products={seasonProducts}
        productVisuals={productVisuals}
        variant="season"
        visualsOffset={FEATURED_PRODUCT_LIMIT}
      />

      {/* 9. NewsletterSection — closing call-to-action. */}
      <NewsletterSection />
    </>
  );
}


