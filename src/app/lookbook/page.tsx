// src/app/lookbook/page.tsx
// ────────────────────────────────────────────────────────────────────────────
//  LOOKBOOK ÉDITORIAL — 100 % alimenté par Shopify.
//
//  Chaque tuile EST une pièce réelle : visuel principal, titre, créateur et
//  prix proviennent de la Storefront API (collection dédiée si elle existe,
//  sinon les dernières pièces publiées) et renvoient vers /products/<handle>.
//  Aucun tableau de données codé en dur, aucun visuel produit factice.
//
//  Fraîcheur : `revalidate = 0` (pas de pré-rendu statique) + lecture
//  `cache: "no-store"` dans getLookbookProducts() + `minimumCacheTTL: 0` sur
//  l'optimiseur d'images → une image remplacée dans Shopify Admin apparaît au
//  premier rafraîchissement, sans rebuild ni purge manuelle.
// ────────────────────────────────────────────────────────────────────────────
import type { Metadata } from "next";
import Link from "next/link";
import {
  LOOKBOOK_PRODUCT_LIMIT,
  getLookbookProducts,
  type LookbookData,
} from "@/lib/shopify/products";
import { getProductMainImage } from "@/lib/product/variants";
import { FALLBACK_IMAGE_ALT, FALLBACK_PRODUCT_IMAGE } from "@/lib/assets/images";
import { capitalize } from "@/lib/utils";
import LookbookImage from "@/components/lookbook/LookbookImage";
import type { Product } from "@/lib/shopify/types";

export const metadata: Metadata = {
  title: "Lookbook",
  description:
    "Lookbook AfroStyle — la mode africaine contemporaine en images. Chaque look est une pièce réelle de la collection, disponible à l'achat.",
};

/** Aucun cache de route : le lookbook reflète la boutique à chaque requête. */
export const revalidate = 0;

/**
 * Tuiles agrandies (rythme éditorial asymétrique). Ce n'est qu'une mise en
 * page : l'ordre et le contenu restent ceux renvoyés par Shopify.
 */
const LARGE_TILES = new Set([0, 3, 6]);

/** Ligne « Pays · Tissu » dérivée des tags Shopify (`pays-…` / `tissu-…`). */
function subtitleFor(product: Product): string {
  return [
    product.country && capitalize(product.country),
    product.fabric && capitalize(product.fabric),
  ]
    .filter(Boolean)
    .join(" · ");
}

