// src/app/lookbook/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/shopify/products";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/assets/images";
import LookbookImage from "@/components/lookbook/LookbookImage";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Lookbook AfroStyle — La mode africaine contemporaine en images.",
};

export default async function LookbookPage() {
  // Fetch les vrais produits depuis Shopify
  let products: Awaited<ReturnType<typeof getProducts>>["products"] = [];
  let shopifyError: string | null = null;
  try {
    ({ products } = await getProducts({ first: 8 }));
  } catch (error) {
    console.error("[lookbook] Impossible de charger les produits Shopify :", error);
    shopifyError = "Impossible de charger les produits depuis Shopify. Veuillez vérifier la configuration de l'API.";
  }

  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh", color: "#1A1A1A" }}>

      {/* Header */}
      <div
        className="py-20 px-6 text-center"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <p
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: "#B8860B" }}
        >
          Printemps — Été 2024
        </p>
        <h1
          className="font-serif mb-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "#1A1A1A" }}
        >
          Le <em style={{ color: "#B8860B" }}>Lookbook</em>
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#4A4A44" }}>
          Une saison dédiée à la rencontre entre l&apos;héritage textile africain
          et la modernité contemporaine.
        </p>
      </div>

      {/* Grille Lookbook asymétrique */}
      {shopifyError ? (
        <div className="text-center py-24" style={{ color: "#4A4A44" }}>
          <p className="font-serif text-2xl mb-4" style={{ color: "#B8860B" }}>
            Connexion impossible
          </p>
          <p className="max-w-md mx-auto">{shopifyError}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24" style={{ color: "#4A4A44" }}>
          <p className="font-serif text-2xl mb-4" style={{ color: "#1A1A1A" }}>
            Aucun produit disponible
          </p>
          <p>Ajoute des produits dans Shopify Admin pour les voir ici.</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-16">

          {/* Grille masonry simulée */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {products.map((product, index) => {
              // Alternance de tailles pour l'effet lookbook
              const isLarge = index === 0 || index === 3 || index === 6;
              const image = product.images[0];
              const imageSrc = image?.url ?? FALLBACK_PRODUCT_IMAGE;
              const imageAlt = image?.altText ?? product.title;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="group relative overflow-hidden block"
                  style={{
                    borderRadius: "2px",
                    // Les grandes cartes prennent 2 lignes sur desktop
                    gridRow: isLarge ? "span 2" : "span 1",
                  }}
                >
                  {/* Image — plein écran, ratio 3/4, object-cover */}
                  <div
                    className="relative aspect-[3/4] w-full overflow-hidden"
                    style={{
                      // fond neutre éditorial en attendant le chargement
                      background: "#F0ECE4",
                    }}
                  >
                                                          <LookbookImage
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />

                    {/* Overlay au hover */}
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: "linear-gradient(transparent 30%, rgba(0,0,0,0.85))",
                      }}
                    >
                      {/* Pays · Tissu */}
                      {(product.country || product.fabric) && (
                        <p
                          className="text-xs tracking-widest uppercase mb-1"
                          style={{ color: "#C5A059" }}
                        >
                          {[product.country, product.fabric]
                            .filter(Boolean)
                            .map((s) => s!.toUpperCase())
                            .join(" · ")}
                        </p>
                      )}

                      <p
                        className="font-serif text-lg leading-tight mb-1"
                        style={{ color: "#FFFFFF" }}
                      >
                        {product.title}
                      </p>

                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#FFFFFF" }}
                        >
                          {product.priceFormatted}
                        </span>
                        <span
                          className="text-xs px-3 py-1 tracking-wider uppercase"
                          style={{
                            background: "#C5A059",
                            color: "#FFFFFF",
                            borderRadius: "2px",
                          }}
                        >
                          Shop →
                        </span>
                      </div>
                    </div>

                    {/* Point "+" cliquable visible au repos */}
                    <div
                      className="absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center group-hover:opacity-0 transition-opacity duration-200"
                      style={{
                        background: "rgba(197,160,89,0.95)",
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "18px",
                      }}
                    >
                      +
                    </div>
                  </div>

                  {/* Infos sous l'image */}
                  <div className="pt-3 pb-2">
                    <p
                      className="font-serif text-sm leading-tight"
                      style={{ color: "#1A1A1A" }}
                    >
                      {product.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#B8860B" }}>
                      par {product.vendor} · {product.priceFormatted}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div
        className="text-center py-16 px-6"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <h2
          className="font-serif text-3xl mb-4"
          style={{ color: "#1A1A1A" }}
        >
          Portez le lookbook
        </h2>
        <p className="text-sm mb-8" style={{ color: "#4A4A44" }}>
          Chaque pièce est disponible à l&apos;achat — livrée directement
          depuis l&apos;atelier du créateur.
        </p>
        <Link href="/collections" className="btn-primary inline-flex">
          Acheter la collection
        </Link>
      </div>

    </div>
  );
}