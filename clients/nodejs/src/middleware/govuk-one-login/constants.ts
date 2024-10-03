export const SCOPES = [
    "openid", // Always included
    "email", // Return the user's email address (NB: this is the username rather than their preferred communication email address)
    "phone", // Return the user's telephone number
    "offline_access" // Return a refresh token so the access token can be refreshed before it expires
];

export const ISSUER = "https://identity.integration.account.gov.uk/";

export const STATE_COOKIE_NAME = "state";
export const NONCE_COOKIE_NAME = "nonce";

export enum Claims {
    CoreIdentity = "https://vocab.account.gov.uk/v1/coreIdentityJWT",
    Address = "https://vocab.account.gov.uk/v1/address"
}