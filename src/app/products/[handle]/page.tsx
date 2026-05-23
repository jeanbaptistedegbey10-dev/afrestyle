// src/app/products/[handle]/page.tsx
import { getProductByHandle, getProducts } from "@/lib/shopify/products";
import ProductImages from "@/components/product/ProductImages";
import ProductForm from "@/components/product/ProductForm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Génère les métadonnées dynamiquement depuis les données produit
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Produit introuvable" };

  return {
    title: product.title,
    description: product.description.slice(0, 155),
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
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
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galerie images */}
        <ProductImages images={product.images} title={product.title} />

        {/* Infos + Formulaire */}
        <div className="flex flex-col gap-6">
          {/* Breadcrumb */}
          <nav
            className="text-xs tracking-widest uppercase"
            style={{ color: "#D4CCBA" }}
          >
            <span>Shop</span>
            <span className="mx-2" style={{ color: "#D4AF37" }}>
              ›
            </span>
            <span style={{ color: "#F5F0E8" }}>{product.title}</span>
          </nav>

          {/* Origine */}
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "#D4AF37" }}
          >
            {[product.country, product.fabric]
              .filter(Boolean)
              .map((s) => s!.charAt(0).toUpperCase() + s!.slice(1))
              .join(" · ")}
          </p>

          {/* Titre */}
          <h1
            className="font-serif text-4xl leading-tight"
            style={{ color: "#FDFAF4" }}
          >
            {product.title}
          </h1>

          {/* Créateur */}
          <p className="text-sm" style={{ color: "#D4CCBA" }}>
            par{" "}
            <span
              className="font-medium transition-colors"
              style={{ color: "#D4AF37" }}
            >
              {product.vendor}
            </span>
          </p>

          {/* Prix */}
          <div className="flex items-center gap-4">
            <span
              className="font-serif text-3xl font-bold"
              style={{ color: "#FDFAF4" }}
            >
              {product.priceFormatted}
            </span>
            {product.compareAtPrice && (
              <span
                className="text-lg line-through"
                style={{ color: "#D4CCBA" }}
              >
                {product.compareAtPrice}
              </span>
            )}
          </div>

          {/* Séparateur */}
          <div style={{ height: "1px", background: "rgba(212,175,55,0.15)" }} />

          {/* Formulaire variantes + ajout panier */}
          <ProductForm product={product} />

          {/* Description */}
          <div style={{ height: "1px", background: "rgba(212,175,55,0.15)" }} />
          <div>
            <h3
              className="text-xs tracking-widest uppercase mb-3"
              style={{ color: "#D4AF37" }}
            >
              Description
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "#D4CCBA" }}>
              {product.description}
            </p>
          </div>

          {/* Infos livraison */}
          <div
            className="rounded-sm p-4 text-sm space-y-2"
            style={{ background: "#1E293B", color: "#D4CCBA" }}
          >
            <p>🚚 Livraison internationale 7-14 jours</p>
            <p>↩️ Retours gratuits sous 30 jours</p>
            <p>🔒 Paiement 100% sécurisé</p>
          </div>
        </div>
      </div>
    </div>
  );
}
