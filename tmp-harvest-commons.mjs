// tmp-harvest-commons.mjs — collecte de visuels (Wikimedia Commons) par catégorie
const QUERIES = [
  "Kente cloth fashion",
  "Kente festival Ghana",
  "Bogolan cloth Mali",
  "Ankara wax print dress",
  "African print dress woman",
  "Benin Fashion Runway",
  "Fashion show Lagos Nigeria",
  "Dakar fashion week Senegal",
  "Fashion show Ghana model",
  "Fashion show Nairobi Kenya",
  "Bazin riche dress",
  "Agbada Nigeria man",
  "Boubou Senegal",
  "Kitenge Tanzania",
  "Pagne wax Togo",
  "Ndop Cameroon clothing",
  "African head tie gele",
  "African textile market cloth",
];

const HEADERS = { "User-Agent": "afrestyle-image-pipeline/1.0 (dev)" };

async function categoryImages(cat) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `filetype:bitmap ${cat}`,
    gsrnamespace: "6",
    gsrlimit: "40",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1600",
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return [];
  return Object.values(pages)
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      return {
        title: p.title,
        url: (info.thumburl || info.url).split("?")[0],
        w: info.thumbwidth ?? info.width,
        h: info.thumbheight ?? info.height,
        mime: info.mime,
        page: info.descriptionurl,
      };
    })
    .filter(Boolean);
}

const only = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n));
const list = only.length ? QUERIES.filter((_, i) => only.includes(i)) : QUERIES;

for (const cat of list) {
  const imgs = await categoryImages(cat);
  const picked = imgs
    .filter((i) => i.mime === "image/jpeg" && i.w >= 1200 && i.h >= 800)
    .sort((a, b) => Math.abs(b.h / b.w - 1.3) - Math.abs(a.h / a.w - 1.3))
    .slice(0, 8);
  console.log(`\n### ${cat} (${picked.length}/${imgs.length})`);
  for (const p of picked) {
    console.log(`  ${p.w}x${p.h} | ${p.title}\n    ${p.url}`);
  }
}
