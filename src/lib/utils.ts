// src/lib/utils.ts
// cn() = fonction utilitaire pour combiner les classes Tailwind proprement
// Pattern utilisé dans TOUS les projets Next.js modernes

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { STORE_CURRENCY, STORE_LOCALE } from "@/constants/store";

/**
 * Combine et déduplique les classes Tailwind
 *
 * Exemple:
 * cn("px-4 py-2", isActive && "bg-gold", "px-8")
 * → "py-2 bg-gold px-8"  (px-4 est écrasé par px-8 intelligemment)
 *
 * Sans twMerge: "px-4 py-2 bg-gold px-8" → conflit CSS, comportement imprévisible
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un prix pour l'affichage — devise harmonisée sur tout le site.
 *
 * Shopify peut renvoyer `currencyCode: "USD"` (devise de la boutique) alors
 * que l'ensemble des textes du site (bandeau, FAQ, livraison) annonce des
 * montants en euros. La configuration unique `src/constants/store.ts` impose
 * donc la devise d'affichage EUR — le paramètre `currencyCode` est conservé
 * pour compatibilité mais n'est plus utilisé pour le rendu.
 *
 * Shopify renvoie: { amount: "185.00", currencyCode: "EUR" }
 */
export function formatPrice(
  amount: string,
  // Param conservé pour compatibilité avec les call sites existants — la
  // devise est volontairement forcée à STORE_CURRENCY (harmonisation EUR).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _currencyCode?: string,
): string {
  return new Intl.NumberFormat(STORE_LOCALE, {
    style: "currency",
    currency: STORE_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(amount));
}

/**
 * Extrait une métadonnée depuis les tags Shopify
 * Convention de tags: "pays-benin", "tissu-wax", "style-traditionnel"
 */
export function extractTag(tags: string[], prefix: string): string | null {
  return (
    tags.find((t) => t.startsWith(`${prefix}-`))?.replace(`${prefix}-`, "") ??
    null
  );
}

/**
 * Capitalise la première lettre
 * "benin" → "Bénin"
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
