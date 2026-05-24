// src/lib/shopify/customer.ts
import { shopifyFetch } from "./client";
import {
  CUSTOMER_CREATE_MUTATION,
  CUSTOMER_ACCESS_TOKEN_CREATE,
  CUSTOMER_ACCESS_TOKEN_DELETE,
  GET_CUSTOMER_QUERY,
  CUSTOMER_UPDATE_MUTATION,
} from "./queries/customer";

export type ShopifyCustomer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  defaultAddress: {
    id: string;
    address1: string;
    address2: string | null;
    city: string;
    country: string;
    zip: string;
  } | null;
  orders: {
    id: string;
    orderNumber: number;
    processedAt: string;
    financialStatus: string;
    fulfillmentStatus: string;
    currentTotalPrice: { amount: string; currencyCode: string };
    lineItems: {
      title: string;
      quantity: number;
      variant: {
        image: { url: string; altText: string | null } | null;
        price: { amount: string; currencyCode: string };
      } | null;
    }[];
  }[];
};

export type CustomerUserError = {
  code: string;
  field: string[];
  message: string;
};

/**
 * Crée un nouveau compte client
 */
export async function createCustomer({
  email,
  password,
  firstName,
  lastName,
}: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ success: boolean; errors: CustomerUserError[] }> {
  const data = await shopifyFetch<{
    customerCreate: {
      customer: { id: string } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>({
    query: CUSTOMER_CREATE_MUTATION,
    variables: {
      input: { email, password, firstName, lastName },
    },
    cache: "no-store",
  });

  const { customer, customerUserErrors } = data.data.customerCreate;
  return {
    success: !!customer && customerUserErrors.length === 0,
    errors: customerUserErrors,
  };
}

/**
 * Connecte un client — retourne le token d'accès
 */
export async function loginCustomer({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{
  accessToken: string | null;
  expiresAt: string | null;
  errors: CustomerUserError[];
}> {
  const data = await shopifyFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: {
        accessToken: string;
        expiresAt: string;
      } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>({
    query: CUSTOMER_ACCESS_TOKEN_CREATE,
    variables: { input: { email, password } },
    cache: "no-store",
  });

  const { customerAccessToken, customerUserErrors } =
    data.data.customerAccessTokenCreate;

  return {
    accessToken: customerAccessToken?.accessToken ?? null,
    expiresAt: customerAccessToken?.expiresAt ?? null,
    errors: customerUserErrors,
  };
}

/**
 * Déconnecte un client — invalide le token Shopify
 */
export async function logoutCustomer(accessToken: string): Promise<void> {
  await shopifyFetch({
    query: CUSTOMER_ACCESS_TOKEN_DELETE,
    variables: { customerAccessToken: accessToken },
    cache: "no-store",
  });
}

/**
 * Récupère le profil complet du client connecté
 */
export async function getCustomer(
  accessToken: string
): Promise<ShopifyCustomer | null> {
  const data = await shopifyFetch<{
    customer: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      defaultAddress: ShopifyCustomer["defaultAddress"];
      orders: {
        edges: {
          node: {
            id: string;
            orderNumber: number;
            processedAt: string;
            financialStatus: string;
            fulfillmentStatus: string;
            currentTotalPrice: { amount: string; currencyCode: string };
            lineItems: {
              edges: {
                node: {
                  title: string;
                  quantity: number;
                  variant: ShopifyCustomer["orders"][0]["lineItems"][0]["variant"];
                };
              }[];
            };
          };
        }[];
      };
    } | null;
  }>({
    query: GET_CUSTOMER_QUERY,
    variables: { customerAccessToken: accessToken },
    cache: "no-store",
  });

  const customer = data.data.customer;
  if (!customer) return null;

  return {
    ...customer,
    orders: customer.orders.edges.map((e) => ({
      ...e.node,
      lineItems: e.node.lineItems.edges.map((le) => le.node),
    })),
  };
}

/**
 * Met à jour le profil client
 */
export async function updateCustomer(
  accessToken: string,
  updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
  }
): Promise<{ success: boolean; errors: CustomerUserError[] }> {
  const data = await shopifyFetch<{
    customerUpdate: {
      customer: { id: string } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>({
    query: CUSTOMER_UPDATE_MUTATION,
    variables: {
      customerAccessToken: accessToken,
      customer: updates,
    },
    cache: "no-store",
  });

  const { customer, customerUserErrors } = data.data.customerUpdate;
  return {
    success: !!customer && customerUserErrors.length === 0,
    errors: customerUserErrors,
  };
}