export default async function LookbookPage() {
  let data: LookbookData = { products: [], collection: null };
  let shopifyError: string | null = null;

  try {
    data = await getLookbookProducts({ first: LOOKBOOK_PRODUCT_LIMIT });
  } catch (error) {
    console.error("[lookbook] Impossible de charger les produits Shopify :", error);
    // Message client : vouvoiement, aucune fuite de détail technique interne.
    shopifyError =
      "Notre catalogue est momentanément indisponible. Merci de bien vouloir réessayer dans quelques instants.";
  }

  const { products, collection } = data;
  const collectionHref = collection
    ? `/collections/${collection.handle}`
    : "/collections";

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header — titre et description issus de la collection Shopify si elle existe */}
      <div className="border-b border-line py-20 px-6 text-center">
        <p className="text-xs tracking-widest uppercase mb-4 text-gold-dark dark:text-gold">
          {collection ? collection.title : "Dernières pièces"} — {new Date().getFullYear()}
        </p>
        <h1
          className="font-serif mb-4 text-text"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
        >
          Le <em className="text-gold-dark dark:text-gold">Lookbook</em>
        </h1>
        <p className="text-sm max-w-md mx-auto text-text-2">
          {collection?.description ||
            "Chaque silhouette est une pièce réellement disponible : visuels, créateurs et prix issus directement de la boutique."}
        </p>
        {!shopifyError && products.length > 0 && (
          <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-text-3">
            {products.length} pièce{products.length > 1 ? "s" : ""} — chacune disponible à l&apos;achat
          </p>
        )}
      </div>

      {/* États : erreur Shopify / catalogue vide */}
      {shopifyError ? (
        <div className="py-24 px-6 text-center">
          <div className="mx-auto max-w-md rounded-sm border border-line bg-surface px-6 py-12 shadow-sm">
            <p className="font-serif text-2xl mb-4 text-gold-dark dark:text-gold">
              Catalogue momentanément indisponible
            </p>
            <p className="text-sm text-text-2">{shopifyError}</p>
            <Link href="/collections" className="btn-outline mt-8">
              Découvrir la collection
            </Link>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 px-6 text-center">
          <div className="mx-auto max-w-md rounded-sm border border-line bg-surface px-6 py-12 shadow-sm">
            <p className="font-serif text-2xl mb-4 text-text">
              Le lookbook se prépare
            </p>
            <p className="text-sm text-text-2">
              Nos créateurs finalisent leurs prochaines pièces. Le lookbook sera
              révélé très bientôt — revenez nous voir, ou explorez la collection
              déjà disponible.
            </p>
            <Link href="/collections" className="btn-outline mt-8">
              Découvrir la collection
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Grille éditoriale : chaque tuile = un produit Shopify réel */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {products.map((product, index) => {
              const isLarge = LARGE_TILES.has(index);
              const image = getProductMainImage(product);
              const imageSrc = image?.url || FALLBACK_PRODUCT_IMAGE;
              const imageAlt = image?.altText || product.title || FALLBACK_IMAGE_ALT;
              const subtitle = subtitleFor(product);

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  aria-label={`${product.title} — ${product.priceFormatted}`}
                  className="group relative flex flex-col overflow-hidden rounded-sm border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl"
                  style={{ gridRow: isLarge ? "span 2" : undefined }}
                >
                  {/* Visuel principal du produit (Shopify CDN) */}
                  <div
                    className={`relative w-full overflow-hidden bg-surface-2 ${
                      isLarge ? "min-h-0 flex-1" : "aspect-[3/4]"
                    }`}
                  >
                    <LookbookImage
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      loading={index === 0 ? "eager" : "lazy"}
                      sizes={
                        isLarge
                          ? "(max-width: 768px) 50vw, 45vw"
                          : "(max-width: 768px) 50vw, 33vw"
                      }
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />

                    {/* Overlay au survol — appel à l'action explicite */}
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background: "linear-gradient(transparent 30%, rgba(0,0,0,0.85))",
                      }}
                    >
                      <span className="inline-flex w-fit items-center gap-2 rounded-sm bg-gold px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-gold-contrast">
                        Shopper la pièce →
                      </span>
                    </div>

                    {/* Badges — même langage visuel que <ProductCard /> */}
                    {!product.availableForSale && (
                      <span className="absolute left-3 top-3 rounded-sm border border-line bg-surface/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-text-2">
                        Épuisé
                      </span>
                    )}
                    {product.availableForSale && product.tags.includes("nouveau") && (
                      <span className="absolute left-3 top-3 rounded-sm bg-text px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-bg">
                        Nouveau
                      </span>
                    )}
                  </div>

                  {/* Informations produit — hiérarchie identique au catalogue */}
                  <div className="flex flex-col gap-1 p-4">
                    {subtitle && (
                      <p className="text-[11px] uppercase tracking-[0.2em] text-text-3">
                        {subtitle}
                      </p>
                    )}
                    <h2 className="font-serif text-base leading-snug text-text transition-colors duration-300 group-hover:text-gold-dark dark:group-hover:text-gold">
                      {product.title}
                    </h2>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-text">
                        {product.priceFormatted}
                      </span>
                      <span className="text-xs text-text-3">{product.vendor}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="border-t border-line text-center py-16 px-6">
        <h2 className="font-serif text-3xl mb-4 text-text">
          Portez le lookbook
        </h2>
        <p className="text-sm mb-8 text-text-2">
          Chaque pièce est disponible à l&apos;achat — livrée directement
          depuis l&apos;atelier du créateur.
        </p>
        <Link href={collectionHref} className="btn-primary inline-flex">
          Acheter la collection
        </Link>
      </div>
    </div>
  );
}


