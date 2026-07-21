// src/lib/shopify/queries/customer.ts

// Crée un compte client
export const CUSTOMER_CREATE_MUTATION = `
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Connexion — retourne un accessToken
export const CUSTOMER_ACCESS_TOKEN_CREATE = `
  mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Déconnexion — invalide le token
export const CUSTOMER_ACCESS_TOKEN_DELETE = `
  mutation CustomerAccessTokenDelete($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      userErrors {
        field
        message
      }
    }
  }
`;

// Récupère le profil du client connecté
export const GET_CUSTOMER_QUERY = `
  query GetCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      email
      firstName
      lastName
      phone
      defaultAddress {
        id
        address1
        address2
        city
        country
        zip
      }
      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            orderNumber
            processedAt
            financialStatus
            fulfillmentStatus
            currentTotalPrice {
              amount
              currencyCode
            }
            lineItems(first: 5) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    image {
                      url
                      altText
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Mise à jour du profil
export const CUSTOMER_UPDATE_MUTATION = `
  mutation CustomerUpdate(
    $customerAccessToken: String!
    $customer: CustomerUpdateInput!
  ) {
    customerUpdate(
      customerAccessToken: $customerAccessToken
      customer: $customer
    ) {
      customer {
        id
        email
        firstName
        lastName
        phone
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Demande de réinitialisation de mot de passe
export const CUSTOMER_RECOVER_MUTATION = `
  mutation CustomerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Réinitialisation du mot de passe avec token
export const CUSTOMER_RESET_MUTATION = `
  mutation CustomerReset(
    $resetToken: String!
    $password: String!
    $passwordConfirmation: String!
  ) {
    customerReset(
      resetToken: $resetToken
      password: $password
      passwordConfirmation: $passwordConfirmation
    ) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;