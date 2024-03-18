import { createPrivateKey, createHash, createPublicKey } from "node:crypto";
import { Client, ClientMetadata, Issuer } from "openid-client";
import { JWK } from "jose";

export enum Claims {
  CoreIdentity = "https://vocab.account.gov.uk/v1/coreIdentityJWT",
  Address = "https://vocab.account.gov.uk/v1/address"
}

export function readPublicKey(publicKey: string) {
  const armouredKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
  return createPublicKey(armouredKey);
}

export function readPrivateKey(privateKey: string) {
  return createPrivateKey({
    key: Buffer.from(privateKey, "base64"),
    type: "pkcs8",
    format: "der",
  });
}

export function hash(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

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

export function createClient(
  configuration: AuthMiddlewareConfiguration,
  issuer: Issuer,
  jwks: Array<JWK>,
): Client {
  // Override client metadata if defined in configuration
  const clientMetadata: ClientMetadata = Object.assign(
    {
      // Default configuration for using GOV.UK Sign In
      client_id: configuration.clientId,
      token_endpoint_auth_method: "private_key_jwt",
      token_endpoint_auth_signing_alg: "PS256",
      id_token_signed_response_alg: "ES256",
    },
    configuration.clientMetadata
  );

  const client = new issuer.Client(clientMetadata, {
    keys: jwks
  });

  return client;
}