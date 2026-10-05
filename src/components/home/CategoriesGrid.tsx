// src/components/home/CategoriesGrid.tsx — « Nos univers »
// ────────────────────────────────────────────────────────────────────────────
//  Source de vérité : les METAFIELDS `custom.banner_*` des collections Shopify.
//  Chaque carte affichée correspond donc à une collection réellement admin-
//  configurable : image, sous-titre, libellé du bouton et ordre se changent
//  depuis Shopify Admin, sans toucher au code.
//
//  Repli éditorial (`FALLBACK_UNIVERS`) : si aucune collection n'est encore
//  configurée, on conserve les 4 univers historiques pour que la home ne perde
//  jamais son accroche. Dès qu'UNE bannière Shopify existe, le repli est retiré
//  — mélanger visuels configurés et visuels de repli produirait une grille
//  incohérente.
// ────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES } from "@/constants/images";
import SafeImage from "@/components/ui/SafeImage";
import type { CollectionBanner } from "@/lib/shopify/collections";

/** Carte unifiée : bannière Shopify ou repli éditorial. */
type Univers = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  href: string;
  buttonText: string;
};

/** Repli éditorial historique (utilisé tant qu'aucune bannière n'est publiée). */
const FALLBACK_UNIVERS: Univers[] = [
  {
    id: "fallback-femme",
    title: "Femme",
    subtitle: "Robes, ensembles & silhouettes Wax",
    href: "/collections?gender=femme",
    image: IMAGES.categories.femme,
    imageAlt: "Modèle en robe / ensemble en Pagne Wax moderne",
    buttonText: "Explorer",
  },
  {
    id: "fallback-homme",
    title: "Homme",
    subtitle: "Chemises, vestes & costumes africains",
    href: "/collections?gender=homme",
    image: IMAGES.categories.homme,
    imageAlt: "Homme en costume brodé africain / Agbada",
    buttonText: "Explorer",
  },
  {
    id: "fallback-accessoires",
    title: "Accessoires",
    subtitle: "Sacs, bijoux & foulards ethniques",
    href: "/collections?gender=accessoire",
    image: IMAGES.categories.accessoires,
    imageAlt: "Foulard Gele et/ou bijoux africains dorés",
    buttonText: "Explorer",
  },
  {
    id: "fallback-sur-mesure",
    title: "Sur-Mesure",
    subtitle: "Bazin, kente & pièces d'héritage ajustées",
    href: "/collections?tissu=bazin",
    image: IMAGES.categories.surMesure,
    imageAlt: "Modèle en Bazin riche ajusté sur-mesure",
    buttonText: "Explorer",
  },
];

/** Nombre de cartes affichées au maximum (au-delà, la grille deviendrait un mur). */
const MAX_UNIVERS = 6;

function toUnivers(banners: CollectionBanner[] | undefined): Univers[] {
  if (!banners?.length) return FALLBACK_UNIVERS;
  return banners.slice(0, MAX_UNIVERS).map((banner) => ({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    image: banner.image,
    imageAlt: banner.imageAlt,
    href: banner.href,
    buttonText: banner.buttonText,
  }));
}

/**
 * Colonnes adaptatives : la grille doit rester équilibrée quel que soit le
 * nombre de collections configurées dans Shopify (2, 3, 4 ou 5 univers).
 */
function gridClass(count: number): string {
  if (count >= 5) return "grid-cols-2 lg:grid-cols-5";
  if (count === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  if (count === 3) return "grid-cols-1 sm:grid-cols-3";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-1";
}
export default function CategoriesGrid({
  banners,
}: {
  banners?: CollectionBanner[];
}) {
  const univers = toUnivers(banners);

  return (
    // Alternance de fond — sable clair, entre la bande bleu nuit (Rassurance)
    // et la section crème « Pièces phares ».
    <section className="bg-surface-2 py-16 lg:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 flex items-center gap-3 text-xs uppercase tracking-widest text-gold-dark dark:text-gold">
              Explorer par catégories
              <span className="inline-block h-px w-16 bg-gold/40" />
            </p>
            <h2 className="font-serif text-3xl text-text sm:text-4xl">
              Nos <em className="text-gold-dark dark:text-gold">univers</em>
            </h2>
          </div>
          <Link
            href="/collections"
            className="hidden text-xs uppercase tracking-widest text-text-2 transition-colors hover:text-gold-dark dark:hover:text-gold sm:block"
          >
            Tout voir →
          </Link>
        </div>

        <div className={`grid gap-5 ${gridClass(univers.length)}`}>
          {univers.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative block aspect-[3/4] overflow-hidden rounded-xl border border-line shadow-[0_12px_32px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(0,0,0,0.16)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_20px_48px_rgba(0,0,0,0.6)]"
            >
              {/* Visuel — média de bannière Shopify (repli : photo éditoriale).
SafeImage : media Shopify → placeholder SVG local. */}
              <SafeImage
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                fallbackAlt={item.imageAlt}
              />

              {/* Overlay sombre — lisibilité, s'intensifie au survol */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 transition-opacity duration-300 group-hover:from-black/90 group-hover:via-black/45"
                aria-hidden="true"
              />

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6">
                {item.subtitle ? (
                  <p className="text-[0.65rem] uppercase tracking-[0.25em] text-white/70">
                    {item.subtitle}
                  </p>
                ) : null}
                <h3 className="font-serif text-2xl leading-tight text-white">
                  {item.title}
                </h3>
                <span className="mt-1 inline-flex items-center gap-2 rounded-sm border border-white/40 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-widest text-white transition-all duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black">
                  {item.buttonText}
                  <ArrowRight
                    size={13}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}