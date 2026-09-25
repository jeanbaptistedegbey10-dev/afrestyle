// src/components/home/StorySection.tsx — Créateurs & éditorial AfroStyle
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES } from "@/constants/images";
import SafeImage from "@/components/ui/SafeImage";
import type { Product } from "@/lib/shopify/types";

type EditorialCard = {
  kicker: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  href: string;
};

const EDITORIAL_FALLBACKS: EditorialCard[] = [
  {
    kicker: "Direction artistique",
    title: "Silhouettes contemporaines",
    description: "Une lecture éditoriale du vêtement africain, du dessin à la silhouette portée.",
    image: IMAGES.lookbook[0],
    alt: "Silhouette africaine éditoriale présentée comme image d’ambiance, sans lien avec un créateur identifié.",
    href: "/collections",
  },
  {
    kicker: "Univers de matière",
    title: "Palette & savoir-faire",
    description: "Des matières et des détails mis en scène dans une palette ivoire, bleu nuit et champagne.",
    image: IMAGES.story,
    alt: "Ambiance éditoriale de mode africaine utilisée pour illustrer la direction artistique AfroStyle.",
    href: "/about",
  },
  {
    kicker: "Détails & héritage",
    title: "L’accessoire en héritage",
    description: "Bijoux, parures et finitions prolongent le récit autour de chaque tenue.",
    image: IMAGES.lookbook[2],
    alt: "Parure et accessoires de mode africaine photographiés comme image éditoriale d’ambiance.",
    href: "/lookbook",
  },
];

function buildCards(products: Product[]): EditorialCard[] {
  const cards = products
    .filter((product) => product.images.length > 0)
    .slice(0, 3)
    .map<EditorialCard>((product) => {
      const image = product.images[0];
      const hasVendor = product.vendor.trim().length > 0;

      return {
        kicker: hasVendor ? "Créateur catalogue" : "Pièce catalogue",
        title: hasVendor ? product.vendor : product.title,
        description: product.shortDescription || `Découvrez la création « ${product.title} » et les informations publiées dans sa fiche produit.`,
        image: image.url,
        alt: image.altText?.trim() || `Visuel de la création « ${product.title} », sélectionné dans le catalogue AfroStyle.`,
        href: `/products/${product.handle}`,
      };
    });

  return cards.length > 0 ? cards : EDITORIAL_FALLBACKS;
}

export default function StorySection({ products = [] }: { products?: Product[] }) {
  const cards = buildCards(products);

  return (
    <section className="border-y border-line bg-band py-16 text-band-text lg:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-band-gold">
              Créateurs & éditorial
            </p>
            <h2 className="max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
              Des pièces choisies. Des histoires{" "}
              <em className="font-normal text-band-gold-hover">à découvrir.</em>
            </h2>
          </div>
          <div className="flex flex-col gap-5 lg:items-end">
            <p className="max-w-xl text-sm leading-relaxed text-band-text-2 lg:text-right">
              Les premières cartes reprennent les créateurs renseignés dans le catalogue. À défaut d’un portrait authentifié, elles mettent en avant la création sans inventer d’identité.
            </p>
            <Link href="/about" className="inline-flex min-h-11 w-fit items-center gap-2 border-b border-band-gold pb-1 text-xs font-medium uppercase tracking-[0.18em] text-band-text transition-colors duration-300 hover:text-band-gold-hover">
              Notre manifeste <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article key={`${card.href}-${card.title}`} className="group flex min-h-full flex-col overflow-hidden rounded-sm border border-line bg-surface text-text shadow-[0_14px_36px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(0,0,0,0.18)]">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
                <SafeImage
                  src={card.image}
                  alt={card.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  fallbackAlt={card.alt}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-band/45 via-transparent to-transparent" aria-hidden="true" />
                <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-band/75 px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                  {card.kicker}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="font-serif text-2xl leading-tight text-text">{card.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-text-2">{card.description}</p>
                <Link href={card.href} className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-accent-dark transition-colors duration-300 hover:text-text">
                  Découvrir <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}