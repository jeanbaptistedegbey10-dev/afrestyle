// src/lib/actions/designer.actions.ts
"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const DESIGNER_SESSION_COOKIE = "designer_session";
const SESSION_DURATION_DAYS = 7;

// ─────────────────────────────────────────────────────────────────────
//  APPLICATION
// ─────────────────────────────────────────────────────────────────────

/**
 * Soumet une candidature créateur
 */
export async function submitApplication(formData: FormData) {
  const firstName    = formData.get("firstName") as string;
  const lastName     = formData.get("lastName") as string;
  const email        = formData.get("email") as string;
  const phone        = formData.get("phone") as string;
  const brandName    = formData.get("brandName") as string;
  const country      = formData.get("country") as string;
  const specialty    = formData.get("specialty") as string;
  const since        = parseInt(formData.get("since") as string);
  const bio          = formData.get("bio") as string;
  const motivation   = formData.get("motivation") as string;
  const instagramUrl = formData.get("instagramUrl") as string;
  const websiteUrl   = formData.get("websiteUrl") as string;
  const portfolioUrl = formData.get("portfolioUrl") as string;
  const password         = formData.get("password") as string;
  const passwordConfirm  = formData.get("passwordConfirm") as string;
  const avatarUrl        = formData.get("avatarUrl") as string;

  if (!firstName || !lastName || !email || !brandName || !country || !bio) {
    return { success: false, error: "Tous les champs obligatoires doivent être remplis" };
  }

  if (!password || password.length < 8) {
    return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères" };
  }

  if (password !== passwordConfirm) {
    return { success: false, error: "Les mots de passe ne correspondent pas" };
  }

  try {
    // Vérifie si l'email existe déjà
    const existing = await db.designer.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "Cette adresse email est déjà utilisée" };
    }

    // Génère un handle unique depuis le nom de la marque
    const baseHandle = brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Vérifie unicité du handle
    let handle = baseHandle;
    let counter = 1;
    while (await db.designer.findUnique({ where: { handle } })) {
      handle = `${baseHandle}-${counter++}`;
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Crée le créateur en statut PENDING
    await db.designer.create({
      data: {
        firstName,
        lastName,
        email,
        phone:             phone || null,
        brandName,
        handle,
        country,
        specialty:         specialty || "Mode",
        since:             isNaN(since) ? new Date().getFullYear() : since,
        bio,
        story:             bio,
        avatarUrl:         avatarUrl || null,
        shopifyVendorName: brandName,
        status:            "PENDING",
        passwordHash,
        applications: {
          create: {
            motivation,
            instagramUrl: instagramUrl || null,
            websiteUrl:   websiteUrl   || null,
            portfolioUrl: portfolioUrl || null,
          },
        },
      },
    });

    return { success: true, error: null };
  } catch (error) {
    console.error("submitApplication error:", error);
    return { success: false, error: "Erreur serveur — réessaie plus tard" };
  }
}

// ─────────────────────────────────────────────────────────────────────
//  AUTHENTIFICATION
// ─────────────────────────────────────────────────────────────────────

/**
 * Connecte un créateur avec email + mot de passe
 */
export async function loginDesigner(formData: FormData) {
  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email et mot de passe requis" };
  }

  try {
    const designer = await db.designer.findUnique({ where: { email } });

    if (!designer || !designer.passwordHash) {
      // Délai pour éviter le timing attack (ne pas révéler si l'email existe)
      await new Promise((r) => setTimeout(r, 600));
      return { success: false, error: "Email ou mot de passe incorrect" };
    }

    const valid = await bcrypt.compare(password, designer.passwordHash);
    if (!valid) {
      return { success: false, error: "Email ou mot de passe incorrect" };
    }

    // Crée une session
    const token = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    await db.designerSession.create({
      data: { token, designerId: designer.id, expiresAt },
    });

    // Stocke le token dans un cookie httpOnly sécurisé
    const cookieStore = await cookies();
    cookieStore.set(DESIGNER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires:  expiresAt,
      path:     "/",
    });

    return { success: true, error: null, status: designer.status };
  } catch (error) {
    console.error("loginDesigner error:", error);
    return { success: false, error: "Erreur serveur — réessaie plus tard" };
  }
}

/**
 * Déconnecte le créateur
 */
export async function logoutDesigner() {
  const cookieStore = await cookies();
  const token = cookieStore.get(DESIGNER_SESSION_COOKIE)?.value;

  if (token) {
    // Supprime la session en base
    try {
      await db.designerSession.delete({ where: { token } });
    } catch {
      // Session déjà expirée ou inexistante — pas critique
    }
    cookieStore.delete(DESIGNER_SESSION_COOKIE);
  }

  redirect("/designers/apply");
}

/**
 * Récupère le profil du créateur connecté (depuis Server Component)
 */
export async function getCurrentDesigner() {
  const cookieStore = await cookies();
  const token = cookieStore.get(DESIGNER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.designerSession.findUnique({
    where: { token },
    include: { designer: true },
  });

  // Session expirée
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      // Nettoyage en base
      try {
        await db.designerSession.delete({ where: { token } });
      } catch { /* ignore */ }
    }
    return null;
  }

  return session.designer;
}