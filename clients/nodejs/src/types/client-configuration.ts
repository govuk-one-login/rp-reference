import { UserIdentityClaim } from "./user-info.js";
import * as openidClient from "openid-client";

export default interface ClientConfiguration {
  clientId?: string;
  privateKey?: string;
  clientSecret?: string;
  issuer?: string;
  discoveryUrl?: string;
  ivIssuer?: string;
  ivPublicKey?: string;
  scopes?: string[];
  authorizeRedirectUrl?: string;
  postLogoutRedirectUrl?: string;
  claims?: UserIdentityClaim[];
  idTokenSigningAlgorithm?: string;
  tokenAuthMethod?: string;
  authenticationVtr?: string;
  identityVtr?: string;
  uiLocales?: string;
  serviceUrl?: string;
  openidClientConfiguration?: openidClient.Configuration;
}