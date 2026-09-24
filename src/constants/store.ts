// src/constants/store.ts
// ────────────────────────────────────────────────────────────────────────────
//  Configuration commerciale UNIQUE d'AfroStyle — source de vérité pour :
//   • la devise d'affichage (harmonisation $US → EUR € sur tout le site) ;
//   • le seuil de livraison offerte (bandeau, FAQ, page livraison, panier) ;
//   • l'URL de l'application (retour checkout Shopify — jamais de localhost
//     en production).
//  Tout composant doit importer ICI plutôt que de coder une valeur en dur.
// ────────────────────────────────────────────────────────────────────────────

/** Locale de formatage (fr-FR → « 150 € », « 9,90 € »). */
export const STORE_LOCALE = "fr-FR";

/** Devise d'affichage principale — harmonisée sur tout le site. */
export const STORE_CURRENCY = "EUR";

/** Seuil (montant en devise de la boutique) pour la livraison offerte. */
export const FREE_SHIPPING_THRESHOLD = 150;

/** Forfait de livraison sous le seuil. */
export const FLAT_SHIPPING_RATE = 9.9;

/** URL de production (fallback quand aucune variable d'environnement n'est définie). */
export const PRODUCTION_APP_URL = "https://afrestyle.vercel.app";

/** Hosts considérés comme « local » (interdits en production). */
const LOCAL_HOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;

/**
 * Base URL absolue de l'application.
 * Ordre : NEXT_PUBLIC_APP_URL → NEXT_PUBLIC_SITE_URL → fallback production.
 * En production, toute valeur absente ou localhost est remplacée par l'URL
 * Vercel de production — aucune chaîne `localhost` n'est donc jamais
 * transmise à l'API Shopify (return_to du checkout, canonical, etc.).
 */
export function getAppUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ""
  ).trim();

  const isLocal = raw === "" || LOCAL_HOST_PATTERN.test(raw);

  if (process.env.NODE_ENV === "production" && isLocal) {
    return PRODUCTION_APP_URL;
  }

  return (raw || PRODUCTION_APP_URL).replace(/\/+$/, "");
}

/**
 * Formate un montant dans la devise de la boutique (EUR).
 * Utilisé pour le seuil de livraison, les messages du panier, la FAQ, etc.
 * Les montants entiers restent sans décimale (« 150 € »), les montants
 * fractionnaires conservent 2 décimales (« 9,90 € », « 21,25 € »).
 */
export function formatStoreAmount(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(value)) return "";
  return new Intl.NumberFormat(STORE_LOCALE, {
    style: "currency",
    currency: STORE_CURRENCY,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}