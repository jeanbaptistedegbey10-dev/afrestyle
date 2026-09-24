// tmp-verify-pool2.mjs — vérifie les visuels Commons retenus (dims réelles + licence + HTTP).
const FILES = [
  "File:Bazin riche.jpg",
  "File:Culture and apparel.jpg",
  "File:Clothing and cultue.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 01.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 04.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 06.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 08.jpg",
  "File:LFDW3 -56.jpg",
  "File:LFDW3 -64.jpg",
  "File:LFDW3 -129.jpg",
  "File:LFDW3 -135.jpg",
  "File:Pelli at a fashion show, April 2012.jpg",
  "File:Olufeko on the runway of Lagos Fashion Week 2018 for Kiki Kamanu.jpg",
  "File:Ghanaian bride in traditional Kente cloth with bridal fan.jpg",
  "File:Kete Dancer.jpg",
  "File:North Ghana Traditional Kente.jpg",
  "File:Traditional Kente of Volta region.jpg",
  "File:Kente from Volta region, Design of the palm tree.jpg",
  "File:Agbamekevor1.jpg",
  "File:A Kente Festival.jpg",
  "File:Tema art festival.jpg",
  "File:Afrochella Festival 2019 1.jpg",
  "File:Kpetoee.jpg",
  "File:Jewelry fashion show, Ghana.jpg",
  "File:BogolanMali3.JPG",
  "File:BogolanMali31.JPG",
  "File:BogolanMali32.JPG",
  "File:Ségou (11).JPG",
  "File:Toghu.jpg",
  "File:Robes Toghu.jpg",
  "File:Toghu clotch. Vetement en toghu du Cameroun.jpg",
  "File:Toghu cloth, north west region cameroon.jpg",
  "File:Création, sac de sortie pour femme en pagne Wax 01.jpg",
  "File:Création, sac de sortie pour femme en pagne Wax 02.jpg",
  "File:Création, petit sac en pagne Wax.jpg",
  "File:Barbie 01.jpg",
];

const HEADERS = { "User-Agent": "afrestyle-image-pipeline/1.0 (dev)" };

const from = Number(process.argv[2] ?? 0);
const to = Number(process.argv[3] ?? FILES.length);
const slice = FILES.slice(from, to);

function strip(u) {
  return (u || "").split("?")[0];
}

function buildThumb(orig, width = 1280) {
  const m = strip(orig).match(
    /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/,
  );
  if (!m) return strip(orig);
  const file = m[3];
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${file}/${width}px-${file}`;
}

const params = new URLSearchParams({
  action: "query",
  format: "json",
  titles: slice.join("|"),
  prop: "imageinfo",
  iiprop: "url|size|mime|extmetadata",
});
const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
  headers: HEADERS,
  signal: AbortSignal.timeout(25000),
});
const data = await res.json();

for (const p of Object.values(data?.query?.pages ?? {})) {
  const info = p.imageinfo?.[0];
  if (!info) {
    console.log(`MISSING  ${p.title}`);
    continue;
  }
  const em = info.extmetadata ?? {};
  const url = buildThumb(info.url);
  let status = "?";
  try {
    const r = await fetch(url, { method: "HEAD", headers: HEADERS, signal: AbortSignal.timeout(12000) });
    status = `${r.status} ${(r.headers.get("content-type") ?? "").slice(0, 10)} ${Math.round(Number(r.headers.get("content-length") ?? 0) / 1024)}Ko`;
  } catch (e) {
    status = `ERR ${e.message}`;
  }
  console.log(
    `${info.width}x${info.height} | ${em.LicenseShortName?.value ?? "?"} | ${(em.Artist?.value ?? "?").replace(/<[^>]+>/g, "").trim().slice(0, 30)} | ${status}`,
  );
  console.log(`  ${p.title}`);
  console.log(`  ${url}`);
}
