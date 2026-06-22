// src/app/api/seed/product-images/route.ts
// Génère et upload les images des produits Shopify
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const SHOPIFY_STORE = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const ADMIN_API = `https://${SHOPIFY_STORE}/admin/api/2024-01`;

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

export async function GET() {
  try {
    console.log("🎨 Génération des images produits...\n");

    // Récupère tous les produits
    const res = await fetch(`${ADMIN_API}/products.json?limit=250`, {
      headers: { "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN },
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

      // Upload en base64
      const base64 = Buffer.from(svg).toString("base64");
      const imageRes = await fetch(`${ADMIN_API}/products/${product.id}/images.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN },
        body: JSON.stringify({
          image: { attachment: base64, filename: fileName, alt: product.title },
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