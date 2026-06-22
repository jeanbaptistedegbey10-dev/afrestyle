// src/lib/seed/designers.ts
// Script pour créer 12 designers approuvés avec 3 produits associés chacun
// Exécution: npx tsx src/lib/seed/designers.ts

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DESIGNERS = [
  { firstName: "Adaeze", lastName: "Okafor", email: "adaeze.okafor@seed.com", brandName: "Okafor Studio", country: "Bénin", specialty: "Couture contemporaine", since: 2019, bio: "Formée à Paris, enracinée à Cotonou. Adaeze mêle le wax traditionnel à des coupes architecturales modernes.", initials: "AO", gradient: ["#2d1535","#0d2218"], tags: ["Wax","Femme","Luxe"], shopifyVendor: "Adaeze Okafor" },
  { firstName: "Kofi", lastName: "Mensah", email: "kofi.mensah@seed.com", brandName: "Kofi Wear", country: "Ghana", specialty: "Kente & Streetwear", since: 2021, bio: "Pionnier du Kente urbain, Kofi redéfinit les codes du tissu royal ghanéen pour la génération Z mondiale.", initials: "KM", gradient: ["#0a2010","#201408"], tags: ["Kente","Streetwear","Homme"], shopifyVendor: "Kofi Mensah" },
  { firstName: "Aminata", lastName: "Diallo", email: "aminata.diallo@seed.com", brandName: "Diallo Création", country: "Sénégal", specialty: "Broderie & Luxe", since: 2018, bio: "Maîtresse de la broderie dakaroise, Aminata crée des pièces d'exception portées par les élites.", initials: "AD", gradient: ["#201408","#0a1820"], tags: ["Broderie","Femme","Premium"], shopifyVendor: "Aminata Diallo" },
  { firstName: "Chidi", lastName: "Okeke", email: "chidi.okeke@seed.com", brandName: "Okeke Atelier", country: "Nigeria", specialty: "Agbada moderne", since: 2020, bio: "Chidi réinterprète l'Agbada traditionnel Yoruba avec des matières contemporaines.", initials: "CO", gradient: ["#1a2010","#20100a"], tags: ["Agbada","Homme","Traditionnel"], shopifyVendor: "Chidi Okeke" },
  { firstName: "Fatoumata", lastName: "Coulibaly", email: "fatoumata.c@seed.com", brandName: "Bogolan Art", country: "Mali", specialty: "Bogolan & Art textile", since: 2022, bio: "Artiste textile formée à Bamako, Fatoumata transforme le bogolan ancestral en pièces portables.", initials: "FC", gradient: ["#201808","#081820"], tags: ["Bogolan","Unisexe","Art"], shopifyVendor: "Fatoumata Coulibaly" },
  { firstName: "Amara", lastName: "Traoré", email: "amara.traore@seed.com", brandName: "Traoré Joaillerie", country: "Côte d'Ivoire", specialty: "Accessoires & Joaillerie", since: 2017, bio: "Joaillier et accessoiriste, Amara crée des pièces en or et en bronze inspirées des cours royales akan.", initials: "AT", gradient: ["#201510","#102015"], tags: ["Accessoires","Or","Joaillerie"], shopifyVendor: "Amara Traoré" },
  { firstName: "Zara", lastName: "Kone", email: "zara.kone@seed.com", brandName: "Zara K Designs", country: "Côte d'Ivoire", specialty: "Prêt-à-porter féminin", since: 2020, bio: "Zara crée des silhouettes fluides et colorées qui capturent l'énergie d'Abidjan.", initials: "ZK", gradient: ["#1a0820","#082010"], tags: ["Femme","Prêt-à-porter","Coloré"], shopifyVendor: "Zara Kone" },
  { firstName: "Kwame", lastName: "Asante", email: "kwame.asante@seed.com", brandName: "Asante Textiles", country: "Ghana", specialty: "Kente & Tissage", since: 2016, bio: "Héritier d'une lignée de tisseurs Ashanti, Kwame perpétue l'art du Kente avec des motifs contemporains.", initials: "KA", gradient: ["#201020","#102010"], tags: ["Kente","Tissage","Artisanat"], shopifyVendor: "Kwame Asante" },
  { firstName: "Nadia", lastName: "Benali", email: "nadia.benali@seed.com", brandName: "Nadia Benali", country: "Burkina Faso", specialty: "Mode éthique", since: 2021, bio: "Nadia milite pour une mode éthique en valorisant le coton biologique burkinabé.", initials: "NB", gradient: ["#082010","#201008"], tags: ["Éthique","Bio","Femme"], shopifyVendor: "Nadia Benali" },
  { firstName: "Yannick", lastName: "Moukam", email: "yannick.moukam@seed.com", brandName: "Moukam Style", country: "Cameroun", specialty: "Streetwear africain", since: 2022, bio: "Yannick fusionne le streetwear new-yorkais avec les imprimés camerounais.", initials: "YM", gradient: ["#102020","#201020"], tags: ["Streetwear","Homme","Urbain"], shopifyVendor: "Yannick Moukam" },
  { firstName: "Aisha", lastName: "Mwangi", email: "aisha.mwangi@seed.com", brandName: "Mwangi Design", country: "Kenya", specialty: "Mode durable", since: 2019, bio: "Aisha utilise des matériaux recyclés et des teintures végétales pour créer des pièces uniques.", initials: "AM", gradient: ["#1a2015","#151020"], tags: ["Durable","Recyclé","Unisexe"], shopifyVendor: "Aisha Mwangi" },
  { firstName: "Moussa", lastName: "Sow", email: "moussa.sow@seed.com", brandName: "Sow Concept", country: "Guinée", specialty: "Costumes & Tailleurs", since: 2015, bio: "Maître tailleur formé à Conakry, Moussa habille les élites guinéennes avec des costumes sur-mesure.", initials: "MS", gradient: ["#201510","#102015"], tags: ["Costume","Homme","Sur-mesure"], shopifyVendor: "Moussa Sow" },
];

