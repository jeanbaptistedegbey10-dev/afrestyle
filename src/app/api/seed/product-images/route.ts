// src/app/api/seed/product-images/route.ts
// Génère et upload les images des produits Shopify
//
// PHASE 2 — route de seed DEV-ONLY : protégée par le header
// `x-admin-secret: <ADMIN_SECRET_TOKEN>` (HTTP 401 sinon).
import { NextResponse } from "next/server";
import { getShopifyStoreDomain } from "@/lib/shopify/version";
import { hasValidAdminHeader } from "@/lib/auth/adminAuth";
import { buildImageAlt, type ProductImageContext } from "@/lib/shopify/image-pipeline";

// Elle utilise volontairement l'Admin API **REST legacy** (/products.json,
// /images.json) : ces endpoints ne font pas partie de l'API supportée en
// 2026-07 (REST Admin déprécié depuis 2024-10). La version moderne passe par
// `stagedUploadsCreate` + `productCreateMedia` en GraphQL Admin.
//
// Le token d'administration vient exclusivement de SHOPIFY_ADMIN_ACCESS_TOKEN.
const ADMIN_REST_API = `https://${getShopifyStoreDomain()}/admin/api/2024-01`;

const COLORS = [
  ["#2d1535", "#0d2218"], ["#0a2010", "#201408"], ["#201408", "#0a1820"],
  ["#1a2010", "#20100a"], ["#201808", "#081820"], ["#201510", "#102015"],
  ["#1a0820", "#082010"], ["#201020", "#102010"], ["#082010", "#201008"],
  ["#102020", "#201020"], ["#1a2015", "#151020"], ["#201510", "#102015"],
];

function generateProductSVG(title: string, vendor: string, price: string, index: number) {
  const c = COLORS[index % COLORS.length];
  const initials = title.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c[0]}"/>
      <stop offset="100%" style="stop-color:${c[1]}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect x="40" y="40" width="720" height="720" fill="none" stroke="rgba(212,175,55,0.15)" stroke-width="1"/>
  <circle cx="400" cy="320" r="120" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.25)" stroke-width="2"/>
  <text x="400" y="360" text-anchor="middle" font-family="serif" font-size="80" fill="#D4AF37" font-weight="bold">${initials}</text>
  <text x="400" y="520" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#F5F0E8" font-weight="500">${title}</text>
  <text x="400" y="570" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#D4AF37">${vendor}</text>
  <text x="400" y="630" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#F5F0E8" font-weight="bold">€${price}</text>
  <text x="400" y="700" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#D4CCBA" letter-spacing="4">AFROSTYLE</text>
</svg>`;
}

export async function GET(request: Request) {
  // ── Garde dev/test : header x-admin-secret requis ─────────────────────
  if (!hasValidAdminHeader(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: "SHOPIFY_ADMIN_ACCESS_TOKEN est manquant." },
        { status: 500 },
      );
    }

    console.log("🎨 Génération des images produits...\n");

    // Récupère tous les produits
    const res = await fetch(`${ADMIN_REST_API}/products.json?limit=250`, {
      headers: { "X-Shopify-Access-Token": adminToken },
    });
    const data = await res.json();
    const products = data.products ?? [];
    console.log(`📦 ${products.length} produits trouvés\n`);

    let updated = 0;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const price = product.variants?.[0]?.price ?? "89.00";
      const svg = generateProductSVG(product.title, product.vendor, price, i);
      const fileName = `product-${product.id}.svg`;

      // `alt` descriptif et factuel (brief éditorial) — jamais le seul titre.
      const context: ProductImageContext = {
        id: String(product.id),
        title: product.title,
        vendor: product.vendor ?? null,
        productType: product.product_type ?? null,
        tags: Array.isArray(product.tags) ? product.tags : String(product.tags ?? "").split(",").map((tag: string) => tag.trim()).filter(Boolean),
      };
      const alt = buildImageAlt(context, { kind: "generated", price });

      // Upload en base64
      const base64 = Buffer.from(svg).toString("base64");
      const imageRes = await fetch(`${ADMIN_REST_API}/products/${product.id}/images.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
        body: JSON.stringify({
          image: { attachment: base64, filename: fileName, alt },
        }),
      });

      const imageData = await imageRes.json();
      if (imageData.image) {
        console.log(`✅  "${product.title}" — image uploadée ✓`);
        updated++;
      } else {
        console.log(`❌  "${product.title}" — erreur: ${JSON.stringify(imageData.errors)}`);
      }

      await new Promise(r => setTimeout(r, 300));
    }

    return NextResponse.json({
      success: true,
      message: `${updated}/${products.length} images générées et uploadées`,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}