// src/lib/shopify/cart.ts
import { shopifyFetch } from "./client";
import {
  CREATE_CART_MUTATION,
  ADD_CART_LINES_MUTATION,
  UPDATE_CART_LINES_MUTATION,
  REMOVE_CART_LINES_MUTATION,
  GET_CART_QUERY,
} from "./queries/cart";

// Type d'une ligne de panier Shopify (normalisé)
export type ShopifyCartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: { title: string; handle: string };
    image: { url: string; altText: string | null; width: number; height: number } | null;
  };
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: ShopifyCartLine[];
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
    totalTaxAmount: { amount: string; currencyCode: string } | null;
  };
};

// Normalise la réponse Shopify (edges/node → tableau simple)
function normalizeCart(rawCart: {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: { edges: { node: ShopifyCartLine }[] };
  cost: ShopifyCart["cost"];
}): ShopifyCart {
  return {
    id: rawCart.id,
    checkoutUrl: rawCart.checkoutUrl,
    totalQuantity: rawCart.totalQuantity,
    lines: rawCart.lines.edges.map((e) => e.node),
    cost: rawCart.cost,
  };
}

/**
 * Crée un nouveau panier Shopify avec une première ligne
 */
// src/lib/shopify/cart.ts
// Dans la fonction createCart, ajoute le paramètre redirectUrl

export async function createCart(
  variantId: string,
  quantity: number = 1
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartCreate: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { field: string; message: string }[];
    };
  }>({
    query: CREATE_CART_MUTATION,
    variables: {
      lines: [{ merchandiseId: variantId, quantity }],
    },
    cache: "no-store",
  });

  if (data.data.cartCreate.userErrors.length > 0) {
    throw new Error(data.data.cartCreate.userErrors[0].message);
  }

  const cart = normalizeCart(data.data.cartCreate.cart);
  
  // Ajoute le paramètre de retour à l'URL checkout
  // Shopify accepte ?return_to= pour rediriger après paiement
  const returnUrl = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_SITE_URL}/order-confirmed`
  );
  cart.checkoutUrl = `${cart.checkoutUrl}&return_to=${returnUrl}`;
  
  return cart;
}

/**
 * Ajoute une ligne à un panier existant
 */
export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesAdd: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { field: string; message: string }[];
    };
  }>({
    query: ADD_CART_LINES_MUTATION,
    variables: {
      cartId,
      lines: [{ merchandiseId: variantId, quantity }],
    },
    cache: "no-store",
  });

  if (data.data.cartLinesAdd.userErrors.length > 0) {
    throw new Error(data.data.cartLinesAdd.userErrors[0].message);
  }

  return normalizeCart(data.data.cartLinesAdd.cart);
}

/**
 * Met à jour la quantité d'une ligne
 */
export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { field: string; message: string }[];
    };
  }>({
    query: UPDATE_CART_LINES_MUTATION,
    variables: {
      cartId,
      lines: [{ id: lineId, quantity }],
    },
    cache: "no-store",
  });

  return normalizeCart(data.data.cartLinesUpdate.cart);
}

/**
 * Supprime une ligne du panier
 */
export async function removeCartLine(
  cartId: string,
  lineId: string
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { field: string; message: string }[];
    };
  }>({
    query: REMOVE_CART_LINES_MUTATION,
    variables: { cartId, lineIds: [lineId] },
    cache: "no-store",
  });

  return normalizeCart(data.data.cartLinesRemove.cart);
}

/**
 * Récupère un panier existant par son ID
 * Utile pour resynchroniser après un rechargement
 */
export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<{
    cart: Parameters<typeof normalizeCart>[0] | null;
  }>({
    query: GET_CART_QUERY,
    variables: { cartId },
    cache: "no-store",
  });

  if (!data.data.cart) return null;
  return normalizeCart(data.data.cart);
}