// src/app/designers/[handle]/page.tsx — version DB
import { db } from "@/lib/db";
import { getDesignerProducts } from "@/lib/shopify/products";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/product/ProductCard";

export async function generateStaticParams() {
  const designers = await db.designer.findMany({
    where: { status: "APPROVED" },
    select: { handle: true },
  });
  return designers.map((d: { handle: string }) => ({ handle: d.handle }));
}

export default async function DesignerPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  // Récupère les données du créateur depuis la DB
  const designer = await db.designer.findUnique({
    where: { handle, status: "APPROVED" },
  });

  if (!designer) notFound();

  // Récupère les produits depuis Shopify par vendor name (via sa collection designer-{handle})
  const { products } = await getDesignerProducts(designer.handle);

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <Link href="/designers" className="inline-flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: "#D4CCBA" }}>
          <ArrowLeft size={14} /> Tous les designers
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-16">

        {/* Photo */}
        <div>
          {designer.coverUrl ? (
            <div className="relative aspect-[3/4]">
              <Image
                src={designer.coverUrl}
                alt={designer.brandName}
                fill
                className="object-cover"
                style={{ borderRadius: "2px" }}
              />
            </div>
          ) : (
            <div
              className="aspect-[3/4]"
              style={{
                background: "linear-gradient(155deg, #2d1535, #0d2218, #251a08)",
                borderRadius: "2px",
              }}
            />
          )}
        </div>

        {/* Infos */}
        <div className="flex flex-col justify-center gap-6">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>
              {designer.country}
            </p>
            <h1 className="font-serif text-5xl mb-2" style={{ color: "#FDFAF4" }}>
              {designer.firstName} {designer.lastName}
            </h1>
            <p className="text-sm tracking-widest uppercase" style={{ color: "#D4AF37" }}>
              {designer.specialty}
            </p>
          </div>

          <div
            className="flex gap-8 py-6"
            style={{ borderTop: "0.5px solid rgba(212,175,55,0.15)", borderBottom: "0.5px solid rgba(212,175,55,0.15)" }}
          >
            <div>
              <div className="font-serif text-3xl font-bold" style={{ color: "#D4AF37" }}>
                {products.length}
              </div>
              <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "#D4CCBA" }}>
                Pièces
              </div>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold" style={{ color: "#D4AF37" }}>
                {new Date().getFullYear() - designer.since}
              </div>
              <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "#D4CCBA" }}>
                Ans d'expérience
              </div>
            </div>
          </div>

          {designer.quote && (
            <blockquote
              className="font-serif text-xl italic leading-relaxed"
              style={{ color: "#FDFAF4", borderLeft: "2px solid #D4AF37", paddingLeft: "1.5rem" }}
            >
              "{designer.quote}"
            </blockquote>
          )}

          <p className="text-sm leading-relaxed" style={{ color: "#D4CCBA" }}>
            {designer.bio}
          </p>
        </div>
      </div>

      {/* Histoire */}
      {designer.story && (
        <div className="py-16 px-6" style={{ background: "#1E293B" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "#D4AF37" }}>
              Son histoire
            </p>
            {designer.story.split("\n\n").map((para, i) => (
              <p key={i} className="text-base leading-relaxed mb-6" style={{ color: "#D4CCBA" }}>
                {para}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Produits */}
      {products.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="font-serif text-3xl mb-8" style={{ color: "#FDFAF4" }}>
            La collection de{" "}
            <em style={{ color: "#D4AF37" }}>{designer.firstName}</em>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}