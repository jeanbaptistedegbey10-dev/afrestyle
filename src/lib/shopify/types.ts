// src/lib/shopify/types.ts
// Tous les types qui correspondent aux données Shopify

export type ShopifyProduct = {
  id: string;
  handle: string; // Slug URL: "robe-cotonou-dusk"
  title: string;
  description: string;
  descriptionHtml: string;
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  images: {
    edges: { node: ShopifyImage }[];
  };
  variants: {
    edges: { node: ShopifyVariant }[];
  };
  // Métachamps custom qu'on créera dans Shopify
  metafields: {
    edges: { node: ShopifyMetafield }[];
  };
  collections: {
    edges: { node: { title: string; handle: string } }[];
  };
  tags: string[]; // ["wax", "femme", "benin", "designer-adaeze"]
  vendor: string; // Nom du créateur
};

export type ShopifyMoney = {
  amount: string; // "185.00"
  currencyCode: string; // "EUR"
};

export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type ShopifyVariant = {
  id: string;
  title: string; // "S / Noir", "M / Beige"
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: {
    name: string; // "Taille"
    value: string; // "S"
  }[];
  image: ShopifyImage | null;
};

export type ShopifyMetafield = {
  key: string;
  value: string;
  type: string;
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: {
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          title: string;
          product: {
            title: string;
            handle: string;
          };
          image: ShopifyImage | null;
          price: ShopifyMoney;
        };
      };
    }[];
  };
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
    totalTaxAmount: ShopifyMoney | null;
  };
  totalQuantity: number;
};

// Type normalisé pour l'UI (simplifié par rapport aux types Shopify bruts)
export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: string;
  priceFormatted: string; // "€ 185"
  compareAtPrice: string | null;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  vendor: string;
  tags: string[];
  country: string | null; // Extrait des tags: "benin"
  fabric: string | null; // Extrait des tags: "wax"
  style: string | null; // Extrait des tags: "traditionnel"
  availableForSale: boolean;
};
