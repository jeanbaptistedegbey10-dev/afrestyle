// src/lib/shopify/queries/collections.ts
// ────────────────────────────────────────────────────────────────────────────
//  QUERIES STOREFRONT — BANNÈRES DE CATÉGORIES (Metafields de Collection)
// ────────────────────────────────────────────────────────────────────────────
//
//  ⚠️  Prérequis côté Shopify Admin, pour CHAQUE collection concernée :
//
//   Settings > Custom data > Metafield definitions > "Collection"
//   → définir les métachamps suivants (namespace `custom`) :
//
//   | key                | type                       | usage                          |
//   |--------------------|----------------------------|--------------------------------|
//   | banner_image       | file_reference             | visuel de bannière (requis)    |
//   | banner_alt         | single_line_text_field     | texte alternatif (recommandé)  |
//   | banner_title       | single_line_text_field     | titre (défaut : titre Shopify) |
//   | banner_subtitle    | multi_line_text_field      | sous-titre                     |
//   | banner_link        | url                        | lien du bouton (défaut : page) |
//   | banner_button_text | single_line_text_field     | libellé du bouton              |
//   | banner_position    | number_integer             | ordre d'affichage (1, 2, 3…)   |
//   | banner_active      | boolean                    | masquer une carte sans la supprimer |
//
//  Sans `banner_image`, la collection est simplement ignorée par la grille :
//  une carte de catégorie ne doit jamais s'afficher avec un visuel générique.
//
//  Idem pour le hero : `banner_image` est de type `file_reference`, on lit donc
//  `reference { ... on MediaImage { image { url … } } }` et non `value`.
// ────────────────────────────────────────────────────────────────────────────

import { MEDIA_IMAGE_FRAGMENT } from "./hero";

/** Bloc `metafields` réutilisable — une seule source de vérité pour les clés. */
const BANNER_METAFIELD_SELECTION = `
  metafields(identifiers: [
    { namespace: "custom", key: "banner_image" }
    { namespace: "custom", key: "banner_alt" }
    { namespace: "custom", key: "banner_title" }
    { namespace: "custom", key: "banner_subtitle" }
    { namespace: "custom", key: "banner_link" }
    { namespace: "custom", key: "banner_button_text" }
    { namespace: "custom", key: "banner_position" }
    { namespace: "custom", key: "banner_active" }
  ]) {
    key
    type
    value
    reference {
      ...MediaImageFragment
    }
  }
`;

/**
 * Toutes les collections (accueil) avec leurs métachamps de bannière.
 * Volumétrie faible (10-50 collections) : une seule requête suffit.
 */
export const GET_COLLECTION_BANNERS_QUERY = `
  ${MEDIA_IMAGE_FRAGMENT}
  query GetCollectionBanners($first: Int!) {
    collections(first: $first, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        image {
          url
          altText
          width
          height
        }
        ${BANNER_METAFIELD_SELECTION}
      }
    }
  }
`;

/**
 * Bannière d'UNE collection — requête légère pour la page `/collections/[handle]`
 * (sans les produits, pour ne pas dupliquer le catalogue déjà chargé par la page).
 */
export const GET_COLLECTION_BANNER_QUERY = `
  ${MEDIA_IMAGE_FRAGMENT}
  query GetCollectionBanner($handle: String!) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
        width
        height
      }
      ${BANNER_METAFIELD_SELECTION}
    }
  }
`;