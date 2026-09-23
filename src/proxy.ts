// src/proxy.ts
// Next.js 16 : convention renommée de `middleware.ts` vers `proxy.ts`
// (cf. https://nextjs.org/docs/messages/middleware-to-proxy).
// Il s'exécute sur CHAQUE requête avant le rendu.
//
// PHASE 3 — modèle mono-marque : la garde couvre uniquement /admin/*
// (le bloc multivendeur /dashboard/* a été supprimé).
//   • /admin/* (sauf /admin/login) exige le cookie `admin_token` OU le header
//     `x-admin-secret`, égaux à ADMIN_SECRET_TOKEN ;
//   • si le secret n'est pas configuré, redirection PROPRE vers /admin/login
//     avec ?error=config-missing (la page de login n'est pas gardée →
//     aucune boucle de redirection infinie n'est possible).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SECRET_HEADER,
  isAdminSecretConfigured,
  isValidAdminCredential,
} from "@/lib/auth/adminAuth";

function adminLoginRedirect(request: NextRequest, configMissing: boolean) {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  if (configMissing) {
    loginUrl.searchParams.set("error", "config-missing");
  }
  return NextResponse.redirect(loginUrl);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== Protection Admin =====
  // Toutes les pages /admin/* sauf /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    // Fallback anti-boucle : secret non configuré → login avec erreur explicite.
    if (!isAdminSecretConfigured()) {
      return adminLoginRedirect(request, true);
    }

    // Token absent ou invalide (cookie OU header) → redirection vers login
    const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(ADMIN_SECRET_HEADER);
    if (
      !isValidAdminCredential(cookieToken) &&
      !isValidAdminCredential(headerToken)
    ) {
      return adminLoginRedirect(request, false);
    }
  }

  return NextResponse.next();
}

// Le matcher indique à Next.js quelles routes passer dans le proxy
export const config = {
  matcher: ["/admin/:path*"],
};
