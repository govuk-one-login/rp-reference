import { Client, ClientMetadata, Issuer } from "openid-client";
import { JWK } from "jose";

export async function createIssuer(
  configuration: AuthMiddlewareConfiguration
): Promise<Issuer> {
  // Override issuer metadata if defined in configuration
  if ("discoveryEndpoint" in configuration) {
    let issuer = await Issuer.discover(configuration.discoveryEndpoint);
    const metadata = Object.assign(
      issuer.metadata,
      configuration.issuerMetadata
    );
    return new Issuer(metadata);
  }
  return new Issuer(configuration.issuerMetadata);
}

export function createPrivateKeyClient(
  configuration: AuthMiddlewareConfiguration,
  issuer: Issuer,
  jwks: Array<JWK>,
): Client {
  // Override client metadata if defined in configuration
  const clientMetadata: ClientMetadata = Object.assign(
    {
      // Default configuration for using GOV.UK Sign In
      client_id: configuration.clientId,
      token_endpoint_auth_method: configuration.tokenAuthMethod,
      token_endpoint_auth_signing_alg: "PS256",
      id_token_signed_response_alg: configuration.idTokenSigningAlg,
    },
    configuration.clientMetadata
  );

  const client = new issuer.Client(clientMetadata, {
    keys: jwks
  });

  return client;
}

export function createClientSecretClient(
  configuration: AuthMiddlewareConfiguration,
  issuer: Issuer
): Client {
  // Override client metadata if defined in configuration
  const clientMetadata: ClientMetadata = Object.assign(
    {
      // Default configuration for using GOV.UK Sign In
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      token_endpoint_auth_method: configuration.tokenAuthMethod,
      id_token_signed_response_alg: configuration.idTokenSigningAlg,
    },
    configuration.clientMetadata
  );

  const client = new issuer.Client(clientMetadata);

  return client;
}