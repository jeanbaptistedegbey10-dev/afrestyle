// src/lib/shopify/queries/hero.ts
// ────────────────────────────────────────────────────────────────────────────
//  QUERIES STOREFRONT — DIAPORAMA DU HERO (Metaobjects)
// ────────────────────────────────────────────────────────────────────────────
//
//  ⚠️  Prérequis côté Shopify Admin (à faire UNE SEULE FOIS, ensuite plus jamais
//      de code à toucher) :
//
//   1. Settings > Storefront API > Metaobjects → autoriser le type `hero_slide`
//      (scope `unauthenticated_read_metaobjects`).
//      ⚠️ Si le type n'est PAS exposé, Shopify répond :
//         "Field 'metaobjects' doesn't exist on type 'QueryRoot'" (ou 403).
//         Le front ne casse pas : `getHeroSlides()` bascule sur le repli local.
//   2. Content > Metaobjects > `hero_slide` > "Affichage" :
//        - Display name field : `title`
//        - Access > Storefront : PUBLIC_READ
//        - (optionnel) Capability "publishable" si vous voulez gérer actif/inactif.
//
//  Pourquoi `reference` et pas `value` ?
//   Un champ `file_reference` renvoie une CHAÎNE (gid brut : "gid://shopify/…").
//   `value` n'est donc pas exploitable côté navigateur. C'est le champ
//   `reference` (union `MetafieldReference`, membre `MediaImage`) qui expose
//   l'URL réelle du CDN + ses dimensions. On demande les DEUX : `value` sert de
//   filet si la référence est révoquée, `reference` fait le rendu.
// ────────────────────────────────────────────────────────────────────────────

/** Type metaobject attendu côté Admin. Modifiable ici SEULEMENT si vous renommez le type. */
export const HERO_METAOBJECT_TYPE = "hero_slide";

/**
 * Fragment de référence média réutilisé par le hero ET les banners de
 * catégories. `MediaImage.image` renvoie l'`Image` Storefront (url/altText/
 * width/height) ; `MediaImage.alt` est l'alt saisi sur le média lui-même.
 */
export const MEDIA_IMAGE_FRAGMENT = `
  fragment MediaImageFragment on MediaImage {
    __typename
    alt
    image {
      url
      altText
      width
      height
    }
  }
`;

/**
 * Diaporama du Hero — Metaobjects de type `hero_slide`.
 *
 * `sortKey: "id"` n'est PAS l'ordre d'affichage : c'est un tri technique.
 * L'ordre éditorial est piloté par le champ numérique `position` côté Admin,
 * puis normalisé côté serveur (`lib/shopify/hero.ts`).
 */
export const GET_HERO_SLIDES_QUERY = `
  ${MEDIA_IMAGE_FRAGMENT}
  query GetHeroSlides($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first, sortKey: "id") {
      nodes {
        id
        handle
        fields {
          key
          type
          value
          reference {
            ...MediaImageFragment
          }
        }
      }
    }
  }
`;

// ⚠️ `displayName` N'EXISTE PAS sur le type `Metaobject` du Storefront (vérifié
//    en direct sur l'API 2026-07 : « Field 'displayName' doesn't exist on type
//    'Metaobject' »). Le libellé lisible d'une entrée reste dans ses CHAMPS :
//    on utilise donc `fields` + `handle`, jamais `displayName`.