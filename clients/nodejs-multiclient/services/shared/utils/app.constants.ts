export const PATH_DATA: {
  [key: string]: { url: string; };
} = {
  
  AUTH_CALLBACK: { url: "/auth/callback" },
  SESSION_EXPIRED: { url: "/session-expired" },
  USER_SIGNED_OUT: { url: "/signed-out" },
  SIGN_OUT: { url: "/sign-out" },
  START: { url: "/" },
  BACK_CHANNEL_LOGOUT: { url: "/back-channel-logout" }
};

export const VECTORS_OF_TRUST = {
  AUTH_MEDIUM: "Cl.Cm",
  AUTH_LOW: "Cl",
  AUTH_MEDIUM_IDENTITY_MEDIUM: "Cl.Cm.P2",
  AUTH_MEDIUM_IDENTITY_LOW: "Cl.Cm.P1"
};

export const HTTP_STATUS_CODES = {
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  OK: 200,
  NO_CONTENT: 204,
  REDIRECT: 303,
};

// Scopes
export const SCOPES = [
    "openid", // Always included
    "email", // Return the user's email address (NB: this is the username rather than their preferred communication email address) 
    "phone" //, // Return the user's telephone number
    //"offline_access" // Return a refresh token so the access token can be refreshed before it expires
];

export enum CLAIMS {
  CoreIdentity = "https://vocab.account.gov.uk/v1/coreIdentityJWT",
  Address = "https://vocab.account.gov.uk/v1/address",
  ReturnCode = "https://vocab.account.gov.uk/v1/returnCode",
  DrivingPermit = "https://vocab.account.gov.uk/v1/drivingPermit",
  Passport = "https://vocab.account.gov.uk/v1/passport",
  SocialSecurityRecord = "https://vocab.account.gov.uk/v1/socialSecurityRecord"
};