// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Notre Histoire",
  description: "L'histoire d'AfroStyle — la première destination premium pour la mode africaine contemporaine.",
};

const TIMELINE = [
  { year: "2017", title: "La vision", text: "Jb Mawubevi, fondateur d'AfroStyle, observe un paradoxe : la mode africaine est admirée dans le monde entier mais ses créateurs restent invisibles. L'idée germe." },
  { year: "2019", title: "Les premiers créateurs", text: "AfroStyle signe ses premiers partenariats avec 3 designers : Adaeze Okafor au Bénin, Aminata Diallo au Sénégal. La plateforme est encore une simple page Instagram." },
  { year: "2021", title: "La boutique en ligne", text: "Lancement officiel de la boutique e-commerce. 847 commandes le premier mois. La presse africaine et de la diaspora s'emballe." },
  { year: "2023", title: "L'expansion", text: "87 créateurs, 14 pays, 2 400+ pièces. AfroStyle devient la référence de la mode africaine contemporaine premium." },
  { year: "2024", title: "Aujourd'hui", text: "Une nouvelle plateforme, une nouvelle ambition : faire d'AfroStyle le LVMH de la mode africaine." },
];

const VALUES = [
  { title: "Authenticité", icon: "✦", text: "Chaque pièce est créée par un designer africain avec des matières sourcées en Afrique. Zéro compromis sur l'origine." },
  { title: "Excellence", icon: "◆", text: "Nous ne référençons que des créateurs sélectionnés pour la qualité de leur travail, leur vision et leur éthique de production." },
  { title: "Impact", icon: "●", text: "70% du prix de vente revient directement au créateur. Nous croyons que l'artiste doit vivre de son art." },
  { title: "Héritage", icon: "▲", text: "Nous documentons les techniques et les histoires derrière chaque tissu. La mode comme préservation culturelle." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "#0F172A", minHeight: "100vh" }}>

      {/* Hero */}
      <div
        className="relative py-32 px-6 text-center overflow-hidden"
        style={{ borderBottom: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(135deg, #D4AF37 0px, #D4AF37 1px, transparent 1px, transparent 80px)`,
          }}
        />
        <p className="text-xs tracking-widest uppercase mb-4 relative" style={{ color: "#D4AF37" }}>
          Notre histoire
        </p>
        <h1 className="font-serif text-5xl md:text-7xl mb-6 relative leading-tight" style={{ color: "#FDFAF4" }}>
          L'Afrique mérite<br />
          <em style={{ color: "#D4AF37" }}>une scène mondiale</em>
        </h1>
        <p className="text-base max-w-xl mx-auto relative" style={{ color: "#D4CCBA" }}>
          AfroStyle est né d'une conviction simple : les créateurs africains sont parmi
          les plus talentueux du monde. Il leur manquait juste une vitrine à la hauteur
          de leur talent.
        </p>
      </div>

      {/* Mission */}
      <div
        className="py-20 px-6"
        style={{ background: "#1E293B" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "#D4AF37" }}>
            Notre mission
          </p>
          <blockquote className="font-serif text-3xl md:text-4xl leading-snug" style={{ color: "#FDFAF4" }}>
            "Connecter les créateurs d'Afrique aux amateurs de mode authentique
            partout sur la planète — et permettre à chaque artiste de vivre
            dignement de son art."
          </blockquote>
        </div>
      </div>

      {/* Valeurs */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-widest uppercase mb-4 text-center" style={{ color: "#D4AF37" }}>
            Ce en quoi nous croyons
          </p>
          <h2 className="font-serif text-4xl mb-12 text-center" style={{ color: "#FDFAF4" }}>
            Nos <em style={{ color: "#D4AF37" }}>valeurs</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="p-8 rounded-sm"
                style={{
                  background: "#1E293B",
                  border: "0.5px solid rgba(212,175,55,0.15)",
                }}
              >
                <span className="text-2xl mb-4 block" style={{ color: "#D4AF37" }}>
                  {value.icon}
                </span>
                <h3 className="font-serif text-xl mb-3" style={{ color: "#FDFAF4" }}>
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#D4CCBA" }}>
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-20 px-6" style={{ background: "#1E293B" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "#D4AF37" }}>
            Notre parcours
          </p>
          <h2 className="font-serif text-4xl mb-12" style={{ color: "#FDFAF4" }}>
            De l'idée à la <em style={{ color: "#D4AF37" }}>réalité</em>
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
                    style={{ background: "#D4AF37" }}
                  />
                  {i < TIMELINE.length - 1 && (
                    <div
                      className="w-px flex-1 my-2"
                      style={{ background: "rgba(212,175,55,0.2)", minHeight: "3rem" }}
                    />
                  )}
                </div>
                {/* Contenu */}
                <div className="pb-10">
                  <span
                    className="text-xs tracking-widest uppercase font-medium"
                    style={{ color: "#D4AF37" }}
                  >
                    {event.year}
                  </span>
                  <h3 className="font-serif text-xl mt-1 mb-2" style={{ color: "#FDFAF4" }}>
                    {event.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#D4CCBA" }}>
                    {event.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "87+", label: "Créateurs partenaires" },
            { num: "14",  label: "Pays représentés" },
            { num: "2 400+", label: "Pièces uniques" },
            { num: "70%", label: "Reversé aux créateurs" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-serif text-5xl font-bold mb-2" style={{ color: "#D4AF37" }}>
                {stat.num}
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "#D4CCBA" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="py-20 px-6 text-center"
        style={{ background: "#1E293B", borderTop: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <h2 className="font-serif text-4xl mb-4" style={{ color: "#FDFAF4" }}>
          Rejoins l'aventure
        </h2>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "#D4CCBA" }}>
          Que tu sois créateur, client ou passionné de mode africaine —
          AfroStyle est ta maison.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/collections" className="btn-primary inline-flex">
            Explorer la collection <ArrowRight size={14} />
          </Link>
          <Link href="/designers" className="btn-outline inline-flex">
            Découvrir les créateurs
          </Link>
        </div>
      </div>

    </div>
  );
}