
// src/app/products/[handle]/page.tsx
// Phase 6 — ISR + JSON-LD Schema.org/Product + métadonnées haute couture.
import { getProductByHandle, getProducts } from "@/lib/shopify/products";
import { getSiteUrl } from "@/lib/seo";
import ProductJsonLd from "@/components/seo/ProductJsonLd";
import ProductImages from "@/components/product/ProductImages";
import ProductForm from "@/components/product/ProductForm";
import ProductDetails from "@/components/product/ProductDetails";
import { isLocalPlaceholder } from "@/lib/assets/images";
import { SHIPPING_AND_RETURNS_RULE } from "@/constants/store";
import { Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

/** ISR : régénère la fiche au plus toutes les 5 minutes (webhook = instantané). */
export const revalidate = 300;

// Génère les métadonnées dynamiquement depuis les données produit
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const siteUrl = getSiteUrl();
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Produit introuvable" };

  const url = `${siteUrl}/products/${handle}`;
  const description =
    product.shortDescription?.slice(0, 155) ||
    product.description?.slice(0, 155) ||
    `${product.title} — création AfroStyle par ${product.vendor}.`;

  // Visuel de partage : on privilégie un média RÉEL de la pièce. Un repli
  // local (`data:`) n'est jamais publiable sur les réseaux sociaux — on ne
  // déclare donc AUCUNE image Open Graph plutôt que d'y pousser un placeholder.
  const shareImage =
    product.images.find(
      (image) => Boolean(image.url) && !isLocalPlaceholder(image.url),
    )?.url ?? null;

  return {
    title: `${product.title} — ${product.vendor}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "AfroStyle",
      title: `${product.title} | AfroStyle — Haute Couture Africaine`,
      description,
      url,
      images: shareImage ? [{ url: shareImage, alt: product.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | AfroStyle`,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

// Pré-génère les pages statiques pour les N premiers produits
// En entretien: "generateStaticParams = SSG pour les pages connues.
// Les nouvelles pages sont générées à la demande (ISR fallback)."
export async function generateStaticParams() {
  const { products } = await getProducts({ first: 50 });
  return products.map((p) => ({ handle: p.handle }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  // notFound() → affiche la page 404 de Next.js
  if (!product) notFound();

  return (
    <>
      <ProductJsonLd product={product} />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galerie images */}
          <ProductImages images={product.images} title={product.title} />

          {/* Infos + Formulaire */}
          <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <nav
              className="text-xs tracking-widest uppercase"
              style={{ color: "var(--text-3)" }}
            >
              <span>Shop</span>
              <span className="mx-2" style={{ color: "var(--gold-dark)" }}>
                ›
              </span>
              <span style={{ color: "var(--text)" }}>{product.title}</span>
            </nav>

            {/* Origine */}
            <p
              className="text-xs tracking-widest uppercase"
              style={{ color: "var(--gold-dark)" }}
            >
              {[product.country, product.fabric]
                .filter(Boolean)
                .map((s) => s!.charAt(0).toUpperCase() + s!.slice(1))
                .join(" · ")}
            </p>

            {/* Titre */}
            <h1
              className="font-serif text-4xl leading-tight"
              style={{ color: "var(--text)" }}
            >
              {product.title}
            </h1>

            {/* Note & Créateur */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span style={{ color: "var(--text-2)" }}>
                par{" "}
                <span
                  className="font-medium"
                  style={{ color: "var(--gold-dark)" }}
                >
                  {product.vendor}
                </span>
              </span>

              {product.rating && (
                <>
                  <span
                    aria-hidden="true"
                    style={{ color: "var(--line-strong, #D8D2C5)" }}
                  >
                    ·
                  </span>
                  <div
                    className="flex items-center gap-1.5"
                    aria-label={`Note de la pièce : ${product.rating.value} sur 5 (${product.rating.count} avis)`}
                  >
                    <div className="flex items-center text-gold">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i <= Math.round(product.rating?.value ?? 5)
                              ? "fill-gold text-gold"
                              : "text-line"
                          }
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {product.rating.value.toFixed(1)}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-3)" }}
                    >
                      ({product.rating.count} avis)
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Prix affiché dynamiquement par ProductForm (variante exacte).
                Pas de prix statique ici pour éviter tout double affichage. */}

            {/* Séparateur */}
            <div style={{ height: "1px", background: "var(--line)" }} />

            {/* Formulaire variantes + courte description + ajout panier */}
            <ProductForm
              key={product.id}
              product={product}
              shortDescription={product.shortDescription}
              madeToMeasure={product.madeToMeasure}
            />

            {/* Longue description en accordéon à 3 volets */}
            <div style={{ height: "1px", background: "var(--line)" }} />
            <ProductDetails
              sections={product.descriptionSections}
              madeToMeasure={product.madeToMeasure}
            />

            {/* Réassurance — formulation CANONIQUE unique (src/constants/store.ts),
                identique à l'accueil, la FAQ et le footer. */}
            <div
              className="rounded-sm p-4 text-sm space-y-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                color: "var(--text-2)",
              }}
            >
              <p>✦ {SHIPPING_AND_RETURNS_RULE}</p>
              <p>🚚 Expédition sous 2 à 5 jours ouvrés, suivi communiqué par e-mail</p>
              <p>🔒 Paiement 100 % sécurisé</p>
              <p className="text-xs">
                <Link
                  href="/returns"
                  className="underline underline-offset-2"
                  style={{ color: "var(--gold-dark)" }}
                >
                  Conditions de retour
                </Link>
                {" · "}
                <Link
                  href="/faq"
                  className="underline underline-offset-2"
                  style={{ color: "var(--gold-dark)" }}
                >
                  Foire aux questions
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
