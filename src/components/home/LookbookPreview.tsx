// src/components/home/LookbookPreview.tsx — Aperçu éditorial du lookbook / galerie
// Grille responsive uniforme (2 → 4 colonnes) : chaque tuile impose un ratio
// d'aspect 3/4 explicite. Les visuels `fill` étant en position absolue, sans
// ce ratio les rangées de grille s'effondrent en fins rectangles horizontaux.
// + légendes éditoriales + CTA vers /lookbook.
import Link from "next/link";
import { ArrowUpRight, AtSign } from "lucide-react";
import { IMAGES } from "@/constants/images";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/assets/images";
import { getProductMainImage } from "@/lib/product/variants";
import SafeImage from "@/components/ui/SafeImage";
import type { Product } from "@/lib/shopify/types";

type PreviewItem = {
  key: string;
  href: string;
  eyebrow: string;
  title: string;
  image: string;
};

/**
 * Repli purement éditorial (aucun faux produit) : utilisé UNIQUEMENT quand la
 * boutique Shopify ne renvoie aucune pièce — les tuiles renvoient alors au
 * lookbook complet.
 */
const EDITORIAL_LOOKS: PreviewItem[] = [
  {
    key: "kente",
    href: "/lookbook",
    eyebrow: "Éditorial",
    title: "Collection Kente — Accra",
    image: IMAGES.lookbook[0],
  },
  {
    key: "wax",
    href: "/lookbook",
    eyebrow: "Éditorial",
    title: "Wax contemporain — Abidjan",
    image: IMAGES.lookbook[1],
  },
  {
    key: "bogolan",
    href: "/lookbook",
    eyebrow: "Éditorial",
    title: "Bogolan pur — Bamako",
    image: IMAGES.lookbook[2],
  },
  {
    key: "boubou",
    href: "/lookbook",
    eyebrow: "Éditorial",
    title: "Boubou brodé — Dakar",
    image: IMAGES.lookbook[3],
  },
];

export default function LookbookPreview({
  products = [],
}: {
  /** Pièces Shopify réelles (page d'accueil) — chaque tuile devient produit. */
  products?: Product[];
}) {
  // Chaque élément correspond à une pièce commandable dès que le catalogue en
  // renvoie au moins une : visuel principal, titre et créateur viennent de
  // Shopify (voir getLookbookProducts pour le lookbook complet).
  const items: PreviewItem[] =
    products.length > 0
      ? products.slice(0, 4).map((product) => ({
          key: product.id,
          href: `/products/${product.handle}`,
          eyebrow: product.vendor,
          title: product.title,
          image: getProductMainImage(product)?.url || FALLBACK_PRODUCT_IMAGE,
        }))
      : EDITORIAL_LOOKS;

  return (
    // Fond clair neutre — prépare la rupture franche avec la bande sombre Newsletter
    <section className="bg-bg py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-gold-dark dark:text-gold text-xs tracking-widest uppercase mb-3 flex items-center gap-3">
              Lookbook &amp; Instagram
              <span className="h-px w-16 inline-block bg-gold/40" />
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-text">
              L&apos;élégance en <em className="text-gold-dark dark:text-gold">images</em>
            </h2>
          </div>
          <Link
            href="/lookbook"
            className="inline-flex items-center gap-2 text-text-2 text-xs tracking-widest uppercase hover:text-gold-dark dark:hover:text-gold transition-colors"
          >
            <AtSign size={13} />
            Suivre @afrestyle
          </Link>
        </div>

        {/* Grille éditoriale — responsive 2 → 4 colonnes, tuiles ratio 3/4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-line shadow-[0_10px_28px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(0,0,0,0.14)] dark:hover:shadow-[0_18px_44px_rgba(0,0,0,0.55)]"
            >
              {/* Visuel — zoom fluide au survol (onError → fallback local) */}
              <SafeImage
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover hover:scale-105 transition-transform duration-500"
              />

              {/* Overlay bas — lisibilité de la légende */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Badge flèche — révélé au survol */}
              <span className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                <ArrowUpRight size={16} />
              </span>

              {/* Légende éditoriale */}
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <p className="text-[0.6rem] tracking-[0.3em] uppercase text-white/70">
                  {item.eyebrow}
                </p>
                <p className="mt-1 font-serif text-sm md:text-base leading-snug text-white">
                  {item.title}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA — découverte du lookbook complet */}
        <div className="mt-12 text-center">
          <Link
            href="/lookbook"
            className="btn-outline hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
          >
            Découvrir le lookbook complet →
          </Link>
        </div>
      </div>
    </section>
  );
}
