// src/components/home/DesignersSection.tsx
import Link from "next/link";

const DESIGNERS = [
  {
    num: "01",
    name: "Adaeze Okafor",
    country: "Bénin",
    specialty: "Couture contemporaine",
    bio: "Formée à Paris, enracinée à Cotonou. Adaeze mêle le wax traditionnel à des coupes architecturales modernes.",
    pieces: 24,
    since: 2019,
    handle: "adaeze-okafor",
    gradient: "linear-gradient(155deg, #2d1535, #0d2218, #251a08)",
  },
  {
    num: "02",
    name: "Kofi Mensah",
    country: "Ghana",
    specialty: "Kente & Streetwear",
    bio: "Pionnier du Kente urbain, Kofi redéfinit les codes du tissu royal ghanéen pour la génération Z.",
    pieces: 18,
    since: 2021,
    handle: "kofi-mensah",
    gradient: "linear-gradient(155deg, #0a2010, #201408, #200a18)",
  },
  {
    num: "03",
    name: "Aminata Diallo",
    country: "Sénégal",
    specialty: "Broderie & Luxe",
    bio: "Maîtresse de la broderie dakaroise, Aminata crée des pièces d'exception portées par les élites africaines.",
    pieces: 31,
    since: 2018,
    handle: "aminata-diallo",
    gradient: "linear-gradient(155deg, #201408, #0a1820, #180a20)",
  },
];

export default function DesignersSection() {
  return (
    <section className="py-20 px-6" style={{ background: "#1E293B" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p
              className="text-xs tracking-widest uppercase mb-3"
              style={{ color: "#D4AF37" }}
            >
              Visages de la création
            </p>
            <h2 className="font-serif text-4xl" style={{ color: "#FDFAF4" }}>
              Créateurs <em style={{ color: "#D4AF37" }}>en vedette</em>
            </h2>
          </div>
          <Link href="/designers" className="btn-outline hidden md:inline-flex">
            Tous les créateurs →
          </Link>
        </div>

        {/* Grid créateurs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {DESIGNERS.map((designer) => (
            <Link
              key={designer.handle}
              href={`/designers/${designer.handle}`}
              className="group block"
            >
              {/* Photo placeholder */}
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
                  style={{
                    background: "rgba(15,23,42,0.85)",
                    color: "#D4AF37",
                  }}
                >
                  {designer.country}
                </div>
              </div>

              {/* Infos */}
              <p
                className="text-xs tracking-wider mb-1"
                style={{ color: "#D4CCBA" }}
              >
                {designer.num} — Designer
              </p>
              <h3
                className="font-serif text-xl mb-1 transition-colors duration-200 group-hover:text-gold"
                style={{ color: "#FDFAF4" }}
              >
                {designer.name}
              </h3>
              <p
                className="text-xs tracking-widest uppercase mb-2"
                style={{ color: "#D4AF37" }}
              >
                {designer.specialty}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#D4CCBA" }}
              >
                {designer.bio}
              </p>
              <p
                className="text-xs mt-3 pt-3"
                style={{
                  color: "#D4CCBA",
                  borderTop: "0.5px solid rgba(212,175,55,0.1)",
                }}
              >
                <span style={{ color: "#D4AF37", fontWeight: 500 }}>
                  {designer.pieces} pièces
                </span>{" "}
                disponibles · Depuis {designer.since}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
