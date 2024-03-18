type AuthMiddlewareConfiguration = {
  clientId: string;
  privateKey: string;
  clientMetadata?: Partial<ClientMetadata>;
  redirectUri?: string;
  authorizeRedirectUri?: string;
  callbackRedirectUri?: string;
  identityVerificationPublicKey?: string;
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
  ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]?: string;
};