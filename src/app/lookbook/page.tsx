// src/app/lookbook/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Lookbook AfroStyle — Printemps 2024. La mode africaine contemporaine en images.",
};

const LOOKS = [
  {
    id: 1, title: "Cotonou Dusk", designer: "Adaeze Okafor",
    description: "Robe en wax dégradé, coupe asymétrique, printemps 2024",
    price: "€ 185", handle: "robe-cotonou-dusk",
    gradient: "linear-gradient(160deg, #2d1535, #1a0d1a, #0d1a0d)",
    size: "large",
  },
  {
    id: 2, title: "Accra Royale", designer: "Kofi Mensah",
    description: "Veste en Kente tissé main, col mao, édition limitée",
    price: "€ 320", handle: "veste-accra-royale",
    gradient: "linear-gradient(160deg, #0a2010, #201408, #200a18)",
    size: "small",
  },
  {
    id: 3, title: "Dakar Flow", designer: "Aminata Diallo",
    description: "Ensemble brodé main, pantalon large et top structuré",
    price: "€ 270", handle: "ensemble-dakar-flow",
    gradient: "linear-gradient(160deg, #201408, #0a1820, #180a20)",
    size: "small",
  },
  {
    id: 4, title: "Lagos Night", designer: "Chidi Okeke",
    description: "Agbada slim-fit en soie naturelle, version nuit",
    price: "€ 450", handle: "agbada-lagos-night",
    gradient: "linear-gradient(160deg, #1a2010, #20100a, #0a1020)",
    size: "large",
  },
  {
    id: 5, title: "Bamako Earth", designer: "Fatoumata Coulibaly",
    description: "Manteau en bogolan naturel, motifs géométriques contemporains",
    price: "€ 380", handle: "manteau-bamako-earth",
    gradient: "linear-gradient(160deg, #201808, #081820, #180820)",
    size: "small",
  },
  {
    id: 6, title: "Abidjan Gold", designer: "Amara Traoré",
    description: "Parure complète en or akan, collier + boucles + bracelet",
    price: "€ 890", handle: "parure-abidjan-gold",
    gradient: "linear-gradient(160deg, #201510, #102015, #151020)",
    size: "small",
  },
];

export default function LookbookPage() {
  return (
    <div style={{ background: "#0F172A", minHeight: "100vh" }}>

      {/* Header */}
      <div
        className="py-20 px-6 text-center"
        style={{ borderBottom: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "#D4AF37" }}>
          Printemps — Été 2024
        </p>
        <h1 className="font-serif text-5xl md:text-6xl mb-4" style={{ color: "#FDFAF4" }}>
          Le <em style={{ color: "#D4AF37" }}>Lookbook</em>
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#D4CCBA" }}>
          Une saison dédiée à la rencontre entre l'héritage textile africain
          et la modernité contemporaine.
        </p>
      </div>

      {/* Grille lookbook asymétrique */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: "1.5rem",
          }}
        >
          {LOOKS.map((look, i) => (
            <LookCard key={look.id} look={look} index={i} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="text-center py-16 px-6"
        style={{ borderTop: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <h2 className="font-serif text-3xl mb-4" style={{ color: "#FDFAF4" }}>
          Portez le lookbook
        </h2>
        <p className="text-sm mb-8" style={{ color: "#D4CCBA" }}>
          Chaque pièce est disponible à l'achat
        </p>
        <Link href="/collections" className="btn-primary inline-flex">
          Acheter la collection
        </Link>
      </div>

    </div>
  );
}

function LookCard({
  look,
  index,
}: {
  look: (typeof LOOKS)[0];
  index: number;
}) {
  // Alternance large (8 cols) / small (4 cols) pour effet masonry
  const isLarge = look.size === "large";
  const colSpan = isLarge ? "span 8" : "span 4";
  const marginTop = index % 3 === 1 ? "3rem" : "0";

  return (
    <div
      style={{ gridColumn: colSpan, marginTop }}
      className="group relative cursor-pointer"
    >
      <Link href={`/products/${look.handle}`}>
        {/* Image */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: isLarge ? "4/3" : "3/4",
            borderRadius: "2px",
            background: look.gradient,
          }}
        >
          {/* Overlay au hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6"
            style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}
          >
            <p className="font-serif text-lg" style={{ color: "#FDFAF4" }}>
              {look.title}
            </p>
            <p className="text-xs mb-3" style={{ color: "#D4CCBA" }}>
              {look.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-medium" style={{ color: "#D4AF37" }}>
                {look.price}
              </span>
              <span
                className="text-xs px-3 py-1"
                style={{ background: "#D4AF37", color: "#0F172A", borderRadius: "2px" }}
              >
                Shop this look
              </span>
            </div>
          </div>

          {/* Point cliquable */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-70 group-hover:opacity-0 transition-opacity"
            style={{ background: "#D4AF37", animation: "pulse 2s infinite" }}
          >
            <span style={{ color: "#0F172A", fontWeight: 700, fontSize: "14px" }}>+</span>
          </div>
        </div>

        {/* Infos sous l'image */}
        <div className="mt-3">
          <p className="font-serif text-base" style={{ color: "#FDFAF4" }}>
            {look.title}
          </p>
          <p className="text-xs" style={{ color: "#D4AF37" }}>
            par {look.designer}
          </p>
        </div>
      </Link>
    </div>
  );
}