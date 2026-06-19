// src/lib/actions/admin.actions.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

const ADMIN_COOKIE = "admin_token";

/**
 * Vérifie si la requête vient d'un admin authentifié
 * Utilise timingSafeEqual pour prévenir les timing attacks
 */
async function assertAdmin() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const validToken = process.env.ADMIN_SECRET_TOKEN;

  if (!adminToken || !validToken) {
    redirect("/admin/login");
  }

  // timingSafeEqual évite les attaques par timing (comparaison en temps constant)
  const a = Buffer.from(adminToken);
  const b = Buffer.from(validToken);
  const isValid =
    a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!isValid) {
    redirect("/admin/login");
  }
}

/**
 * Login admin — vérifie le mot de passe secret
 */
export async function adminLoginAction(formData: FormData) {
  const password = formData.get("password") as string;

  if (!password) {
    return { success: false, error: "Mot de passe requis" };
  }

  const validToken = process.env.ADMIN_SECRET_TOKEN;

  if (!validToken) {
    return { success: false, error: "Configuration admin manquante" };
  }

  // Délai artificiel pour ralentir les attaques par force brute
  await new Promise((r) => setTimeout(r, 600));

  // Comparaison sécurisée en temps constant
  let isValid = false;
  try {
    const a = Buffer.from(password.padEnd(validToken.length));
    const b = Buffer.from(validToken);
    isValid = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    isValid = false;
  }

  if (!isValid) {
    return { success: false, error: "Mot de passe incorrect" };
  }

  // Crée un cookie de session admin sécurisé
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, validToken, {
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
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/**
 * Valide un créateur — requiert d'être admin
 */
export async function approveDesigner(formData: FormData) {
  await assertAdmin();

  const designerId = formData.get("designerId") as string;
  if (!designerId) return;

  await db.designer.update({
    where: { id: designerId },
    data: {
      status: "APPROVED",
      applications: {
        updateMany: {
          where: { designerId },
          data:  { reviewedAt: new Date() },
        },
      },
    },
  });

  revalidatePath("/admin/designers");
}

/**
 * Refuse un créateur — requiert d'être admin
 */
export async function rejectDesigner(formData: FormData) {
  await assertAdmin();

  const designerId = formData.get("designerId") as string;
  const reason     = formData.get("reason")     as string;
  if (!designerId) return;

  await db.designer.update({
    where: { id: designerId },
    data: {
      status:          "REJECTED",
      rejectionReason: reason || "Ne correspond pas aux critères actuels",
    },
  });

  revalidatePath("/admin/designers");
}

/**
 * Suspend un créateur — requiert d'être admin
 */
export async function suspendDesigner(formData: FormData) {
  await assertAdmin();

  const designerId = formData.get("designerId") as string;
  const reason     = formData.get("reason")     as string;
  if (!designerId) return;

  await db.designer.update({
    where: { id: designerId },
    data: {
      status:          "SUSPENDED",
      rejectionReason: reason || null,
    },
  });

  revalidatePath("/admin/designers");
}