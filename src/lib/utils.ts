// src/lib/utils.ts
// cn() = fonction utilitaire pour combiner les classes Tailwind proprement
// Pattern utilisé dans TOUS les projets Next.js modernes

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
 * Formate un prix Shopify
 * Shopify renvoie: { amount: "185.00", currencyCode: "EUR" }
 */
export function formatPrice(
  amount: string,
  currencyCode: string = "EUR",
): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currencyCode,
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
