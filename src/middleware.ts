// src/middleware.ts
// Ce fichier est automatiquement détecté par Next.js — contrairement à proxy.ts
// Il s'exécute sur CHAQUE requête avant le rendu

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== Protection Admin =====
  // Toutes les pages /admin/* sauf /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get("admin_token")?.value;
    const validToken = process.env.ADMIN_SECRET_TOKEN;

    // Token absent ou invalide → redirection vers login
    if (!adminToken || !validToken || adminToken !== validToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ===== Protection Dashboard Créateur =====
  // Toutes les pages /dashboard/* sauf /dashboard/login et /dashboard/pending
  const publicDashboardPaths = ["/dashboard/login", "/dashboard/pending"];
  if (
    pathname.startsWith("/dashboard") &&
    !publicDashboardPaths.some((p) => pathname.startsWith(p))
  ) {
    const designerSession = request.cookies.get("designer_session")?.value;
    if (!designerSession) {
      return NextResponse.redirect(new URL("/dashboard/login", request.url));
    }
  }

  return NextResponse.next();
}

// Le matcher indique à Next.js quelles routes passer dans le middleware
export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
  ],
};
