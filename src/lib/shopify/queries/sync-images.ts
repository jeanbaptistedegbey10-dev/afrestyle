// src/lib/shopify/queries/sync-images.ts
// Mutations Admin pour la synchronisation des médias produits à partir d'URLs existantes.

export const GET_ADMIN_MUTATION_SET_MEDIA_FROM_URL = `
  mutation ProductCreateMediaFromUrl($productId: ID!, $mediaUrl: String!, $alt: String) {
    productCreateMedia(
      productId: $productId
      media: {
        mediaContentType: IMAGE
        mediaUrl: $mediaUrl
        alt: $alt
      }
    ) {
      media {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

