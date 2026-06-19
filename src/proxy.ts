// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== Protection Admin =====
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get("admin_token")?.value;
    const validToken = process.env.ADMIN_SECRET_TOKEN;

    if (!adminToken || !validToken || adminToken !== validToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ===== Protection Dashboard Créateur =====
  if (pathname.startsWith("/dashboard")) {
    const designerSession = request.cookies.get("designer_session")?.value;
    if (!designerSession) {
      return NextResponse.redirect(
        new URL("/designers/apply", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
  ],
};