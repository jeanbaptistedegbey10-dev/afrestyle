// src/lib/actions/designer.actions.ts
"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

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

  if (!firstName || !lastName || !email || !brandName || !country || !bio) {
    return { success: false, error: "Tous les champs obligatoires doivent être remplis" };
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

    // Crée le créateur en statut PENDING
    const designer = await db.designer.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        brandName,
        handle,
        country,
        specialty,
        since,
        bio,
        story: bio, // On utilisera la version longue plus tard
        shopifyVendorName: brandName, // Convention: même nom dans Shopify
        status: "PENDING",
        applications: {
          create: {
            motivation,
            instagramUrl: instagramUrl || null,
            websiteUrl: websiteUrl || null,
            portfolioUrl: portfolioUrl || null,
          },
        },
      },
    });

    // TODO: envoyer un email de confirmation (Resend)
    // await sendConfirmationEmail(designer.email, designer.firstName);

    return { success: true, error: null };
  } catch (error) {
    console.error("submitApplication error:", error);
    return { success: false, error: "Erreur serveur — réessaie plus tard" };
  }
}

/**
 * Connecte un créateur (auth séparée de l'auth client)
 */
export async function loginDesigner(formData: FormData) {
  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;

  // TODO: implémenter l'authentification créateur
  // Pour l'instant, on utilise un système de magic link par email

  return { success: false, error: "Non implémenté" };
}

/**
 * Récupère le profil du créateur connecté
 */
export async function getCurrentDesigner() {
  const cookieStore = await cookies();
  const token = cookieStore.get("designer_session")?.value;
  if (!token) return null;

  const session = await db.designerSession.findUnique({
    where: { token },
    include: { designer: true },  // Note: relation à ajouter au schéma
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.designer;
}