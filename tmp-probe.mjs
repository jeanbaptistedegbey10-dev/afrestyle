// Sonde live : valide les requêtes GraphQL RÉELLEMENT livrées par le projet.
// Les fichiers .ts sont chargés à la main (type-stripping + résolution
// d'imports impossible hors bundler) puis exécutés comme modules ES.
import fs from "node:fs";

function loadTs(file, names, prelude = "") {
  const source = fs
    .readFileSync(file, "utf8")
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];?$/gm, "")
    .replace(/^export const /gm, "const ")
    .replace(/^export type .*$/gm, "");
  const mod = `${prelude}\n${source}\nexport { ${names.join(", ")} };`;
  return import(`data:text/javascript,${encodeURIComponent(mod)}`);
}

const heroMod = await loadTs("src/lib/shopify/queries/hero.ts", [
  "GET_HERO_SLIDES_QUERY",
  "HERO_METAOBJECT_TYPE",
  "MEDIA_IMAGE_FRAGMENT",
]);
const collectionsMod = await loadTs(
  "src/lib/shopify/queries/collections.ts",
  ["GET_COLLECTION_BANNERS_QUERY", "GET_COLLECTION_BANNER_QUERY"],
  `const MEDIA_IMAGE_FRAGMENT = ${JSON.stringify(heroMod.MEDIA_IMAGE_FRAGMENT)};`,
);

const { GET_HERO_SLIDES_QUERY, HERO_METAOBJECT_TYPE } = heroMod;
const { GET_COLLECTION_BANNER_QUERY, GET_COLLECTION_BANNERS_QUERY } = collectionsMod;

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const configured = env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const domain = configured.includes(".")
  ? configured.replace(/^https?:\/\//i, "").replace(/\/+$/, "")
  : `${configured}.myshopify.com`;
const endpoint = `https://${domain}/api/2026-07/graphql.json`;

async function run(label, query, variables) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Shopify-Storefront-Access-Token": env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  const errors = body.errors?.map((e) => e.message) ?? [];
  console.log(`\n=== ${label} ===`);
  console.log(`HTTP ${res.status} | erreurs: ${errors.length ? errors.join(" | ") : "aucune"}`);
  console.log(JSON.stringify(body.data ?? null, null, 2).slice(0, 900));
}

const sectionsMod = await loadTs(
  "src/lib/shopify/queries/sections.ts",
  ["GET_HOME_SECTIONS_QUERY", "HOME_SECTION_METAOBJECT_TYPE"],
  `const MEDIA_IMAGE_FRAGMENT = ${JSON.stringify(heroMod.MEDIA_IMAGE_FRAGMENT)};`,
);

const { GET_HOME_SECTIONS_QUERY, HOME_SECTION_METAOBJECT_TYPE } = sectionsMod;

await run("GET_HOME_SECTIONS_QUERY", GET_HOME_SECTIONS_QUERY, {
  type: HOME_SECTION_METAOBJECT_TYPE,
  first: 8,
});
await run("GET_HERO_SLIDES_QUERY", GET_HERO_SLIDES_QUERY, {
  type: HERO_METAOBJECT_TYPE,
  first: 8,
});
await run("GET_COLLECTION_BANNERS_QUERY", GET_COLLECTION_BANNERS_QUERY, { first: 3 });
await run("GET_COLLECTION_BANNER_QUERY", GET_COLLECTION_BANNER_QUERY, {
  handle: "designer-adaeze-okafor",
});