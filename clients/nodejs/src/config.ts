import ClientConfiguration from "./types/client-configuration.js";
import { UserIdentityClaim } from "./types/user-info.js";
import * as openidClient from "openid-client";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { DIDKeySet } from "./types/client-configuration.js";

export class Config {
    private static instance: Config;

    private clientConfiguration: ClientConfiguration;
    
    private constructor() {
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        // Load the .env file
        dotenv.config();
        
        this.clientConfiguration = {
            clientId: process.env.OIDC_CLIENT_ID ?? "",
            privateKey: process.env.OIDC_PRIVATE_KEY ?? "",
            clientSecret: process.env.OIDC_CLIENT_SECRET ?? "",           
            issuer: process.env.OIDC_ISSUER ?? "https://oidc.integration.account.gov.uk",
            discoveryUrl: process.env.OIDC_ISSUER 
                ? process.env.OIDC_ISSUER + "/.well-known/openid-configuration" 
                : "https://oidc.integration.account.gov.uk/.well-known/openid-configuration",
            ivIssuer: process.env.IV_ISSUER ?? "",
            ivPublicKey: process.env.IV_PUBLIC_KEY ?? "",
            scopes: ["openid", "email", "phone"],
            authorizeRedirectUrl: process.env.OIDC_AUTHORIZE_REDIRECT_URI ?? "",
            postLogoutRedirectUrl: process.env.OIDC_POST_LOGOUT_REDIRECT_URI ?? "",
            claims: ["https://vocab.account.gov.uk/v1/coreIdentityJWT"],
            idTokenSigningAlgorithm: process.env.OIDC_ID_TOKEN_SIGNING_ALG ?? "",
            tokenAuthMethod: process.env.OIDC_TOKEN_AUTH_METHOD ?? "",
            authenticationVtr: process.env.AUTH_VECTOR_OF_TRUST ?? "",
            identityVtr: process.env.IDENTITY_VECTOR_OF_TRUST ?? "",
            uiLocales: process.env.UI_LOCALES ?? "",
            serviceUrl: process.env.SERVICE_URL ?? ""
        };
    }

    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
    
    public static resetInstance(): void {
        Config.instance = new Config();
    }
    public getClientId(): string {
        return this.clientConfiguration.clientId!;
      }
    
    public setClientId(clientId: string): void {
        this.clientConfiguration.clientId = clientId;
    }

    public getPrivateKey(): string {
        return this.clientConfiguration.privateKey!;
    }

    public setPrivateKey(privateKey: string): void {
        this.clientConfiguration.privateKey = privateKey;
    }

    public getClientSecret(): string {
        return this.clientConfiguration.clientSecret!;
    }

    public setClientSecret(clientSecret: string): void {
        this.clientConfiguration.clientSecret = clientSecret;
    }

    public getIssuer(): string {
        return this.clientConfiguration.issuer!;
    }

    public setIssuer(issuer: string): void {
        this.clientConfiguration.issuer = issuer;
    }

    public getDiscoveryUrl(): string {
        return this.clientConfiguration.discoveryUrl!;
    }

    public setDiscoveryUrl(discoveryUrl: string): void {
        this.clientConfiguration.discoveryUrl = discoveryUrl;
    }

    public getIvIssuer(): string {
        return this.clientConfiguration.ivIssuer!;
    }

    public setIvIssuer(ivIssuer: string): void {
        this.clientConfiguration.ivIssuer = ivIssuer;
    }

    public getIvPublicKey(): string {
        return this.clientConfiguration.ivPublicKey!;
    }

    public setIvPublicKey(ivPublicKey: string): void {
        this.clientConfiguration.ivPublicKey = ivPublicKey;
    }

    public getIvPublicKeys(): DIDKeySet[] {
        return this.clientConfiguration.ivPublicKeys;
    }

    public setIvPublicKeys(ivPublicKeys: DIDKeySet[]): void {
        this.clientConfiguration.ivPublicKeys = ivPublicKeys;
    }

    public getScopes(): string[] {
        return this.clientConfiguration.scopes!;
    }

    public setScopes(scopes: string[]): void {
        this.clientConfiguration.scopes = scopes;
    }

    public getAuthorizeRedirectUrl(): string {
        return this.clientConfiguration.authorizeRedirectUrl!;
    }

    public setAuthorizeRedirectUrl(authorizeRedirectUrl: string): void {
        this.clientConfiguration.privateKey = authorizeRedirectUrl;
    }

    public getPostLogoutRedirectUrl(): string {
        return this.clientConfiguration.postLogoutRedirectUrl!;
    }

    public setPostLogoutRedirectUrl(postLogoutRedirectUrl: string): void {
        this.clientConfiguration.postLogoutRedirectUrl = postLogoutRedirectUrl;
    }

    public getClaims(): UserIdentityClaim[] {
        return this.clientConfiguration.claims!;
    }

    public setClaims(claims: UserIdentityClaim[]): void {
        this.clientConfiguration.claims = claims;
    }

    public getIdTokenSigningAlgorithm(): string {
        return this.clientConfiguration.idTokenSigningAlgorithm!;
    }

    public setIdTokenSigningAlgorithm(idTokenSigningAlgorithm: string): void {
        this.clientConfiguration.idTokenSigningAlgorithm = idTokenSigningAlgorithm;
    }

    public getTokenAuthMethod(): string {
        return this.clientConfiguration.tokenAuthMethod!;
    }

    public setTokenAuthMethod(tokenAuthMethod: string): void {
        this.clientConfiguration.tokenAuthMethod = tokenAuthMethod;
    }

    public getAuthenticationVtr(): string {
        return this.clientConfiguration.authenticationVtr!;
    }

    public setAuthenticationVtr(authenticationVtr: string): void {
        this.clientConfiguration.authenticationVtr = authenticationVtr;
    }

    public getIdentityVtr(): string {
        return this.clientConfiguration.identityVtr!;
    }

    public setIdentityVtr(identityVtr: string): void {
        this.clientConfiguration.identityVtr = identityVtr;
    }

    public getUiLocales(): string {
        return this.clientConfiguration.uiLocales!;
    }

    public setUiLocales(uiLocales: string): void {
        this.clientConfiguration.uiLocales = uiLocales;
    }

    public getServiceUrl(): string {
        return this.clientConfiguration.uiLocales!;
    }

    public setServiceUrl(serviceUrl: string): void {
        this.clientConfiguration.serviceUrl = serviceUrl;
    }

    public getOpenidClientConfiguration(): openidClient.Configuration {
        return this.clientConfiguration.openidClientConfiguration!;
    }

    public setOpenidClientConfiguration(openidClientConfiguration: openidClient.Configuration): void {
        this.clientConfiguration.openidClientConfiguration = openidClientConfiguration;
    }
}