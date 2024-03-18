type AuthMiddlewareConfiguration = {
  clientId: string;
  clientSecret?: string;
  tokenAuthMethod?: string;
  privateKey: string;
  clientMetadata?: Partial<ClientMetadata>;
  authorizeRedirectUri?: string;
  postLogoutRedirectUri?: string;
  callbackRedirectUri?: string;
  identityVerificationPublicKey?: string;
  identityVerificationIssuer?: string;
  uiLocales?: string;
} & (
  | {
      issuerMetadata: IssuerMetadata;
    }
  | {
      discoveryEndpoint: string;
      issuerMetadata?: Partial<IssuerMetadata>;
    }
);

type IdentityCheckCredential = {
  credentialSubject: {
    name: Array<any>;
    birthDate: Array<any>;
  };
};

type GovUkOneLoginUserInfo = {
  sub: string;
  email?: string;
  email_verified: boolean;
  phone_number?: string;
  phone_number_verified: boolean;
  ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]?: string;
  ["https://vocab.account.gov.uk/v1/address"]?: string;
  ["https://vocab.account.gov.uk/v1/passport"]?: string;
  ["https://vocab.account.gov.uk/v1/drivingPermit"]?: string;
  ["https://vocab.account.gov.uk/v1/socialSecurityRecord"]?: string;
  ["https://vocab.account.gov.uk/v1/returnCode"]?: string;
};

type LogoutToken = {
  iss: string;
  sub?: string;
  aud: string;
  iat: number;
  jti: string;
  sid?: string;
  events?: any;
};

