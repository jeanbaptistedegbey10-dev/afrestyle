// tmp-verify-pool.mjs — vérifie les visuels retenus (HTTP 200 + licence).
const FILES = [
  // Bénin — Benin Fashion Runway 2022 (collection Nou-Yoyo, bazin)
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 01.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 02.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 03.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 04.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 05.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 06.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 07.jpg",
  "File:Collection Nou-Yoyo au défilé Benin Fashion Runway 2022 08.jpg",
  // Nigeria — Lagos Fashion Week
  "File:LFDW3 -56.jpg",
  "File:LFDW3 -64.jpg",
  "File:LFDW3 -129.jpg",
  "File:LFDW3 -135.jpg",
  "File:Pelli at a fashion show, April 2012.jpg",
  "File:Olufeko on the runway of Lagos Fashion Week 2018 for Kiki Kamanu.jpg",
  // Ghana — Kente
  "File:Agbamekevor1.jpg",
  "File:Agbamekevor2 (cropped).jpg",
  "File:A Kente Festival.jpg",
  "File:Tema art festival.jpg",
  "File:Afrochella Festival 2019 1.jpg",
  "File:Kpetoee.jpg",
  "File:Jewelry fashion show, Ghana.jpg",
  // Mali — Bogolan
  "File:Bogolan.jpg",
  "File:Homme en bogolan.jpg",
  "File:Bogolan textile.jpg",
  "File:Mali 2018 2.jpg",
  // Sénégal
  "File:Barbie 01.jpg",
  // Kenya
  "File:Faces of Kenya - Woman 6.jpg",
  "File:Faces of Kenya - Woman 7.jpg",
  "File:Faces of Kenya - Woman 9.jpg",
  "File:Faces of Kenya - Woman 11.jpg",
  "File:Faces of Kenya - Woman 12.jpg",
  "File:Faces of Kenya - Woman 13.jpg",
  "File:Faces of Kenya - Man 3.jpg",
  // Togo — wax accessoires
  "File:Création, sac de sortie pour femme en pagne Wax 01.jpg",
  "File:Création, sac de sortie pour femme en pagne Wax 02.jpg",
  "File:Création, petit sac en pagne Wax.jpg",
];

const HEADERS = { "User-Agent": "afrestyle-image-pipeline/1.0 (dev)" };

function thumbUrl(orig, width = 1600) {
  const m = orig.match(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/);
  if (!m) return orig;
  const file = m[3];
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${file}/${width}px-${file}`;
}

const chunks = [];
for (let i = 0; i < FILES.length; i += 20) chunks.push(FILES.slice(i, i + 20));

const meta = new Map();
for (const chunk of chunks) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    titles: chunk.join("|"),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json();
  for (const p of Object.values(data?.query?.pages ?? {})) {
    const info = p.imageinfo?.[0];
    if (!info) {
      console.log(`MISSING  ${p.title}`);
      continue;
    }
    const em = info.extmetadata ?? {};
    meta.set(p.title, {
      orig: info.url,
      w: info.width,
      h: info.height,
      license: em.LicenseShortName?.value ?? "?",
      artist: (em.Artist?.value ?? "?").replace(/<[^>]+>/g, "").trim(),
      credit: (em.Credit?.value ?? "").replace(/<[^>]+>/g, "").trim(),
    });
  }
}

for (const f of FILES) {
  const m = meta.get(f);
  if (!m) continue;
  const url = thumbUrl(m.orig);
  let status = "?";
  let type = "?";
  try {
    const r = await fetch(url, { method: "HEAD", headers: HEADERS, signal: AbortSignal.timeout(15000) });
    status = r.status;
    type = r.headers.get("content-type") ?? "?";
  } catch (e) {
    status = `ERR ${e.message}`;
  }
  console.log(`\n${f}`);
  console.log(`  ${m.w}x${m.h} | ${m.license} | ${m.artist}`);
  console.log(`  ${status} ${type}`);
  console.log(`  ${url}`);
}
