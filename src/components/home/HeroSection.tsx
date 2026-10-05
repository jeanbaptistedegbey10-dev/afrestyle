// src/components/home/HeroSection.tsx â€” Hero Ã©ditorial pilotÃ© par Shopify
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  Ce fichier est dÃ©sormais un simple PASSERELLE serveur :
//   la donnÃ©e (Metaobjects `hero_slide`) arrive dÃ©jÃ  normalisÃ©e par la page,
//   l'interactivitÃ© vit dans `HeroCarousel.tsx` (client, Embla).
//
//  Avant : le diaporama vivait entiÃ¨rement ici, alimentÃ© par `IMAGES.heroSlides`
//  (constantes codÃ©es en dur). Les visuels comme les textes ne sont dÃ©sormais
//  plus modifiables qu depuis Shopify Admin.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import HeroCarousel from "@/components/home/HeroCarousel";
import type { HeroSlide } from "@/lib/shopify/hero";

type HeroSectionProps = {
  slides: HeroSlide[];
};

export default function HeroSection({ slides }: HeroSectionProps) {
  // `getHeroSlides()` garantit toujours au moins une slide : un Hero vide
  // laisserait la page sans titre ni LCP, on ne rend donc rien dans ce cas.
  if (!slides || slides.length === 0) return null;

  return <HeroCarousel slides={slides} />;
}
