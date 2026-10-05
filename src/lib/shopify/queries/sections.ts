// src/lib/shopify/queries/sections.ts
// ───────────────────────────────────────────────────────────────────────────────
//  QUERIES STOREFRONT — SECTIONS ÉDITORIALES DE L'ACCUEIL (Metaobjects)
// ───────────────────────────────────────────────────────────────────────────────
//
//  ⚠️  Prérequis côté Shopify Admin (une seule fois, ensuite plus jamais de code
//      à toucher) :
//
//   1. Settings > Apps and sales channels > Storefront API > Metaobjects
//      → autoriser le type `home_section` (scope `unauthenticated_read_metaobjects`).
//      ⚠️ Si le type n'est PAS exposé, Shopify répond :
//         "Field 'metaobjects' doesn't exist on type 'QueryRoot'" (ou 403).
//         Le front ne casse pas : `getHomeSections()` bascule sur le repli local.
//   2. Content > Metaobjects > `home_section` > "Affichage" :
//        - Display name field : `title`
//        - Access > Storefront : PUBLIC_READ
//
//  Définition de champs attendue côté Admin :
//
//   | key          | type                   | usage                                  |
//   |--------------|------------------------|----------------------------------------|
//   | title        | single_line_text_field | titre (requis)                         |
//   | subtitle     | single_line_text_field | sur-titre                              |
//   | body         | multi_line_text_field  | paragraphe éditorial                   |
//   | eyebrow      | single_line_text_field | sur-libellé au-dessus du titre         |
//   | image        | file_reference         | visuel (requis)                        |
//   | button_text  | single_line_text_field | libellé du CTA                         |
//   | button_link  | url                    | cible du CTA (interne ou externe)      |
//   | layout       | single_line_text_field | image_left | image_right | full_banner |
//   | position     | number_integer         | ordre éditorial croissant              |
//   | active       | boolean                | masquer une section sans la supprimer  |
//
//  Deux corollaires importants :
//  • `layout` est un champ TEXTE (et non une méta-référence) : c'est le levier
//    le plus simple à piloter depuis l'admin, sans multi-liste à maintenir. Toute
//    valeur hors enum est normalisée côté serveur (`lib/shopify/sections.ts`).
//  • `image` est un `file_reference` : on lit `reference.image.url` (le champ
//    `value` ne contient qu'un GID inexploitable côté navigateur), exactement
//    comme pour le hero et les bannières de collections.
// ───────────────────────────────────────────────────────────────────────────────

import { MEDIA_IMAGE_FRAGMENT } from "./hero";

/** Type metaobject attendu côté Admin. Modifiable ici SEULEMENT si vous renommez le type. */
export const HOME_SECTION_METAOBJECT_TYPE = "home_section";

/**
 * Sections éditoriales de l'accueil — Metaobjects de type `home_section`.
 *
 * `sortKey: "id"` n'est PAS l'ordre d'affichage : c'est un tri technique. L'ordre
 * éditorial est piloté par le champ numérique `position` côté Admin, puis
 * normalisé côté serveur (`lib/shopify/sections.ts`) avec le handle en secours.
 *
 * On demande `value` ET `reference` : `reference` porte l'URL CDN et les
 * dimensions (c'est elle qui fait le rendu), `value` sert de filet de diagnostic
 * si la référence média est révoquée.
 */
export const GET_HOME_SECTIONS_QUERY = `
  ${MEDIA_IMAGE_FRAGMENT}
  query GetHomeSections($type: String!, $first: Int!) {
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