const PRODUCT_MAP: Record<string, string[]> = {
  "Adaeze Okafor": ["Robe Cotonou Dusk", "Ensemble Wax Architectural", "Blouse Nuit Béninoise"],
  "Kofi Mensah": ["Hoodie Kente Revival", "Tote Bag Kente", "Veste Bombardier Kente"],
  "Aminata Diallo": ["Robe Broderie Diamant", "Caftan Impérial", "Éventail de Soie"],
  "Chidi Okeke": ["Agbada Modern", "Dashiki Premium", "Chemise Agbada Fusion"],
  "Fatoumata Coulibaly": ["Kimono Bogolan", "Sac Bogolan", "Écharpe Bogolan"],
  "Amara Traoré": ["Collier Or Akan", "Bracelets Bronze", "Boucles d'oreilles Royales"],
  "Zara Kone": ["Robe Abidjan", "Jupe Fendue Wax", "Top Nouchi Chic"],
  "Kwame Asante": ["Étole Kente Cérémonie", "Pagne Kente Royal", "Scarf Kente"],
  "Nadia Benali": ["Robe Coton Bio", "Tunique Faso", "Sac Tissé Main"],
  "Yannick Moukam": ["T-shirt Urban Wax", "Sweat Cameroun", "Casquette Ndop"],
  "Aisha Mwangi": ["Robe Recyclée Art", "Pochette Kanga", "Chemise Safari"],
  "Moussa Sow": ["Costume Sur-Mesure", "Blanc Guinée", "Veston Traditionnel"],
};

function generateAvatarSvg(initials: string, gradient: string[]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:${gradient[0]}"/>
    <stop offset="100%" style="stop-color:${gradient[1]}"/>
  </linearGradient></defs>
  <rect width="400" height="500" fill="url(#g)"/>
  <circle cx="200" cy="180" r="70" fill="rgba(212,175,55,0.12)" stroke="rgba(212,175,55,0.25)" stroke-width="2"/>
  <text x="200" y="200" text-anchor="middle" font-family="serif" font-size="52" fill="#D4AF37" font-weight="bold">${initials}</text>
  <text x="200" y="320" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#F5F0E8">${initials.split("").join(" ")}</text>
</svg>`;
}

async function seed() {
  console.log("🌱 Seed des designers...\n");
  
  let created = 0, skipped = 0;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  for (const d of DESIGNERS) {
    const existing = await db.designer.findUnique({ where: { email: d.email } });
    if (existing) {
      console.log(`⏭️  ${d.brandName} — existe déjà`);
      skipped++;
      continue;
    }

    // Handle
    const base = d.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let handle = base, counter = 1;
    while (await db.designer.findUnique({ where: { handle } })) handle = `${base}-${counter++}`;

    // Génère et sauvegarde l'avatar SVG
    const svgContent = generateAvatarSvg(d.initials, d.gradient);
    const avatarFileName = `seed-${d.firstName.toLowerCase()}-${d.lastName.toLowerCase()}.svg`;
    const avatarPath = path.join(uploadDir, avatarFileName);
    writeFileSync(avatarPath, svgContent);
    const avatarUrl = `/uploads/avatars/${avatarFileName}`;

    const passwordHash = await bcrypt.hash("password123", 12);

    await db.designer.create({
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        brandName: d.brandName,
        handle,
        country: d.country,
        specialty: d.specialty,
        since: d.since,
        bio: d.bio,
        story: d.bio,
        avatarUrl,
        shopifyVendorName: d.shopifyVendor,
        status: "APPROVED",
        passwordHash,
      },
    });

    console.log(`✅  ${d.brandName} (${d.firstName} ${d.lastName}) — créé avec avatar`);
    created++;
  }

  console.log(`\n📊 Résultat : ${created} créés, ${skipped} ignorés sur ${DESIGNERS.length}`);
}

seed()
  .then(() => { console.log("\n� Seed terminé !"); process.exit(0); })
  .catch((e) => { console.error("❌ Erreur:", e); process.exit(1); });