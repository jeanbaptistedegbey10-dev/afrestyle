const m = await import("./src/lib/shopify/image-pipeline.ts");
console.log("exports=" + Object.keys(m).length);
const c = {
  title: "Ensemble Wax Architectural",
  tags: ["femme", "pays-benin", "tissu-wax", "style-moderne"],
};
console.log("ALT1=" + m.buildImageAlt(c, { position: 1 }));
console.log("ALT2=" + m.buildImageAlt(c, { position: 2 }));
console.log("ALT3=" + m.buildImageAlt(c, { position: 3 }));
console.log("QUERIES=" + JSON.stringify(m.buildImageSearchQueries(c, { limit: 5 })));
console.log("CURATED=" + JSON.stringify(m.selectCuratedImage(c, { usedImageUrls: [] })));
const acc = {
  title: "Tote Bag Kente",
  productType: "Accessoire",
  tags: ["accessoire", "pays-ghana", "tissu-kente"],
};
console.log("ACC-ALT=" + m.buildImageAlt(acc, { position: 1 }));
const sel = m.selectCuratedImage(acc, { usedImageUrls: [] });
console.log("ACC-URL=" + (sel ? sel.url : "none"));
console.log("POOL=" + m.curatedPoolSize());
// Vérification HTTP d'un échantillon du pool (200 attendu, image/jpeg).
const sample = [
  m.selectCuratedImage(c, { usedImageUrls: [] }).url,
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/BogolanMali3.JPG/1280px-BogolanMali3.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Toghu.jpg/1280px-Toghu.jpg",
];
for (const url of sample) {
  const check = await m.verifyImageUrl(url);
  console.log("VERIFY=" + JSON.stringify(check) + " " + url.slice(0, 80));
}
// findProductMainImage : curated d'abord si les sources clés sont absentes.
const best = await m.findProductMainImage(c, { sources: ["curated"] });
console.log("BEST=" + (best ? best.url + " | " + best.source : "none"));
