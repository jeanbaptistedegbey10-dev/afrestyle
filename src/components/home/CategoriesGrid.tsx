// src/components/home/CategoriesGrid.tsx — Grandes cartes visuelles par univers
// Photos Unsplash HD (src/constants/images.ts) + overlay sombre + typographie
// serif pour une lecture éditoriale haut de gamme dans les deux thèmes.
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { IMAGES } from "@/constants/images";

const CATEGORIES = [
  {
    label: "Femme",
    subtitle: "Robes, ensembles & silhouettes Wax",
    href: "/collections?genre=femme",
    image: IMAGES.categories.femme,
    alt: "Modèle en robe / ensemble en Pagne Wax moderne",
  },
  {
    label: "Homme",
    subtitle: "Chemises, vestes & costumes africains",
    href: "/collections?genre=homme",
    image: IMAGES.categories.homme,
    alt: "Homme en costume brodé africain / Agbada",
  },
  {
    label: "Accessoires",
    subtitle: "Sacs, bijoux & foulards ethniques",
    href: "/collections?genre=accessoire",
    image: IMAGES.categories.accessoires,
    alt: "Foulard Gele et/ou bijoux africains dorés",
  },
  {
    label: "Sur-Mesure",
    subtitle: "Bazin, kente & pièces d'héritage ajustées",
    href: "/collections?tissu=bazin",
    image: IMAGES.categories.surMesure,
    alt: "Modèle en Bazin riche ajusté sur-mesure",
  },
];

export default function CategoriesGrid() {
  return (
    // Alternance de fond — rupture visuelle avec la bande de réassurance
    <section className="bg-bg-2 py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-gold-dark dark:text-gold text-xs tracking-widest uppercase mb-3 flex items-center gap-3">
              Explorer par catégories
              <span className="h-px w-16 inline-block bg-gold/40" />
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-text">
              Nos <em className="text-gold-dark dark:text-gold">univers</em>
            </h2>
          </div>
          <Link
            href="/collections"
            className="text-text-2 text-xs tracking-widest uppercase hidden sm:block hover:text-gold-dark dark:hover:text-gold transition-colors"
          >
            Tout voir →
          </Link>
        </div>

        {/* Grille — 1 colonne mobile, 2 tablette, 4 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group relative block aspect-[3/4] overflow-hidden rounded-xl border border-line shadow-[0_12px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(0,0,0,0.16)] dark:hover:shadow-[0_20px_48px_rgba(0,0,0,0.6)]"
            >
              {/* Visuel — photo Unsplash HD, zoom fluide au survol */}
              <Image
                src={cat.image}
                alt={cat.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Overlay sombre — lisibilité, s'intensifie au survol */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 transition-opacity duration-300 group-hover:from-black/90 group-hover:via-black/45" />

              {/* Contenu — ancré en bas, éditorial */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6">
                <p className="text-[0.65rem] tracking-[0.25em] uppercase text-white/70">
                  {cat.subtitle}
                </p>
                <h3 className="font-serif text-2xl leading-tight text-white">
                  {cat.label}
                </h3>
                {/* Bouton d'action — outline blanc, se remplit au survol */}
                <span className="mt-1 inline-flex items-center gap-2 border border-white/40 px-4 py-2 text-[0.7rem] font-medium tracking-widest uppercase text-white rounded-sm transition-all duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black">
                  Explorer
                  <ArrowRight
                    size={13}
                    className="transition-transform duration-300 group-hover:translate-x-1"
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
