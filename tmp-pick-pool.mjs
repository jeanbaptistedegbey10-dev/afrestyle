// tmp-pick-pool.mjs — sélection de visuels Commons (résolution réelle + licence).
const QUERIES = [
  "Benin Fashion Runway",
  "Lagos Fashion Week",
  "Kente cloth Ghana traditional",
  "Bogolan mud cloth Mali",
  "Bazin riche",
  "pagne wax création",
  "Ghana fashion show model",
  "Senegal traditional clothing",
  "Cameroon traditional dress",
  "Nairobi fashion model",
  "Bogolanfini",
  "Toghu Cameroon",
  "Kitenge East Africa",
  "Dakar fashion",
  "kanga textile",
  "Mali traditional clothing",
];

const HEADERS = { "User-Agent": "afrestyle-image-pipeline/1.0 (dev)" };

function strip(u) {
  return (u || "").split("?")[0];
}

function thumb(orig, width = 1200) {
  const m = strip(orig).match(
    /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/,
  );
  if (!m) return null;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/${width}px-${m[3]}`;
}

async function search(q) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: q,
    gsrnamespace: "6",
    gsrlimit: "40",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1200",
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json();
  return Object.values(data?.query?.pages ?? {});
}

const only = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n));
const list = only.length ? QUERIES.filter((_, i) => only.includes(i)) : QUERIES;

for (const q of list) {
  const pages = await search(q);
  const picked = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info || info.mime !== "image/jpeg") continue;
    const w = info.width ?? 0;
    const h = info.height ?? 0;
    if (w < 1200 || h < 1200) continue;
    const ratio = h / w;
    if (ratio < 0.5 || ratio > 2.2) continue;
    const url = strip(info.thumburl) || thumb(info.url);
    if (!url) continue;
    const em = info.extmetadata ?? {};
    picked.push({
      title: p.title,
      w,
      h,
      ratio: Number(ratio.toFixed(2)),
      license: em.LicenseShortName?.value ?? "?",
      artist: (em.Artist?.value ?? "?").replace(/<[^>]+>/g, "").trim().slice(0, 40),
      url,
    });
  }
  picked.sort((a, b) => Math.abs(a.ratio - 1.3) - Math.abs(b.ratio - 1.3));
  console.log(`\n### ${q} — ${picked.length} candidats (orig ≥1200px)`);
  for (const p of picked.slice(0, 6)) {
    console.log(`  ${p.w}x${p.h} (${p.ratio}) | ${p.license} | ${p.artist}`);
    console.log(`    ${p.title}\n    ${p.url}`);
  }
}
