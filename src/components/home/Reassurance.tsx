// src/components/home/Reassurance.tsx — Bande de réassurance : 4 piliers, thème dynamique
import Link from "next/link";
import { Hammer, Truck, Leaf, Headset } from "lucide-react";
import {
  FREE_SHIPPING_THRESHOLD,
  RETURN_WINDOW_DAYS,
  SHIPPING_AND_RETURNS_RULE,
  formatStoreAmount,
} from "@/constants/store";

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
    title: "Livraison Internationale",
    // Conditions alignées sur /shipping et src/constants/store.ts (source unique).
    text: `Vos créations voyagent avec soin : emballage premium, suivi en temps réel et livraison offerte dès ${formatStoreAmount(FREE_SHIPPING_THRESHOLD)} d'achat, partout dans le monde.`,
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
    // Horaires alignés sur la page /contact (du lundi au vendredi, 9h — 18h GMT).
    text: "Conseils de style personnalisés et accompagnement dédié avant, pendant et après chaque commande — du lundi au vendredi, 9h à 18h (GMT).",
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
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gold-soft text-gold-dark dark:text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-gold-contrast group-hover:shadow-[0_6px_18px_var(--gold-soft)]">
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

        {/* Règle commerciale canonique — formulation UNIQUE, importée de
            src/constants/store.ts (livraison + retours sur tous les supports). */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-line pt-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-text-2">
            {SHIPPING_AND_RETURNS_RULE}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.2em]">
            <Link
              href="/shipping"
              className="text-text-3 transition-colors duration-300 hover:text-gold-dark dark:hover:text-gold"
            >
              Délais de livraison
            </Link>
            <Link
              href="/returns"
              className="text-text-3 transition-colors duration-300 hover:text-gold-dark dark:hover:text-gold"
            >
              Retours — {RETURN_WINDOW_DAYS} jours
            </Link>
            <Link
              href="/faq"
              className="text-text-3 transition-colors duration-300 hover:text-gold-dark dark:hover:text-gold"
            >
              Conditions dans nos FAQ
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
