// src/app/api/seed/shopify-products/route.ts
// Crée les 30 produits manquants dans Shopify Admin API
//
// PHASE 2 — route de seed DEV-ONLY : protégée par le header
// `x-admin-secret: <ADMIN_SECRET_TOKEN>` (HTTP 401 sinon).
import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/shopify/adminClient";
import type { ShopifyUserError } from "@/lib/shopify/errors";
import { hasValidAdminHeader } from "@/lib/auth/adminAuth";

// Le token d'administration vient exclusivement de
// SHOPIFY_ADMIN_ACCESS_TOKEN, via le client admin serveur `adminFetch`.

interface ProductSeed {
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  description: string;
}

const PRODUCTS_TO_CREATE: ProductSeed[] = [
  // Adaeze Okafor (a déjà "Robe Cotonou Dusk")
  { title: "Ensemble Wax Architectural", vendor: "Adaeze Okafor", productType: "Vêtement", tags: ["femme", "pays-benin", "tissu-wax", "style-moderne"], description: "Ensemble deux-pièces aux coupes architecturales. Wax premium. Collection signature Okafor Studio." },
  { title: "Blouse Nuit Béninoise", vendor: "Adaeze Okafor", productType: "Vêtement", tags: ["femme", "pays-benin", "tissu-wax", "style-traditionnel"], description: "Blouse élégante en wax, parfaite pour les soirées. Broderies faites main." },
  
  // Kofi Mensah (a déjà "Veste Accra Royale")
  { title: "Hoodie Kente Revival", vendor: "Kofi Mensah", productType: "Vêtement", tags: ["homme", "pays-ghana", "tissu-kente", "Streetwear"], description: "Hoodie oversize en Kente tissé main. Collaboration avec les artisans ashantis." },
  { title: "Tote Bag Kente", vendor: "Kofi Mensah", productType: "Accessoire", tags: ["accessoire", "pays-ghana", "tissu-kente", "Streetwear"], description: "Tote bag en Kente réversible. Pièce unique tissée à Accra." },

  // Aminata Diallo (a déjà "Ensemble Dakar Flow")
  { title: "Robe Broderie Diamant", vendor: "Aminata Diallo", productType: "Vêtement", tags: ["femme", "pays-senegal", "tissu-bazin", "style-luxe"], description: "Robe longue en bazin riche. Broderie diamant artisanale. 40 heures de travail." },
  { title: "Éventail de Soie", vendor: "Aminata Diallo", productType: "Accessoire", tags: ["accessoire", "femme", "pays-senegal", "style-luxe"], description: "Éventail en soie brodé. Pièce de collection inspirée des cours royales." },

  // Chidi Okeke (a déjà "Agbada Lagos Night")
  { title: "Dashiki Premium", vendor: "Chidi Okeke", productType: "Vêtement", tags: ["homme", "pays-nigeria", "tissu-coton", "style-moderne"], description: "Dashiki contemporain en coton premium. Coupe slim, col mandarin. Fabriqué à Lagos." },
  { title: "Chemise Agbada Fusion", vendor: "Chidi Okeke", productType: "Vêtement", tags: ["homme", "pays-nigeria", "tissu-soie", "style-traditionnel"], description: "Chemise fusion qui marie l'Agbada traditionnel à une coupe moderne occidentale." },

  // Fatoumata Coulibaly (a déjà "Sac Bamako Heritage")
  { title: "Kimono Bogolan", vendor: "Fatoumata Coulibaly", productType: "Vêtement", tags: ["femme", "pays-mali", "tissu-bogolan", "style-traditionnel"], description: "Kimono en bogolan teint à la main. Terre du Mali. Chaque pièce est unique." },
  { title: "Écharpe Bogolan", vendor: "Fatoumata Coulibaly", productType: "Accessoire", tags: ["accessoire", "pays-mali", "tissu-bogolan", "unisexe"], description: "Écharpe en bogolan artisanal. Teinture naturelle à base de feuilles et d'écorces." },

  // Amara Traoré (a déjà "Parure Abidjan Gold")
  { title: "Collier Or Akan", vendor: "Amara Traoré", productType: "Accessoire", tags: ["accessoire", "femme", "pays-cote-divoire", "style-luxe"], description: "Collier en or 18 carats. Motifs akan traditionnels revisit撥s. Fait main à Abidjan." },
  { title: "Boucles d'oreilles Royales", vendor: "Amara Traoré", productType: "Accessoire", tags: ["accessoire", "femme", "pays-cote-divoire", "style-luxe"], description: "Boucles d'oreilles en bronze doré. Inspirées des parures royales baoulé." },

  // Zara Kone (0 produit)
  { title: "Robe Abidjan", vendor: "Zara Kone", productType: "Vêtement", tags: ["femme", "pays-cote-divoire", "tissu-wax", "style-moderne"], description: "Robe fluide en wax. Coupe moderne, taille ceinturée. La pièce signature de Zara." },
  { title: "Jupe Fendue Wax", vendor: "Zara Kone", productType: "Vêtement", tags: ["femme", "pays-cote-divoire", "tissu-wax", "style-moderne"], description: "Jupe crayon en wax avec fente latérale. Élégance abidjanaise." },
  { title: "Top Nouchi Chic", vendor: "Zara Kone", productType: "Vêtement", tags: ["femme", "pays-cote-divoire", "tissu-coton", "Streetwear"], description: "Top cropé en coton. Style Nouchi chic. Imprimé personnalisé." },

  // Kwame Asante (0 produit)
  { title: "Étole Kente Cérémonie", vendor: "Kwame Asante", productType: "Accessoire", tags: ["accessoire", "pays-ghana", "tissu-kente", "style-traditionnel"], description: "Étole en Kente tissé main. Motifs royaux ashantis. Pièce de cérémonie." },
  { title: "Pagne Kente Royal", vendor: "Kwame Asante", productType: "Vêtement", tags: ["femme", "homme", "pays-ghana", "tissu-kente", "style-traditionnel"], description: "Pagne Kente royal. 12 motifs traditionnels. Teinture naturelle." },
  { title: "Scarf Kente", vendor: "Kwame Asante", productType: "Accessoire", tags: ["accessoire", "pays-ghana", "tissu-kente", "unisexe"], description: "Foulard en Kente. Portable au quotidien. Tissé par les artisans de Kumasi." },

  // Nadia Benali (0 produit)
  { title: "Robe Coton Bio", vendor: "Nadia Benali", productType: "Vêtement", tags: ["femme", "pays-burkina-faso", "tissu-coton", "style-moderne"], description: "Robe en coton bio burkinabé. Teinture végétale. Mode éthique et durable." },
  { title: "Tunique Faso", vendor: "Nadia Benali", productType: "Vêtement", tags: ["femme", "pays-burkina-faso", "tissu-coton", "style-traditionnel"], description: "Tunique ample en coton bio. Broderies traditionnelles burkinabé." },
  { title: "Sac Tissé Main", vendor: "Nadia Benali", productType: "Accessoire", tags: ["accessoire", "pays-burkina-faso", "tissu-coton", "ethique"], description: "Sac tissé main par des artisanes burkinabé. Commerce équitable." },

  // Yannick Moukam (0 produit)
  { title: "T-shirt Urban Wax", vendor: "Yannick Moukam", productType: "Vêtement", tags: ["homme", "pays-cameroun", "tissu-wax", "Streetwear"], description: "T-shirt oversize en wax camerounais. Streetwear africain." },
  { title: "Sweat Cameroun", vendor: "Yannick Moukam", productType: "Vêtement", tags: ["homme", "pays-cameroun", "tissu-coton", "Streetwear"], description: "Sweat à capuche. Imprimé ndop. Inspiré des motifs traditionnels camerounais." },
  { title: "Casquette Ndop", vendor: "Yannick Moukam", productType: "Accessoire", tags: ["accessoire", "homme", "pays-cameroun", "Streetwear"], description: "Casquette streetwear avec motif ndop brodé. Édition limitée." },

  // Aisha Mwangi (0 produit)
  { title: "Robe Recyclée Art", vendor: "Aisha Mwangi", productType: "Vêtement", tags: ["femme", "pays-kenya", "ethique", "style-moderne"], description: "Robe en matériaux recyclés. Chaque pièce est unique. Art textile kenyan." },
  { title: "Pochette Kanga", vendor: "Aisha Mwangi", productType: "Accessoire", tags: ["accessoire", "femme", "pays-kenya", "tissu-kanga", "ethique"], description: "Pochette en Kanga upcyclé. Proverbe swahili imprimé. Sac double face." },
  { title: "Chemise Safari", vendor: "Aisha Mwangi", productType: "Vêtement", tags: ["femme", "homme", "pays-kenya", "ethique", "unisexe"], description: "Chemise unisexe en coton bio kenyan. Coupe safari moderne." },

  // Moussa Sow (0 produit)
  { title: "Costume Sur-Mesure", vendor: "Moussa Sow", productType: "Vêtement", tags: ["homme", "pays-guinee", "style-luxe", "sur-mesure"], description: "Costume trois-pièces sur-mesure. Tissu premium. Confection artisanale à Conakry." },
  { title: "Blanc Guinée", vendor: "Moussa Sow", productType: "Vêtement", tags: ["homme", "pays-guinee", "coton", "style-traditionnel"], description: "Chemise blanche en coton guinéen. Coupe classique, broderie fine au col." },
  { title: "Veston Traditionnel", vendor: "Moussa Sow", productType: "Vêtement", tags: ["homme", "pays-guinee", "tissu-wax", "style-traditionnel"], description: "Veston en wax guinéen. Doublure en soie. Coupe ajustée moderne." },
];

