// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protection de la route admin
  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get("admin_token")?.value;
    const validToken = process.env.ADMIN_SECRET_TOKEN;

    if (!adminToken || adminToken !== validToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protection du dashboard créateur
  if (pathname.startsWith("/dashboard")) {
    const designerSession = request.cookies.get("designer_session")?.value;
    if (!designerSession) {
      return NextResponse.redirect(new URL("/designers/apply", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};