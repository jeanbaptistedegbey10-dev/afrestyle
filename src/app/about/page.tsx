// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Notre Histoire",
  description: "L'histoire d'AfroStyle — la première destination premium pour la mode africaine contemporaine.",
};

// Parcours de la maison — dates alignées sur l'année en cours (2026).
// Aucun volume invérifiable (« 847 commandes », « 87 créateurs », « 2 400 pièces ») :
// seules des étapes factuelles et des engagements de marque sont affichés.
const TIMELINE = [
  {
    year: "2017",
    title: "La vision",
    text: "Jb Mawubevi, fondateur d'AfroStyle, observe un paradoxe : la mode africaine est admirée dans le monde entier, mais ses créateurs restent invisibles. L'idée germe.",
  },
  {
    year: "2019",
    title: "Les premiers créateurs",
    text: "AfroStyle signe ses premiers partenariats avec des créateurs au Bénin et au Sénégal. La plateforme n'est encore qu'une page Instagram — la sélection, déjà exigeante.",
  },
  {
    year: "2021",
    title: "La boutique en ligne",
    text: "Lancement officiel de la boutique : chaque pièce devient commandable et expédiée directement depuis l'atelier de son créateur.",
  },
  {
    year: "2023",
    title: "L'expansion",
    text: "Les collections s'ouvrent à de nouveaux pays et à de nouveaux tissus d'héritage. AfroStyle s'impose comme une référence de la mode africaine contemporaine premium.",
  },
  {
    year: "2026",
    title: "Aujourd'hui",
    text: "Une nouvelle plateforme, une nouvelle ambition : offrir à la mode africaine la scène internationale qu'elle mérite.",
  },
];

const VALUES = [
  { title: "Authenticité", icon: "✦", text: "Chaque pièce est créée par un designer africain avec des matières sourcées en Afrique. Zéro compromis sur l'origine." },
  { title: "Excellence", icon: "◆", text: "Nous ne référençons que des créateurs sélectionnés pour la qualité de leur travail, leur vision et leur éthique de production." },
  { title: "Impact", icon: "●", text: "70 % du prix de vente revient directement au créateur. Nous croyons que l'artiste doit vivre de son art." },
  { title: "Héritage", icon: "▲", text: "Nous documentons les techniques et les histoires derrière chaque tissu. La mode comme préservation culturelle." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>

      {/* Hero */}
      <div
        className="relative py-32 px-6 text-center overflow-hidden"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.08,
            backgroundImage: `repeating-linear-gradient(135deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 80px)`,
          }}
        />
        <p className="text-xs tracking-widest uppercase mb-4 relative" style={{ color: "var(--gold-dark)" }}>
          Notre histoire
        </p>
        <h1 className="font-serif text-5xl md:text-7xl mb-6 relative leading-tight" style={{ color: "var(--text)" }}>
          L’Afrique mérite<br />
          <em style={{ color: "var(--gold-dark)" }}>une scène mondiale</em>
        </h1>
        <p className="text-base max-w-xl mx-auto relative" style={{ color: "var(--text-2)" }}>
          AfroStyle est né d’une conviction simple : les créateurs africains sont parmi
          les plus talentueux du monde. Il leur manquait juste une vitrine à la hauteur
          de leur talent.
        </p>
      </div>

      {/* Mission */}
      <div
        className="py-20 px-6"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "var(--gold-dark)" }}>
            Notre mission
          </p>
          <blockquote className="font-serif text-3xl md:text-4xl leading-snug" style={{ color: "var(--text)" }}>
            « Connecter les créateurs d’Afrique aux amateurs de mode authentique
            partout sur la planète — et permettre à chaque artiste de vivre
            dignement de son art. »
          </blockquote>
        </div>
      </div>

      {/* Valeurs */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-widest uppercase mb-4 text-center" style={{ color: "var(--gold-dark)" }}>
            Nos convictions
          </p>
          <h2 className="font-serif text-4xl mb-12 text-center" style={{ color: "var(--text)" }}>
            Nos <em style={{ color: "var(--gold-dark)" }}>valeurs</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="p-8 rounded-sm"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                }}
              >
                <span className="text-2xl mb-4 block" style={{ color: "var(--gold-dark)" }}>
                  {value.icon}
                </span>
                <h3 className="font-serif text-xl mb-3" style={{ color: "var(--text)" }}>
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-20 px-6" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold-dark)" }}>
            Notre parcours
          </p>
          <h2 className="font-serif text-4xl mb-12" style={{ color: "var(--text)" }}>
            De l’idée à la <em style={{ color: "var(--gold-dark)" }}>réalité</em>
          </h2>
          <div className="space-y-0">
            {TIMELINE.map((event, i) => (
              <div
                key={event.year}
                className="flex gap-8"
              >
                {/* Ligne verticale + point */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ background: "var(--gold)" }}
                  />
                  {i < TIMELINE.length - 1 && (
                    <div
                      className="w-px flex-1 my-2"
                      style={{ background: "rgba(197,160,89,0.35)", minHeight: "3rem" }}
                    />
                  )}
                </div>
                {/* Contenu */}
                <div className="pb-10">
                  <span
                    className="text-xs tracking-widest uppercase font-medium"
                    style={{ color: "var(--gold-dark)" }}
                  >
                    {event.year}
                  </span>
                  <h3 className="font-serif text-xl mt-1 mb-2" style={{ color: "var(--text)" }}>
                    {event.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                    {event.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagements — marqueurs qualitatifs et contractuels, non chiffrés */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "100 %", label: "Confection africaine" },
            { num: "Fait main", label: "Savoir-faire d'héritage" },
            { num: "Direct", label: "Sans intermédiaire" },
            { num: "70 %", label: "Reversés aux créateurs" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-serif text-5xl font-bold mb-2" style={{ color: "var(--gold-dark)" }}>
                {stat.num}
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-2)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="py-20 px-6 text-center"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}
      >
        <h2 className="font-serif text-4xl mb-4" style={{ color: "var(--text)" }}>
          Rejoignez l’aventure
        </h2>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "var(--text-2)" }}>
          Que vous soyez créateur, cliente ou amoureux de la mode africaine —
          AfroStyle est votre maison.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/collections" className="btn-primary inline-flex">
            Explorer la collection <ArrowRight size={14} />
          </Link>
          <Link href="/lookbook" className="btn-outline inline-flex">
            Parcourir le lookbook
          </Link>
        </div>
      </div>

    </div>
  );
}