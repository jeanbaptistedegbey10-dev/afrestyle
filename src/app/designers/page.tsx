// src/app/designers/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getDesignerProducts } from "@/lib/shopify/products";

export const metadata: Metadata = {
  title: "Designers",
  description: "Découvrez les créateurs africains derrière chaque pièce AfroStyle.",
};

interface DesignerItem {
  num: string;
  name: string;
  country: string;
  specialty: string;
  pieces: number;
  since: number;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  tags: string[];
}

export default async function DesignersPage() {
  // Récupère les designers approuvés depuis la base de données
  const dbDesigners = await db.designer.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  // Pour chaque designer, récupère le nombre de produits Shopify associés
  const designersWithProducts: DesignerItem[] = await Promise.all(
    dbDesigners.map(async (designer, index) => {
      let productCount = 3;
      try {
        const { products } = await getDesignerProducts(designer.handle);
        productCount = products.length;
      } catch {
        productCount = 3;
      }
      
      const tags = [designer.specialty, designer.country].filter(Boolean);
      return {
        num: String(index + 1).padStart(2, "0"),
        name: `${designer.firstName} ${designer.lastName}`,
        country: designer.country || "Afrique",
        specialty: designer.specialty || "Mode",
        pieces: productCount,
        since: designer.since || new Date().getFullYear(),
        handle: designer.handle,
        bio: designer.bio || "",
        avatarUrl: designer.avatarUrl,
        tags,
      };
    })
  );

  const allDesigners = designersWithProducts;

  // Extraction unique des pays pour le décompte
  const countries = new Set(allDesigners.map((d) => d.country));

  return (
    <div className="min-h-screen" style={{ background: "#0F172A" }}>

      {/* Header */}
      <div
        className="py-20 px-6 text-center relative overflow-hidden"
        style={{ borderBottom: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #D4AF37 0px, #D4AF37 1px, transparent 1px, transparent 60px)`,
          }}
        />
        <p className="text-xs tracking-widest uppercase mb-4 relative" style={{ color: "#D4AF37" }}>
          Les visages derrière chaque pièce
        </p>
        <h1 className="font-serif text-5xl md:text-6xl mb-4 relative" style={{ color: "#FDFAF4" }}>
          Nos <em style={{ color: "#D4AF37" }}>Créateurs</em>
        </h1>
        <p className="text-sm max-w-lg mx-auto relative" style={{ color: "#D4CCBA" }}>
          {allDesigners.length} designers d'exception issus de {" "}
          <span style={{ color: "#D4AF37" }}>{countries.size} pays africains</span>.
          Chacun porte une vision unique de la mode contemporaine.
        </p>
      </div>

      {/* Grille designers */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allDesigners.map((designer: DesignerItem) => (
            <DesignerCard key={designer.handle} designer={designer} />
          ))}
        </div>
      </div>

      {/* CTA devenir créateur */}
      <div
        className="mx-6 mb-16 rounded-sm p-12 text-center"
        style={{ background: "#1E293B", border: "0.5px solid rgba(212,175,55,0.15)" }}
      >
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>
          Tu es créateur ?
        </p>
        <h2 className="font-serif text-3xl mb-4" style={{ color: "#FDFAF4" }}>
          Rejoins la famille AfroStyle
        </h2>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "#D4CCBA" }}>
          Nous sélectionnons des créateurs africains d'exception pour donner à leur art
          une visibilité mondiale.
        </p>
        <Link href="/designers/apply" className="btn-primary inline-flex">
          Candidater <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}

function DesignerCard({ designer }: { designer: DesignerItem }) {
  const gradientColors = [
    "linear-gradient(155deg, #2d1535, #0d2218)",
    "linear-gradient(155deg, #0a2010, #201408)",
    "linear-gradient(155deg, #201408, #0a1820)",
    "linear-gradient(155deg, #1a2010, #20100a)",
    "linear-gradient(155deg, #201808, #081820)",
    "linear-gradient(155deg, #201510, #102015)",
    "linear-gradient(155deg, #1a0820, #082010)",
    "linear-gradient(155deg, #201020, #102010)",
    "linear-gradient(155deg, #082010, #201008)",
    "linear-gradient(155deg, #102020, #201020)",
    "linear-gradient(155deg, #1a2015, #151020)",
    "linear-gradient(155deg, #201510, #102015)",
  ];
  
  const gradientIndex = (designer.handle.length) % gradientColors.length;

  return (
    <Link href={`/designers/${designer.handle}`} className="group block">
      {/* Photo */}
      <div
        className="relative aspect-[4/5] overflow-hidden mb-5"
        style={{ borderRadius: "2px" }}
      >
        {designer.avatarUrl ? (
          <Image
            src={designer.avatarUrl}
            alt={designer.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            style={{ background: gradientColors[gradientIndex] }}
          />
        )}
        {/* Badge pays */}
        <div
          className="absolute bottom-4 left-4 text-xs tracking-widest uppercase px-3 py-1"
          style={{ background: "rgba(15,23,42,0.85)", color: "#D4AF37" }}
        >
          {designer.country}
        </div>
        {/* Flèche hover */}
        <div
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{ background: "#D4AF37" }}
        >
          <ArrowRight size={14} color="#0F172A" />
        </div>
      </div>

      {/* Infos */}
      <p className="text-xs tracking-wider mb-1" style={{ color: "#D4CCBA" }}>
        {designer.num} — Designer
      </p>
      <h3
        className="font-serif text-xl mb-1 transition-colors duration-200"
        style={{ color: "#FDFAF4" }}
      >
        {designer.name}
      </h3>
      <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>
        {designer.specialty}
      </p>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "#D4CCBA" }}>
        {designer.bio}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {designer.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1"
            style={{ border: "0.5px solid rgba(212,175,55,0.2)", color: "#D4CCBA", borderRadius: "2px" }}
          >
            {tag}
          </span>
        ))}
      </div>

      <p
        className="text-xs pt-3"
        style={{ color: "#D4CCBA", borderTop: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <span style={{ color: "#D4AF37", fontWeight: 500 }}>{designer.pieces} pièces</span>
        {" "}disponibles · Depuis {designer.since}
      </p>
    </Link>
  );
}