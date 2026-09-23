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
  /** Options déclaratives Storefront API : [{ name: "Taille", values: ["S","M","L"] }] */
  options: ShopifyProductOption[];
  // Métachamps custom qu'on créera dans Shopify
  metafields: {
    edges: { node: ShopifyMetafield }[];
  };
  collections: {
    edges: { node: { title: string; handle: string } }[];
  };
  tags: string[]; // ["wax", "femme", "benin", "designer-adaeze"]
  vendor: string; // Nom du créateur
  availableForSale: boolean;
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

export type ShopifyProductOption = {
  name: string; // "Taille" | "Tissu" | "Couleur"
  values: string[]; // ["S", "M", "L"]
};

export type ShopifyVariant = {
  id: string;
  title: string; // "S / Kente / Noir"
  availableForSale: boolean;
  quantityAvailable?: number | null;
  sku?: string | null;
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

// ─── Types normalisés pour l'UI ─────────────────────────────────────────────

/** Option normalisée exposée à l'UI (dérivée de `product.options` ou des variantes) */
export type ProductOption = {
  name: string;
  values: string[];
};

/** Sélection courante sous forme clé/valeur : { Taille: "M", Tissu: "Kente" } */
export type SelectedOptions = Record<string, string>;

// Type normalisé pour l'UI (simplifié par rapport aux types Shopify bruts)
export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: string;
  priceFormatted: string; // "€ 185"
  /** Code devise ISO 4217 issu de `priceRange.minVariantPrice.currencyCode` (ex. "EUR"). */
  currencyCode: string;
  compareAtPrice: string | null;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  /** Source de vérité pour le sélecteur. Jamais inféré à l'affichage seul. */
  options: ProductOption[];
  vendor: string;
  tags: string[];
  country: string | null; // Extrait des tags: "benin"
  fabric: string | null; // Extrait des tags: "wax"
  style: string | null; // Extrait des tags: "traditionnel"
  availableForSale: boolean;
};

/** Ligne minimale renvoyée par `GET_SITEMAP_PRODUCTS_QUERY` (sitemap + revalidation). */
export type ShopifySitemapProduct = {
  handle: string;
  updatedAt: string;
};

/** Ligne minimale renvoyée par `GET_COLLECTIONS_QUERY` (sitemap + navigation). */
export type ShopifyCollectionHandle = {
  handle: string;
  updatedAt: string;
};

