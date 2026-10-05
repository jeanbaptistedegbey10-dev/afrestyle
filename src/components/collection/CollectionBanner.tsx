// src/components/collection/CollectionBanner.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Bandeau de `/collections/[handle]` — alimenté par les Metafields
//  `custom.banner_*` de la collection (médias, titre, sous-titre, CTA).
//
//  Sans bannière configurée, on conserve l'en-tête éditorial historique :
//  une page collection ne doit JAMAIS se retrouver sans titre.
// ────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import type { CollectionBanner as CollectionBannerData } from "@/lib/shopify/collections";

type CollectionBannerProps = {
  /** Données Shopify ; `null` si aucun média n'est configuré. */
  banner: CollectionBannerData | null;
  /** Repli sur les données natives de la collection. */
  title: string;
  description?: string | null;
  /** Nombre de pièces — affiché en kicker quand la bannière n'en fournit pas. */
  productCount?: number;
};

export default function CollectionBanner({
  banner,
  title,
  description,
  productCount = 0,
}: CollectionBannerProps) {
  // ── Repli éditorial : en-tête centré, aucun visuel demandé ────────────────
  if (!banner) {
    return (
      <header className="border-b border-line px-6 py-14 text-center md:py-20">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-text-3">
          N 01 — Notre sélection
        </p>
        <h1 className="font-serif text-4xl leading-tight md:text-6xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-2">
          {description ||
            `${productCount} pièce${productCount !== 1 ? "s" : ""} — Chaque création raconte une histoire`}
        </p>
      </header>
    );
  }

  return (
    <header className="relative isolate overflow-hidden bg-band text-band-text">
      <div className="relative min-h-[280px] w-full md:min-h-[380px]">
        <SafeImage
          src={banner.image}
          alt={banner.imageAlt}
          fill
          sizes="100vw"
          className="object-cover object-center"
          fallbackAlt={banner.imageAlt}
        />
        {/* Voiles : vertical pour le mobile, latéral pour le desktop (cf. Hero). */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#101B2A] via-[#101B2A]/55 to-black/25"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 hidden bg-gradient-to-r from-[#101B2A]/85 via-[#101B2A]/30 to-transparent md:block"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex min-h-[inherit] w-full max-w-7xl flex-col justify-end px-6 py-12 md:py-16 lg:px-8">
          <p className="mb-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-band-gold">
            Collection
            <span className="inline-block h-px w-12 bg-band-gold/50" />
          </p>

          <h1 className="font-serif text-4xl leading-tight text-band-text md:text-6xl">
            {banner.title}
          </h1>

          {banner.subtitle ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-band-text-2 sm:text-base">
              {banner.subtitle}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={banner.href}
              className="btn-primary min-h-12 justify-center bg-gold text-gold-contrast hover:bg-band-gold-hover"
            >
              {banner.buttonText}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            {productCount > 0 ? (
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-band-text-2">
                {productCount} pièce{productCount !== 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}