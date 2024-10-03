import { Request, Response } from 'express';
import { AuthorizationParameters, BaseClient, generators } from 'openid-client';
import { Claims, NONCE_COOKIE_NAME, SCOPES, STATE_COOKIE_NAME } from './constants';
import { OneLoginConfiguration } from './types/one-login-configuration';
import { createHash } from 'node:crypto';

const hash = (value: string) => createHash("sha256").update(value).digest("base64url");

const buildAuthorizationUrl = (
    configuration: OneLoginConfiguration,
    req:Request,
    res: Response<any, Record<string, any>>,
    client: BaseClient,
    vtr: string,
    claims?: { userinfo: any },
    additionalParameters?: any
): string => {

    const redirectUri = configuration.authorizeRedirectUri ||
        configuration.redirectUri ||
        getRedirectUri(req);

    // Generate values that protect the flow from replay attacks.
    const nonce = generators.nonce();
    const state = generators.state();

    // Store the nonce and state in a session cookie so it can be checked in callback
    res.cookie(NONCE_COOKIE_NAME, nonce, {
        httpOnly: true,
    });

    res.cookie(STATE_COOKIE_NAME, state, {
        httpOnly: true,
    });

    const authorizationParameters: AuthorizationParameters = {
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES.join(" "),
        state: hash(state),
        nonce: hash(nonce),
        vtr: vtr,
        ui_locales: "en-GB en",
    };

    if(typeof claims === "object"){
        authorizationParameters.claims = JSON.stringify(claims);
    }

    if(typeof additionalParameters === "object") {
        Object.assign(authorizationParameters, additionalParameters);
    }

    // Construct the url and redirect on to the authorization endpoint
    return client.authorizationUrl(authorizationParameters);
};


const getRedirectUri = (req: Request) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers.host;
    return `${protocol}://${host}/oauth/callback`;
};

export const loginHandler = (configuration: OneLoginConfiguration, client: BaseClient) =>
    (req: Request, res: Response) => {

    // Vector of trust for authentication
    const vtr = `["Cl.Cm"]`;

    // Calculate the redirect URL the user should be returned to after completing the OAuth flow
    const authorizationUrl = buildAuthorizationUrl(configuration, req, res, client, vtr, undefined, req.query);

    // Redirect to the authorization server
    res.redirect(authorizationUrl);
};

export const identityHandler = (configuration: OneLoginConfiguration, client: BaseClient) => (req: Request, res: Response) => {

    // Vector of trust for medium level of confidence
    const vtr = `["P2.Cl.Cm"]`;

    // Requested claims
    const claims = {
        userinfo: {
            // Core identity
            [Claims.CoreIdentity]: { essential: true },
            // Address
            //[Claims.Address]: { essential: true },
        },
    };

    // Calculate the redirect URL the user should be returned to after completing the OAuth flow
    const authorizationUrl = buildAuthorizationUrl(configuration, req, res, client, vtr, claims, req.query);

    // Redirect to the authorization server
    res.redirect(authorizationUrl);
};