// Admin API 2026-07 : `productCreate(product: ProductCreateInput!)`.
// `ProductInput.options` et `ProductInput.variants` n'existent plus :
//   • les options passent par `productOptions` (OptionCreateInput) ;
//   • la variante par défaut est créée automatiquement par Shopify ;
//   • son prix se règle avec `productVariantsBulkUpdate`.
const SEED_PRODUCT_CREATE_MUTATION = `
  mutation SeedProductCreate($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id
        handle
        title
        vendor
        variants(first: 1) {
          nodes {
            id
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const SEED_VARIANT_PRICE_MUTATION = `
  mutation SeedVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const SEED_VARIANT_PRICE = "89.00";
const SEED_SIZES = ["S", "M", "L", "XL"];
const SEED_COLORS = ["Naturel", "Noir", "Or"];

type SeedProductResult = {
  created: boolean;
  productId: string | null;
  warnings: string[];
  error: string | null;
};

async function createShopifyProduct(
  product: ProductSeed,
): Promise<SeedProductResult> {
  const warnings: string[] = [];

  const payload = await adminFetch<{
    productCreate: {
      product: { id: string; variants: { nodes: { id: string }[] } | null } | null;
      userErrors: ShopifyUserError[];
    };
  }>({
    query: SEED_PRODUCT_CREATE_MUTATION,
    variables: {
      product: {
        title: product.title,
        vendor: product.vendor,
        productType: product.productType,
        tags: product.tags,
        descriptionHtml: `<p>${product.description}</p>`,
        status: "ACTIVE",
        productOptions: [
          { name: "Taille", values: SEED_SIZES.map((name) => ({ name })) },
          { name: "Couleur", values: SEED_COLORS.map((name) => ({ name })) },
        ],
      },
    },
  });

  const created = payload.productCreate.product;

  if (!created || payload.productCreate.userErrors.length > 0) {
    return {
      created: false,
      productId: null,
      warnings,
      error:
        payload.productCreate.userErrors
          .map((userError) => userError.message)
          .join(", ") || "productCreate n'a retourné aucun produit",
    };
  }

  const defaultVariantId = created.variants?.nodes?.[0]?.id;

  if (!defaultVariantId) {
    warnings.push(
      `Prix ${SEED_VARIANT_PRICE} non appliqué (variante par défaut introuvable).`,
    );
    return { created: true, productId: created.id, warnings, error: null };
  }

  const pricePayload = await adminFetch<{
    productVariantsBulkUpdate: { userErrors: ShopifyUserError[] };
  }>({
    query: SEED_VARIANT_PRICE_MUTATION,
    variables: {
      productId: created.id,
      variants: [{ id: defaultVariantId, price: SEED_VARIANT_PRICE }],
    },
  });

  if (pricePayload.productVariantsBulkUpdate.userErrors.length > 0) {
    warnings.push(
      `Prix non appliqué : ${pricePayload.productVariantsBulkUpdate.userErrors
        .map((userError) => userError.message)
        .join(", ")}`,
    );
  }

  return { created: true, productId: created.id, warnings, error: null };
}

