// src/lib/auth/adminAuth.ts
// ─────────────────────────────────────────────────────────────────────────────
//  PHASE 2 — Garde d'authentification admin : SOURCE UNIQUE DE VÉRITÉ.
//
//  Utilisée par :
//    • src/proxy.ts                        → garde des pages /admin/*
//    • src/lib/actions/admin.actions.ts   → assertAdmin() (server actions)
//    • src/app/api/seed/*/route.ts        → garde des routes de seed dev/test
//    • src/app/api/test-shopify/route.ts  → garde de la route de diagnostic
//
//  Règle unique : TOUT passe par ADMIN_SECRET_TOKEN.
//    • Le login admin (adminLoginAction) écrit le cookie `admin_token`
//      avec EXACTEMENT cette valeur (jamais ADMIN_PASSWORD).
//    • Le proxy et assertAdmin() comparent le cookie à cette valeur.
//    • Les routes API dev/test exigent le header `x-admin-secret` égal
//      à cette valeur, sinon HTTP 401 Unauthorized.
//
//  ⚠️ Ce module est volontairement SANS dépendance Next.js ni `node:crypto`
//  afin de rester importable depuis le proxy (runtime Edge) : la
//  comparaison en temps constant est implémentée en pur JS.
// ─────────────────────────────────────────────────────────────────────────────

/** Nom du cookie de session admin (httpOnly, posé au login). */
export const ADMIN_COOKIE_NAME = "admin_token";

/** Header exigé par les routes API dev/test (/api/seed/*, /api/test-shopify). */
export const ADMIN_SECRET_HEADER = "x-admin-secret";

/**
 * Secret de session admin (serveur uniquement, jamais commité).
 * Génération : `node -e "console.log(require('crypto').randomBytes(32).toString('hex)')"`
 * ou `openssl rand -hex 32`. 32 octets minimum, DISTINCT du mot de passe.
 */
export function getAdminSecret(): string {
  return process.env.ADMIN_SECRET_TOKEN?.trim() ?? "";
}

/**
 * `false` tant que le secret n'est pas défini dans l'environnement.
 * Les gardes utilisent ce cas pour un fallback « config manquante »
 * (jamais de boucle de redirection infinie).
 */
export function isAdminSecretConfigured(): boolean {
  return getAdminSecret().length > 0;
}

/**
 * Comparaison en temps constant (anti timing-attack), en pur JS
 * pour rester compatible Edge (pas de `node:crypto` ici).
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length === 0 || b.length === 0) return false;
  let diff = a.length === b.length ? 0 : 1;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

/**
 * `true` si le candidat (valeur du cookie `admin_token` OU du header
 * `x-admin-secret`) correspond au secret configuré.
 */
export function isValidAdminCredential(
  candidate: string | null | undefined,
): boolean {
  if (!candidate || !isAdminSecretConfigured()) return false;
  return timingSafeCompare(candidate, getAdminSecret());
}

/**
 * Garde pour les routes API dev/test : exige le header `x-admin-secret`.
 * Retourne `true` si la requête est autorisée, `false` sinon (→ répondre 401).
 * Log serveur explicite quand le secret n'est pas configuré (sans fuite client).
 */
export function hasValidAdminHeader(request: Request): boolean {
  if (!isAdminSecretConfigured()) {
    console.error(
      "[adminAuth] ADMIN_SECRET_TOKEN non configuré — accès dev/test refusé (voir .env.example).",
    );
    return false;
  }
  return isValidAdminCredential(request.headers.get(ADMIN_SECRET_HEADER));
}
