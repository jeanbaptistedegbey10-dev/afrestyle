// src/app/designers/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Designers",
  description: "Découvrez les créateurs africains derrière chaque pièce AfroStyle.",
};

const DESIGNERS = [
  {
    num: "01", name: "Adaeze Okafor", country: "Bénin",
    specialty: "Couture contemporaine", pieces: 24, since: 2019,
    handle: "adaeze-okafor",
    bio: "Formée à Paris, enracinée à Cotonou. Adaeze mêle le wax traditionnel à des coupes architecturales modernes qui traversent les frontières.",
    gradient: "linear-gradient(155deg, #2d1535, #0d2218, #251a08)",
    tags: ["Wax", "Femme", "Luxe"],
  },
  {
    num: "02", name: "Kofi Mensah", country: "Ghana",
    specialty: "Kente & Streetwear", pieces: 18, since: 2021,
    handle: "kofi-mensah",
    bio: "Pionnier du Kente urbain, Kofi redéfinit les codes du tissu royal ghanéen pour la génération Z mondiale.",
    gradient: "linear-gradient(155deg, #0a2010, #201408, #200a18)",
    tags: ["Kente", "Streetwear", "Homme"],
  },
  {
    num: "03", name: "Aminata Diallo", country: "Sénégal",
    specialty: "Broderie & Luxe", pieces: 31, since: 2018,
    handle: "aminata-diallo",
    bio: "Maîtresse de la broderie dakaroise, Aminata crée des pièces d'exception portées par les élites africaines et de la diaspora.",
    gradient: "linear-gradient(155deg, #201408, #0a1820, #180a20)",
    tags: ["Broderie", "Femme", "Premium"],
  },
  {
    num: "04", name: "Chidi Okeke", country: "Nigeria",
    specialty: "Agbada moderne", pieces: 22, since: 2020,
    handle: "chidi-okeke",
    bio: "Chidi réinterprète l'Agbada traditionnel Yoruba avec des matières contemporaines pour un homme africain ambitieux.",
    gradient: "linear-gradient(155deg, #1a2010, #20100a, #0a1020)",
    tags: ["Agbada", "Homme", "Traditionnel"],
  },
  {
    num: "05", name: "Fatoumata Coulibaly", country: "Mali",
    specialty: "Bogolan & Art textile", pieces: 15, since: 2022,
    handle: "fatoumata-coulibaly",
    bio: "Artiste textile formée à Bamako, Fatoumata transforme le bogolan ancestral en pièces portables à la croisée de l'art et de la mode.",
    gradient: "linear-gradient(155deg, #201808, #081820, #180820)",
    tags: ["Bogolan", "Unisexe", "Art"],
  },
  {
    num: "06", name: "Amara Traoré", country: "Côte d'Ivoire",
    specialty: "Accessoires & Joaillerie", pieces: 40, since: 2017,
    handle: "amara-traore",
    bio: "Joaillier et accessoiriste, Amara crée des pièces en or et en bronze inspirées des cours royales akan d'Abidjan.",
    gradient: "linear-gradient(155deg, #201510, #102015, #151020)",
    tags: ["Accessoires", "Or", "Joaillerie"],
  },
];

export default function DesignersPage() {
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
          {DESIGNERS.length} designers d'exception issus de {" "}
          <span style={{ color: "#D4AF37" }}>6 pays africains</span>.
          Chacun porte une vision unique de la mode contemporaine.
        </p>
      </div>

      {/* Grille designers */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DESIGNERS.map((designer) => (
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
        <Link href="/contact" className="btn-primary inline-flex">
          Candidater <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}

function DesignerCard({ designer }: { designer: typeof DESIGNERS[0] }) {
  return (
    <Link href={`/designers/${designer.handle}`} className="group block">
      {/* Photo */}
      <div
        className="relative aspect-[4/5] overflow-hidden mb-5"
        style={{ borderRadius: "2px" }}
      >
        <div
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          style={{ background: designer.gradient }}
        />
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