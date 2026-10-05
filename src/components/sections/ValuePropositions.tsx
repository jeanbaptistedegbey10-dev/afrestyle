// src/components/sections/ValuePropositions.tsx
// ───────────────────────────────────────────────────────────────────────────────
//  BARRE DE RÉASSURANCE — 4 avantages clés AfroStyle.
// ───────────────────────────────────────────────────────────────────────────────
//  Complète `Reassurance.tsx` (bande bleu nuit + règle commerciale canonique)
//  en luxant le vocabulaire de réassurance demandé : Livraison, Paiement
//  Sécurisé, Confection Artisanale, Service Client.
//
//  Les montants et délais NE SONT PAS codés en dur : ils sont importés de
//  `src/constants/store.ts`, source de vérité commerciale unique du projet
//  (cf. `SHIPPING_AND_RETURNS_RULE`, `FREE_SHIPPING_THRESHOLD`,
//  `RETURN_WINDOW_DAYS`) — sinon la home afficherait des conditions différentes
//  de la FAQ, de /shipping et du panier.
//
//  Composant SERVEUR : aucune interactivité, aucun état client.
// ───────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { Truck, ShieldCheck, Hammer, Headset } from "lucide-react";
import {
  FREE_SHIPPING_THRESHOLD,
  RETURN_WINDOW_DAYS,
  SHIPPING_AND_RETURNS_RULE,
  formatStoreAmount,
} from "@/constants/store";

const PILLARS = [
  {
    icon: Truck,
    num: "01",
    title: "Livraison internationale",
    text: `Vos créations voyagent avec soin : emballage premium et suivi en temps réel. Livraison offerte dès ${formatStoreAmount(
      FREE_SHIPPING_THRESHOLD,
    )} d'achat, dans le monde entier.`,
  },
  {
    icon: ShieldCheck,
    num: "02",
    title: "Paiement sécurisé",
    text: "Carte bancaire, Shopify Pay et paiement fractionné. Transaction chiffrée de bout en bout — aucune donnée bancaire ne transite par nos serveurs.",
  },
  {
    icon: Hammer,
    num: "03",
    title: "Confection artisanale",
    text: "Chaque pièce est façonnée à la main par des artisans héritiers de savoir-faire séculaires, dans le respect des traditions et de la matière.",
  },
  {
    icon: Headset,
    num: "04",
    title: "Service client",
    text: "Conseils de style et accompagnement dédié avant, pendant et après chaque commande — du lundi au vendredi, 9h à 18h (GMT).",
  },
] as const;

export default function ValuePropositions() {
  return (
    // Bande de réassurance — bleu nuit dans les DEUX modes (rupture franche avec
    // le Hero au-dessus et les sections ivoire en dessous) : filet or discret en
    // tête, icônes champagne, textes ivoire (contraste AAA).
    <section
      aria-labelledby="value-props-title"
      className="border-t border-band-gold/20 bg-band py-12 text-band-text lg:py-16"
    >
      <h2 id="value-props-title" className="sr-only">
        Les engagements AfroStyle
      </h2>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.num}
                className={`group flex flex-col items-start gap-4 ${
                  // Filets verticaux : rupture nette entre les piliers ≥ lg.
                  i > 0 ? "lg:border-l lg:border-band-gold/20 lg:pl-8" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  {/* Icône — cercle fin champagne, remplissage au survol. */}
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-band-gold/40 bg-band-gold-soft text-band-gold transition-all duration-300 group-hover:bg-band-gold group-hover:text-band group-hover:shadow-[0_6px_18px_var(--band-gold-soft)]">
                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="font-serif text-xs tracking-[0.3em] text-band-text-2">
                    {pillar.num}
                  </span>
                </div>

                <h3 className="font-serif text-lg leading-snug text-band-text">
                  {pillar.title}
                </h3>

                <p className="text-sm leading-relaxed text-band-text-2">{pillar.text}</p>
              </div>
            );
          })}
        </div>

        {/* Règle commerciale canonique — formulation UNIQUE, importée de
            src/constants/store.ts (jamais réécrite ici). */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-band-gold/20 pt-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-band-text-2">
            {SHIPPING_AND_RETURNS_RULE}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.2em]">
            <Link
              href="/shipping"
              className="text-band-text-2 transition-colors duration-300 hover:text-band-gold-hover"
            >
              Délais de livraison
            </Link>
            <Link
              href="/returns"
              className="text-band-text-2 transition-colors duration-300 hover:text-band-gold-hover"
            >
              Retours — {RETURN_WINDOW_DAYS} jours
            </Link>
            <Link
              href="/faq"
              className="text-band-text-2 transition-colors duration-300 hover:text-band-gold-hover"
            >
              Conditions dans nos FAQ
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}