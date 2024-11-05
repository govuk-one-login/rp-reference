declare namespace NodeJS {
  export interface ProcessEnv {
    OIDC_CLIENT_ID: string;
    OIDC_PRIVATE_KEY: string;
    OIDC_ISSUER_DISCOVERY_ENDPOINT: string;
    OIDC_AUTHORIZATION_ENDPOINT: string;
    OIDC_AUTHORIZE_REDIRECT_URI: string;
    OIDC_CALLBACK_REDIRECT_URI: string;
    OIDC_REDIRECT_URI: string;
    IV_PUBLIC_KEY: string;
  }
}
