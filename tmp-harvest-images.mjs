// tmp-harvest-images.mjs — collecte ponctuelle de visuels (Openverse) pour
// construire le pool curaté du pipeline d'images AfroStyle.
const KEYWORDS = [
  "african print dress woman fashion",
  "ankara wax print fashion model",
  "kente cloth ghana traditional",
  "bogolan mud cloth mali textile",
  "bazin riche senegal fashion",
  "kanga textile tanzania woman",
  "ndop cloth cameroon traditional",
  "african fashion model portrait studio",
  "african man traditional outfit",
  "african woman headwrap fashion",
  "african textile pattern detail",
  "dashiki agbada nigeria outfit",
];

const HEADERS = { "User-Agent": "afrestyle-image-pipeline/1.0 (dev)" };

async function search(q, page = 1) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=20&page=${page}&mature=false`;
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

const only = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n));
const KEYWORDS_TO_USE = only.length
  ? KEYWORDS.filter((_, i) => only.includes(i))
  : KEYWORDS;

function isPortrait(r) {
  return r.height >= r.width;
}

const out = {};
for (const kw of KEYWORDS_TO_USE) {
  const results = [...(await search(kw)), ...(await search(kw, 2))];
  const picked = results
    .filter((r) => (r.width ?? 0) >= 1000 && r.url && /\.(jpe?g|png)$/i.test(r.url.split("?")[0]))
    .sort((a, b) => Number(isPortrait(b)) - Number(isPortrait(a)))
    .slice(0, 6)
    .map((r) => ({
      title: r.title,
      url: r.url,
      w: r.width,
      h: r.height,
      license: r.license,
      creator: r.creator,
      provider: r.provider,
    }));
  out[kw] = picked;
  console.log(`\n### ${kw} (${picked.length})`);
  for (const p of picked) console.log(`  ${p.w}x${p.h} | ${p.license} | ${p.provider} | ${p.title}\n    ${p.url}`);
}

const { writeFileSync } = await import("fs");
writeFileSync("tmp-harvest-images.json", JSON.stringify(out, null, 2), "utf8");
console.log("\nsaved tmp-harvest-images.json");
