// src/app/api/seed/shopify-products/route.ts
// Crée les 30 produits manquants dans Shopify Admin API
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "REPLACE_WITH_YOUR_ADMIN_TOKEN";
const SHOPIFY_STORE = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "afrestyle-dev";
const ADMIN_API = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/graphql.json`;

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

const CREATE_PRODUCT_MUTATION = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        handle
        title
        vendor
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function createShopifyProduct(product: ProductSeed) {
  const variables = {
    input: {
      title: product.title,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags.join(", "),
      descriptionHtml: `<p>${product.description}</p>`,
      status: "ACTIVE" as const,
      published: true,
      options: [
        { name: "Taille", values: ["S", "M", "L", "XL"] },
        { name: "Couleur", values: ["Naturel", "Noir", "Or"] },
      ],
      variants: [
        { optionValues: [{ optionName: "Taille", name: "M" }, { optionName: "Couleur", name: "Naturel" }], price: "89.00", inventoryQuantities: [{ availableQuantity: 10, locationId: null }] },
      ],
    },
  };

  const res = await fetch(ADMIN_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify({ query: CREATE_PRODUCT_MUTATION, variables }),
  });

  const data = await res.json();
  return data;
}

export async function GET() {
  const results: string[] = [];

  // Récupère les produits existants
  const existingRes = await fetch(ADMIN_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify({
      query: `{ products(first: 100) { edges { node { title vendor } } } }`,
    }),
  });
  const existingData = await existingRes.json();
  const existingTitles = new Set(
    existingData.data?.products?.edges?.map((e: any) => e.node.title) ?? []
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
    
    if (result.data?.productCreate?.product) {
      results.push(`✅  "${product.title}" — créé (${product.vendor})`);
      created++;
    } else {
      const errors = result.data?.productCreate?.userErrors ?? [];
      results.push(`❌  "${product.title}" — erreur: ${errors.map((e: any) => e.message).join(", ")}`);
    }

    // Petit délai pour éviter les rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  // Associe les produits Shopify aux designers dans la base
  // Pour chaque designer, on cherche les produits avec son vendor
  // Associe les produits Shopify aux designers dans la base
  console.log("🔗 Association des produits aux designers...");
  const designers = await db.designer.findMany({ where: { status: "APPROVED" } });
  
  for (const designer of designers) {
    // Récupère les produits Shopify via REST API (plus fiable)
    const restRes = await fetch(
      `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/products.json?limit=50&vendor=${encodeURIComponent(designer.shopifyVendorName)}&fields=id,title`,
      {
        headers: { "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN },
      }
    );
    const restData = await restRes.json();
    const shopifyProducts = restData.products ?? [];

    let linked = 0;
    for (const product of shopifyProducts) {
      const productId = `gid://shopify/Product/${product.id}`;
      const existing = await db.designerProduct.findUnique({
        where: { shopifyProductId: productId },
      });
      if (!existing) {
        await db.designerProduct.create({
          data: {
            shopifyProductId: productId,
            designerId: designer.id,
          },
        });
        linked++;
      }
    }
    if (linked > 0) {
      console.log(`   ${designer.brandName}: ${linked} produits associés`);
    }
  }
  console.log("✅ Association terminée");

  return NextResponse.json({
    success: true,
    message: `${created} produits créés, ${skipped} déjà existants`,
    details: results,
  });
}