export async function GET(request: Request) {
  // ── Garde dev/test : header x-admin-secret requis ─────────────────────
  if (!hasValidAdminHeader(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const results: string[] = [];

  // Récupère les produits existants (Admin API GraphQL)
  const existingProducts = await adminFetch<{
    products: { nodes: { title: string; vendor: string }[] };
  }>({
    query: `{ products(first: 100) { nodes { title vendor } } }`,
  });

  const existingTitles = new Set(
    existingProducts.products.nodes.map((node) => node.title),
  );

  let created = 0;
  let skipped = 0;

  for (const product of PRODUCTS_TO_CREATE) {
    if (existingTitles.has(product.title)) {
      results.push(`⏭️  "${product.title}" — existe déjà`);
      skipped++;
      continue;
    }

    const result = await createShopifyProduct(product);
    
    if (result.created) {
      results.push(`✅  "${product.title}" — créé (${product.vendor})`);
      created++;
    } else {
      results.push(`❌  "${product.title}" — erreur: ${result.error ?? "inconnue"}`);
    }

    for (const warning of result.warnings) {
      results.push(`⚠️  "${product.title}" — ${warning}`);
    }

    // Petit delai anti rate-limit.
    await new Promise((r) => setTimeout(r, 500));
  }

  // PHASE 3 : aucune association Prisma, Shopify uniquement.

  return NextResponse.json({
    success: true,
    message: `${created} produits créés, ${skipped} déjà existants`,
    details: results,
  });
}