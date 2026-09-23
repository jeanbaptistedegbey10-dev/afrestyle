// src/lib/actions/admin.actions.ts
// PHASE 3 — modèle mono-marque : login/logout admin uniquement.
// Les actions créateurs (approve/reject/suspend) et Prisma ont été supprimés.
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  getAdminSecret,
  isAdminSecretConfigured,
  timingSafeCompare,
} from "@/lib/auth/adminAuth";

/**
 * Vérifie si la requête vient d'un admin authentifié.
 * Compare le cookie au secret en temps constant (anti timing-attack).
 * Redirige vers /admin/login si absent/invalide/non configuré
 * (le proxy affiche alors ?error=config-missing, sans boucle).
 */
export async function assertAdmin() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isAdminSecretConfigured() || !timingSafeCompare(adminToken ?? "", getAdminSecret())) {
    redirect("/admin/login");
  }
}

/**
 * Login admin — vérifie identifiant + mot de passe
 */
export async function adminLoginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { success: false, error: "Identifiant et mot de passe requis" };
  }

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    return { success: false, error: "Configuration admin manquante" };
  }

  // Délai artificiel pour ralentir les attaques par force brute
  await new Promise((r) => setTimeout(r, 600));

  // Comparaison sécurisée en temps constant (cf. lib/auth/adminAuth.ts)
  const isValid =
    timingSafeCompare(username, validUsername) &&
    timingSafeCompare(password, validPassword);

  if (!isValid) {
    return { success: false, error: "Identifiant ou mot de passe incorrect" };
  }

  // PHASE 2 (fix boucle /admin) — la session admin repose sur
  // ADMIN_SECRET_TOKEN, le MÊME secret que celui vérifié par le proxy
  // et assertAdmin(). Avant : on posait ADMIN_PASSWORD dans le cookie alors
  // que la garde comparait à ADMIN_SECRET_TOKEN → mismatch permanent.
  const sessionToken = getAdminSecret();
  if (!sessionToken) {
    return {
      success: false,
      error:
        "Configuration admin manquante : définissez ADMIN_SECRET_TOKEN dans .env.local (voir .env.example).",
    };
  }

  // Crée un cookie de session admin sécurisé
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 8, // 8 heures
    path:     "/",
  });

  return { success: true, error: null };
}

/**
 * Logout admin
 */
export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
