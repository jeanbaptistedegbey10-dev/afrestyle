
const DESCRIPTION_SECTIONS = [
  {
    key: "materialOrigin",
    title: "Matière & origine",
    fallback:
      "La matière et l’origine sont communiquées par le créateur dans la fiche produit. Contactez-nous pour obtenir les détails de cette pièce.",
  },
  {
    key: "cutAndMaking",
    title: "Coupe & confection",
    fallback:
      "La coupe et les finitions sont décrites dans la description de la pièce. Une attention particulière est portée à l’assemblage et aux détails artisanaux.",
  },
  {
    key: "care",
    title: "Conseils d’entretien",
    fallback:
      "Suivez les recommandations de l’étiquette et privilégiez un entretien délicat pour préserver la matière et les finitions.",
  },
  {
    key: "sizeAndDelivery",
    title: "Guide des tailles & livraison",
    fallback:
      "Guide des tailles et délai de livraison communiqués avec le devis ou dans la fiche produit. Livraison suivie depuis l’atelier du créateur.",
  },
] as const;


// src/app/products/[handle]/page.tsx
// Phase 6 — ISR + JSON-LD Schema.org/Product + métadonnées haute couture.
import { getProductByHandle, getProducts } from "@/lib/shopify/products";
import { getSiteUrl } from "@/lib/seo";
import ProductJsonLd from "@/components/seo/ProductJsonLd";
import ProductImages from "@/components/product/ProductImages";
import ProductForm from "@/components/product/ProductForm";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/assets/images";
import { SHIPPING_AND_RETURNS_RULE } from "@/constants/store";
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

  // Privilégie l'image produit, sinon fallback maison cohérent pour le partage.
  const image =
    product.images[0]?.url ||
    (product.variants[0]?.image?.url ?? FALLBACK_PRODUCT_IMAGE);

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
      images: image ? [{ url: image, alt: product.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | AfroStyle`,
      description,
      images: image ? [image] : [],
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

            {/* Créateur */}
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              par{" "}
              <span
                className="font-medium transition-colors"
                style={{ color: "var(--gold-dark)" }}
              >
                {product.vendor}
              </span>
            </p>

            {/* Prix affiché dynamiquement par ProductForm (variante exacte).
                Pas de prix statique ici pour éviter tout double affichage. */}

            {/* Séparateur */}
            <div style={{ height: "1px", background: "var(--line)" }} />

            {/* Formulaire variantes + ajout panier (remonté par produit) */}
            <ProductForm key={product.id} product={product} />

            {/* Description courte puis détails structurés, enrichis via Shopify. */}
            <div style={{ height: "1px", background: "var(--line)" }} />
            <div className="space-y-6">
              <div>
                <h3
                  className="mb-3 text-xs uppercase tracking-[0.2em]"
                  style={{ color: "var(--gold-dark)" }}
                >
                  Description
                </h3>
                {product.shortDescription && (
                  <p
                    className="text-base leading-relaxed"
                    style={{ color: "var(--text)" }}
                  >
                    {product.shortDescription}
                  </p>
                )}
                {product.description &&
                  product.description !== product.shortDescription && (
                    <p
                      className="mt-3 text-sm leading-relaxed"
                      style={{ color: "var(--text-2)" }}
                    >
                      {product.description}
                    </p>
                  )}
              </div>

              <div>
                <h3
                  className="mb-4 text-xs uppercase tracking-[0.2em]"
                  style={{ color: "var(--gold-dark)" }}
                >
                  Les détails de la pièce
                </h3>
                <div className="space-y-4">
                  {DESCRIPTION_SECTIONS.map((section) => (
                    <section
                      key={section.key}
                      className="rounded-sm border border-line bg-surface p-4 shadow-sm"
                    >
                      <h4 className="font-serif text-lg text-text">
                        {section.title}
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-text-2">
                        {product.descriptionSections[section.key] || section.fallback}
                      </p>
                    </section>
                  ))}
                </div>
              </div>
            </div>

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
