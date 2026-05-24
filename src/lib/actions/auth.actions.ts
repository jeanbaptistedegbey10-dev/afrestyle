// src/lib/actions/auth.actions.ts
// Les Server Actions = fonctions qui tournent côté serveur
// appelées directement depuis les composants client
// En entretien: "Server Actions remplacent les API Routes pour
// les mutations simples — moins de boilerplate, même sécurité"
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createCustomer,
  loginCustomer,
  logoutCustomer,
  getCustomer,
} from "@/lib/shopify/customer";

// Nom du cookie qui stocke le token
const CUSTOMER_TOKEN_COOKIE = "shopify_customer_token";

/**
 * Inscription
 */
export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  // Validation basique
  if (!email || !password || !firstName || !lastName) {
    return { success: false, error: "Tous les champs sont requis" };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: "Le mot de passe doit contenir au moins 8 caractères",
    };
  }

  try {
    // 1. Crée le compte Shopify
    const { success, errors } = await createCustomer({
      email, password, firstName, lastName,
    });

    if (!success) {
      const errorMsg = errors[0]?.message ?? "Erreur lors de la création du compte";
      // Traduit les erreurs Shopify en français
      if (errorMsg.includes("already taken")) {
        return { success: false, error: "Cette adresse email est déjà utilisée" };
      }
      return { success: false, error: errorMsg };
    }

    // 2. Connecte automatiquement après inscription
    const { accessToken, expiresAt } = await loginCustomer({ email, password });

    if (accessToken) {
      const cookieStore = await cookies();
      cookieStore.set(CUSTOMER_TOKEN_COOKIE, accessToken, {
        httpOnly: true,        // Inaccessible via JS — protection XSS
        secure: process.env.NODE_ENV === "production", // HTTPS en prod
        sameSite: "lax",       // Protection CSRF
        expires: expiresAt ? new Date(expiresAt) : undefined,
        path: "/",
      });
    }

    return { success: true, error: null };
  } catch {
    return { success: false, error: "Erreur serveur — réessaie plus tard" };
  }
}

/**
 * Connexion
 */
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email et mot de passe requis" };
  }

  try {
    const { accessToken, expiresAt, errors } = await loginCustomer({
      email,
      password,
    });

    if (!accessToken || errors.length > 0) {
      return {
        success: false,
        error: "Email ou mot de passe incorrect",
      };
    }

    // Stocke le token dans un cookie httpOnly sécurisé
    const cookieStore = await cookies();
    cookieStore.set(CUSTOMER_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt ? new Date(expiresAt) : undefined,
      path: "/",
    });

    return { success: true, error: null };
  } catch {
    return { success: false, error: "Erreur serveur — réessaie plus tard" };
  }
}

/**
 * Déconnexion
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;

  if (token) {
    await logoutCustomer(token);
    cookieStore.delete(CUSTOMER_TOKEN_COOKIE);
  }

  redirect("/");
}

/**
 * Récupère le client connecté (depuis Server Component)
 */
export async function getCurrentCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;
  if (!token) return null;
  return getCustomer(token);
}

/**
 * Récupère le token (pour les mutations client)
 */
export async function getCustomerToken() {
  const cookieStore = await cookies();
  return cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value ?? null;
}