// src/lib/shopify/queries/about.ts
// ───────────────────────────────────────────────────────────────────────────────
//  QUERIES STOREFRONT — CARTES ÉDITORIALES DE /ABOUT (Metaobjects)
// ───────────────────────────────────────────────────────────────────────────────
//
//  ⚠️  Prérequis côté Shopify Admin (une seule fois, ensuite plus jamais de code
//      à toucher) :
//
//   1. Settings > Apps and sales channels > Storefront API > Metaobjects
//      → autoriser le type `editorial_card` (scope `unauthenticated_read_metaobjects`).
//      ⚠️ Si le type n'est PAS exposé, Shopify répond :
//         "Field 'metaobjects' doesn't exist on type 'QueryRoot'" (ou 403).
//         Le front ne casse pas : `getAboutEditorialCards()` bascule sur le repli local.
//   2. Content > Metaobjects > `editorial_card` > "Affichage" :
//        - Display name field : `title`
//        - Access > Storefront : PUBLIC_READ
//
//  Deux synonymes sont acceptés pour le TYPE (`editorial_card` en priorité,
//  `about_card` en secours — cf. `ABOUT_CARD_METAOBJECT_TYPES`) : les deux
//  requêtes partagent la même sélection de champs.
//
//  Définition de champs attendue côté Admin :
//
//   | key         | type                   | usage                                  |
//   |-------------|------------------------|----------------------------------------|
//   | title       | single_line_text_field | titre de la carte (requis)             |
//   | eyebrow     | single_line_text_field | sur-libellé au-dessus du titre         |
//   | body        | multi_line_text_field  | paragraphe éditorial                   |
//   | image       | file_reference         | visuel (requis)                        |
//   | position    | number_integer         | ordre éditorial croissant              |
//   | active      | boolean                | masquer une carte sans la supprimer    |
//
//  Deux corollaires importants :
//  • `image` est un `file_reference` : on lit `reference.image.url` (le champ
//    `value` ne contient qu'un GID inexploitable côté navigateur), exactement
//    comme pour le hero et les sections éditoriales de l'accueil.
//  • `sortKey: "id"` n'est PAS l'ordre d'affichage : le Storefront ne sait pas
//    trier sur un champ de métaobjet. L'ordre éditorial est donc appliqué côté
//    serveur sur le champ numérique `position` (`lib/shopify/about.ts`).
// ───────────────────────────────────────────────────────────────────────────────

import { MEDIA_IMAGE_FRAGMENT } from "./hero";

/**
 * Types métaobjet acceptés pour les cartes de /about, essayés DANS L'ORDRE.
 *
 * `editorial_card` est le nom canonique. `about_card` est toléré car plusieurs
 * conventions coexistent dans les boutiques : le marchand a pu nommer sa
 * définition `about_card`. Les deux partagent la MÊME sélection de champs, donc
 * le second essay ne coûte qu'une requête de plus et évite un avertissement
 * « type illisible » sur une boutique qui a publish des cartes.
 */
export const ABOUT_CARD_METAOBJECT_TYPES = ["editorial_card", "about_card"] as const;

/**
 * Cartes éditoriales de la page /about — Metaobjects `editorial_card`.
 *
 * On demande `value` ET `reference` : `reference` porte l'URL CDN et les
 * dimensions (c'est elle qui fait le rendu), `value` sert de filet de diagnostic
 * si la référence média est révoquée.
 *
 * `sortKey: "id"` n'est PAS l'ordre d'affichage : c'est un tri technique.
 * L'ordre éditorial est piloté par le champ numérique `position` côté Admin,
 * puis normalisé côté serveur (`lib/shopify/about.ts`).
 */
export const GET_ABOUT_CARDS_QUERY = `
  ${MEDIA_IMAGE_FRAGMENT}
  query GetAboutEditorialCards($type: String!, $first: Int!) {
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