// src/lib/shopify/version.ts
// ────────────────────────────────────────────────────────────────────────────
//  SOURCE DE VÉRITÉ UNIQUE de la version d'API Shopify pour tout le projet.
//
//  ⚠️  Aucune URL Shopify ne doit être écrite "en dur" ailleurs : les deux
//      clients (storefrontClient / adminClient) construisent leurs endpoints
//      avec les helpers de ce fichier.
//
//  Pourquoi épingler une version ?
//   • Shopify sort une version stable tous les 3 mois :
//     2026-01, 2026-04, 2026-07, 2026-10 …
//   • chaque version est supportée ~12 mois, puis retirée.
//   • viser une version RETIRÉE ne lève AUCUNE erreur : Shopify fait un
//     « fall forward » silencieux vers la plus ancienne version encore servie
//     (constaté sur cette boutique : /api/2024-01/… répond en 2025-10).
//     C'est pour ça que les clients vérifient l'en-tête `X-Shopify-API-Version`.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Version stable de l'API Shopify ciblée par l'application.
 *
 * Vérifié le 2026-09-21 sur la boutique `afrestyle-dev.myshopify.com` :
 * `POST /api/2026-07/graphql.json` → HTTP 200 + `X-Shopify-API-Version: 2026-07`.
 * Prochaine version à surveiller : 2026-10 (à passer ici, un seul endroit).
 */
export const SHOPIFY_API_VERSION = "2026-07";

/** En-tête renvoyé par Shopify : version réellement utilisée pour la réponse. */
export const SHOPIFY_API_VERSION_HEADER = "x-shopify-api-version";

/**
 * Domaine de la boutique, normalisé en `<handle>.myshopify.com`.
 * Accepte `afrestyle-dev` comme `afrestyle-dev.myshopify.com`.
 */
export function getShopifyStoreDomain(): string {
  const configured = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim() ?? "";
  const domain = configured.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  if (!domain) {
    throw new Error(
      "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN est manquant. " +
        "Renseignez-le dans .env.local (ex. afrestyle-dev.myshopify.com).",
    );
  }

  return domain.includes(".") ? domain : `${domain}.myshopify.com`;
}

/** Endpoint GraphQL public — Storefront API (catalogue, panier, clients). */
export function getStorefrontEndpoint(): string {
  return `https://${getShopifyStoreDomain()}/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

/** Endpoint GraphQL serveur — Admin API (produits, publications, commandes). */
export function getAdminEndpoint(): string {
  return `https://${getShopifyStoreDomain()}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

/**
 * Détecte le « fall forward » : Shopify répond alors avec une autre version
 * que celle demandée — en HTTP 200, donc totalement invisible côté appelant.
 * On le signale dans les logs dès qu'on n'est pas en production.
 */
export function checkApiVersionHeader(
  response: Response,
  source: "storefront" | "admin",
): void {
  const servedVersion = response.headers.get(SHOPIFY_API_VERSION_HEADER);

  if (!servedVersion || servedVersion === SHOPIFY_API_VERSION) return;
  if (process.env.NODE_ENV === "production") return;

  console.warn(
    `[shopify:${source}] version demandée ${SHOPIFY_API_VERSION} mais servie ${servedVersion} ` +
      `— fall-forward Shopify (version retirée ?). Mettre à jour SHOPIFY_API_VERSION.`,
  );
}
