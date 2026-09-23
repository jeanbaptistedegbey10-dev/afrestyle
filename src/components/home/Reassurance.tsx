// src/components/home/Reassurance.tsx — Bande de réassurance : 4 piliers, thème dynamique
import { Hammer, Truck, Leaf, Headset } from "lucide-react";

const PILLARS = [
  {
    icon: Hammer,
    num: "01",
    title: "Savoir-faire Artisanal",
    text: "Des pièces façonnées à la main par des artisans héritiers de savoir-faire séculaires, dans le respect des traditions.",
  },
  {
    icon: Truck,
    num: "02",
    title: "Livraison Internationale Sécurisée",
    text: "Vos créations voyagent avec soin : emballage premium, suivi en temps réel et livraison assurée partout dans le monde.",
  },
  {
    icon: Leaf,
    num: "03",
    title: "Créations Éco-responsables",
    text: "Tissus naturels, teintures respectueuses et production à taille humaine — le luxe conscient, du textile à l'étiquette.",
  },
  {
    icon: Headset,
    num: "04",
    title: "Service Client Sur-mesure",
    text: "Conseils de style personnalisés et accompagnement dédié avant, pendant et après chaque commande, 6 jours sur 7.",
  },
];

export default function Reassurance() {
  return (
    // Bande fine sous le Hero — rupture visuelle par bordures + icônes or
    <section className="border-b border-line bg-bg py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.num}
                className={`group flex flex-col items-start gap-4 ${
                  i > 0 ? "lg:border-l lg:border-line lg:pl-8" : ""
                }`}
              >
                {/* Icône — cercle fin, or discret, micro-interaction au survol */}
                <div className="flex items-center justify-between w-full">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gold-soft text-gold-dark dark:text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-white group-hover:shadow-[0_6px_18px_var(--gold-soft)]">
                    <Icon size={18} strokeWidth={1.5} />
                  </span>
                  <span className="font-serif text-xs tracking-[0.3em] text-text-3">
                    {pillar.num}
                  </span>
                </div>

                {/* Titre — serif élégant */}
                <h3 className="font-serif text-lg leading-snug text-text">
                  {pillar.title}
                </h3>

                {/* Texte — sans-serif fin, aéré, contraste AAA */}
                <p className="text-sm leading-relaxed text-text-2">
                  {pillar.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
