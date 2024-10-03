import { Request, Response, Router, urlencoded } from 'express';
import { BaseClient, Client, ClientMetadata, Issuer } from 'openid-client';
import asyncHandler from './async-handler';
import { identityHandler, loginHandler } from './login';
import { callbackHandler } from './callback';
import { OneLoginConfiguration } from './types/one-login-configuration';
import { logoutHandler } from './logout';
import { JWK } from 'jose';


const createIssuer = async (
    configuration: OneLoginConfiguration
): Promise<Issuer> => {
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
};

const createClient = (
    configuration: OneLoginConfiguration,
    issuer: Issuer,
    jwks: Array<JWK>,
): Client => {
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
};

export const govukOneLoginOIDCMiddleware = async (configuration: OneLoginConfiguration) => {
    // Load private key is required for signing token exchange
    const jwks = [configuration.privateKey.export({ format: "jwk" })]

    // Configuration for the authority that authenticates users and issues the tokens.
    const issuer = await createIssuer(configuration);

    // The client that requests the tokens.
    const client: BaseClient = createClient(configuration, issuer, jwks);

    const router = Router();


    router.get("/oauth/login", loginHandler(configuration, client));

    router.get("/oauth/iv", identityHandler(configuration, client));

    // Callback receives the code and state from the authorization server
    router.get("/oauth/callback", callbackHandler(configuration, client));

    router.post("/oauth/logout", urlencoded({ extended: true }), logoutHandler(client));

    router.get("/oauth/post-logout",
        asyncHandler(async (req: Request, res: Response) => {
            res.render("post-logout.njk");
        })
    );

    return router;

}