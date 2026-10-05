// src/components/product/ProductDetails.tsx
// ────────────────────────────────────────────────────────────────────────────
//  LONGUE DESCRIPTION EN ACCORDÉON (fiche produit).
//
//  Trois volets, dans l'ordre du récit de la maison :
//    1. Histoire & Inspiration      → origines du motif, symbolique du tissu ;
//    2. Confection & Entretien      → geste d'atelier + conseils de lavage ;
//    3. Guide des Tailles & Livraisons → échelle de tailles, expéditions.
//
//  Accessibilité : chaque en-tête est un vrai <button> relié à son panneau
//  (`aria-expanded` / `aria-controls` / `role="region"`). Le premier volet est
//  ouvert par défaut pour que la lecture commence sans interaction.
//
//  Le contenu provient du catalogue éditorial (`mock-data.ts` →
//  `Product.descriptionSections`). À défaut, un texte de repli honnête est
//  affiché : jamais de bloc vide, jamais de promesse inventée.
// ────────────────────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATALOG_ALL_SIZES, MADE_TO_MEASURE_SIZE } from "@/constants/catalog";
import {
  FREE_SHIPPING_THRESHOLD,
  RETURN_WINDOW_DAYS,
} from "@/constants/store";
import type { ProductDescriptionSections } from "@/lib/shopify/types";

type PanelKey = "histoire" | "confection" | "tailles";

type Panel = {
  key: PanelKey;
  title: string;
  eyebrow: string;
  body: string;
};

const FALLBACKS: Record<PanelKey, string> = {
  histoire:
    "L'histoire de cette pièce est racontée par son créateur : le motif, la matière et l'intention sont décrits dans la fiche produit. Écrivez-nous pour en savoir plus sur ses origines.",
  confection:
    "Chaque pièce est confectionnée en Afrique par son créateur, avec une attention particulière portée à l'assemblage, aux finitions et aux détails artisanaux. Suivez les recommandations de l'étiquette et privilégiez un lavage délicat.",
  tailles: `Guide des tailles et délais de livraison communiqués avec votre commande. Expédition suivie depuis l'atelier du créateur, retours acceptés sous ${RETURN_WINDOW_DAYS} jours.`,
};

export default function ProductDetails({
  sections,
  madeToMeasure = false,
}: {
  sections: ProductDescriptionSections;
  /** La pièce accepte une commande aux mesures du client. */
  madeToMeasure?: boolean;
}) {
  const [openKey, setOpenKey] = useState<PanelKey | null>("histoire");

  const panels: Panel[] = [
    {
      key: "histoire",
      eyebrow: "Récit",
      title: "Histoire & Inspiration",
      body: sections.materialOrigin || FALLBACKS.histoire,
    },
    {
      key: "confection",
      eyebrow: "Atelier",
      title: "Confection & Entretien",
      body:
        [sections.cutAndMaking, sections.care].filter(Boolean).join(" ") ||
        FALLBACKS.confection,
    },
    {
      key: "tailles",
      eyebrow: "Pratique",
      title: "Guide des Tailles & Livraisons",
      body: sections.sizeAndDelivery || FALLBACKS.tailles,
    },
  ];

  return (
    <section aria-label="Détails de la pièce" className="space-y-2.5">
      {panels.map((panel) => {
        const isOpen = openKey === panel.key;
        const panelId = `product-panel-${panel.key}`;
        const buttonId = `product-tab-${panel.key}`;

        return (
          <div
            key={panel.key}
            className="overflow-hidden rounded-sm border border-line bg-surface shadow-sm transition-shadow duration-300 hover:shadow-md"
          >
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenKey(isOpen ? null : panel.key)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-surface-2"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-gold-dark dark:text-gold">
                    {panel.eyebrow}
                  </span>
                  <span className="font-serif text-lg leading-snug text-text">
                    {panel.title}
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={`shrink-0 text-gold transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-5 text-sm leading-relaxed text-text-2"
            >
              <p>{panel.body}</p>

              {/* Volet « Tailles » : échelle de référence du catalogue + cadre
                  commercial canonique (source unique : constants/store.ts). */}
              {panel.key === "tailles" && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <ul
                    className="flex flex-wrap gap-1.5"
                    aria-label="Tailles de référence"
                  >
                    {CATALOG_ALL_SIZES.map((size) => (
                      <li
                        key={size}
                        className={`rounded-sm border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${
                          size === MADE_TO_MEASURE_SIZE
                            ? "border-gold/60 text-gold-dark dark:text-gold"
                            : "border-line text-text-2"
                        }`}
                      >
                        {size}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-text-3">
                    {madeToMeasure
                      ? "Cette pièce peut être confectionnée à vos mesures : choisissez « Sur-mesure » ou transmettez-nous vos mensurations."
                      : "Les tailles affichées correspondent aux pièces réellement publiées par le créateur ; les mesures exactes figurent dans le guide ci-dessus."}
                  </p>
                  <p className="text-xs text-text-3">
                    Expédition sous 2 à 5 jours ouvrés · Livraison offerte dès{" "}
                    {FREE_SHIPPING_THRESHOLD} € · Retours sous {RETURN_WINDOW_DAYS}{" "}
                    jours
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
