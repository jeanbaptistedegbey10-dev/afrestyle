// src/lib/actions/admin.actions.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "admin_token";

/**
 * Login admin — vérifie le mot de passe secret
 */
export async function adminLoginAction(formData: FormData) {
  const password = formData.get("password") as string;

  if (!password) {
    return { success: false, error: "Mot de passe requis" };
  }

  // Compare avec le token secret stocké dans les env variables
  // En production, utilise bcrypt pour hasher le mot de passe
  const validToken = process.env.ADMIN_SECRET_TOKEN;

  if (!validToken) {
    return { success: false, error: "Configuration admin manquante" };
  }

  if (password !== validToken) {
    // Délai artificiel pour éviter les attaques par force brute
    await new Promise((r) => setTimeout(r, 1000));
    return { success: false, error: "Mot de passe incorrect" };
  }

  // Crée un cookie de session admin sécurisé
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, validToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 heures
    path: "/",
  });

  return { success: true, error: null };
}

/**
 * Logout admin
 */
export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/**
 * Valide un créateur
 */
export async function approveDesigner(formData: FormData) {
  const designerId = formData.get("designerId") as string;
  if (!designerId) return;

  await db.designer.update({
    where: { id: designerId },
    data: {
      status: "APPROVED",
      applications: {
        updateMany: {
          where: { designerId },
          data: { reviewedAt: new Date() },
        },
      },
    },
  });

  revalidatePath("/admin/designers");
}

/**
 * Refuse un créateur
 */
export async function rejectDesigner(formData: FormData) {
  const designerId = formData.get("designerId") as string;
  const reason = formData.get("reason") as string;
  if (!designerId) return;

  await db.designer.update({
    where: { id: designerId },
    data: {
      status: "REJECTED",
      rejectionReason: reason || "Ne correspond pas aux critères actuels",
    },
  });

  revalidatePath("/admin/designers");
}