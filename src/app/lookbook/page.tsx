// src/app/lookbook/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/shopify/products";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Lookbook AfroStyle — La mode africaine contemporaine en images.",
};

export default async function LookbookPage() {
  // Fetch les vrais produits depuis Shopify
  const { products } = await getProducts({ first: 8 });

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh" }}>

      {/* Header */}
      <div
        className="py-20 px-6 text-center"
        style={{ borderBottom: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <p
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: "#D4AF37" }}
        >
          Printemps — Été 2024
        </p>
        <h1
          className="font-serif mb-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "#FDFAF4" }}
        >
          Le <em style={{ color: "#D4AF37" }}>Lookbook</em>
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#D4CCBA" }}>
          Une saison dédiée à la rencontre entre l'héritage textile africain
          et la modernité contemporaine.
        </p>
      </div>

      {/* Grille Lookbook asymétrique */}
      {products.length === 0 ? (
        <div className="text-center py-24" style={{ color: "#D4CCBA" }}>
          <p className="font-serif text-2xl mb-4" style={{ color: "#FDFAF4" }}>
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
                  {/* Image */}
                  <div
                    className="relative w-full overflow-hidden"
                    style={{
                      aspectRatio: isLarge ? "3/4" : "4/3",
                      background: "#1E293B",
                    }}
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText ?? product.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    ) : (
                      /* Fallback gradient si pas d'image */
                      <div
                        className="w-full h-full"
                        style={{
                          background: `linear-gradient(135deg, 
                            hsl(${(index * 47) % 360}, 30%, 15%), 
                            hsl(${(index * 47 + 120) % 360}, 25%, 10%))`,
                        }}
                      />
                    )}

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
                          style={{ color: "#D4AF37" }}
                        >
                          {[product.country, product.fabric]
                            .filter(Boolean)
                            .map((s) => s!.toUpperCase())
                            .join(" · ")}
                        </p>
                      )}

                      <p
                        className="font-serif text-lg leading-tight mb-1"
                        style={{ color: "#FDFAF4" }}
                      >
                        {product.title}
                      </p>

                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#D4AF37" }}
                        >
                          {product.priceFormatted}
                        </span>
                        <span
                          className="text-xs px-3 py-1 tracking-wider uppercase"
                          style={{
                            background: "#D4AF37",
                            color: "#0F172A",
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
                        background: "rgba(212,175,55,0.9)",
                        color: "#0F172A",
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
                      style={{ color: "#FDFAF4" }}
                    >
                      {product.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#D4AF37" }}>
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
        style={{ borderTop: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <h2
          className="font-serif text-3xl mb-4"
          style={{ color: "#FDFAF4" }}
        >
          Portez le lookbook
        </h2>
        <p className="text-sm mb-8" style={{ color: "#D4CCBA" }}>
          Chaque pièce est disponible à l'achat — livrée directement
          depuis l'atelier du créateur.
        </p>
        <Link href="/collections" className="btn-primary inline-flex">
          Acheter la collection
        </Link>
      </div>

    </div>
  );
}