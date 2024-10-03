import { BaseClient, CallbackParamsType, Client, OpenIDCallbackChecks } from 'openid-client';
import asyncHandler from './async-handler';
import { Request, Response } from 'express';
import { Claims, ISSUER, NONCE_COOKIE_NAME, STATE_COOKIE_NAME } from './constants';
import { decodeJwt, jwtVerify } from 'jose';
import { OneLoginConfiguration } from './types/one-login-configuration';
import { UserInfo } from './types/user-info';
import { createHash } from 'node:crypto';

const getRedirectUri = (req: Request) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers.host;
    return `${protocol}://${host}/oauth/callback`;
};

const hash = (value: string) => createHash("sha256").update(value).digest("base64url");

const handleCallback = async (
    configuration: OneLoginConfiguration,
    client: Client,
    callbackParameters: CallbackParamsType,
    nonce: string,
    state: string,
    fallbackRedirectUri: string,
) => {
    const redirectUri =
        configuration.callbackRedirectUri ||
        configuration.redirectUri ||
        fallbackRedirectUri;

    const callbackChecks: OpenIDCallbackChecks = {
        state: hash(state),
        nonce: hash(nonce)
    }
    const tokenSet = await client.callback(redirectUri, callbackParameters, callbackChecks);
    if (!tokenSet.access_token) {
        throw new Error("No access token received");
    }

    const accessToken = JSON.stringify(tokenSet.access_token, null, 2);

    const idToken = tokenSet.id_token;
    const idTokenDecoded = tokenSet.id_token
        ? JSON.stringify(decodeJwt(tokenSet.id_token), null, 2)
        : undefined;


    // Use the access token to authenticate the call to userinfo
    // Note: This is an HTTP GET to https://oidc.integration.account.gov.uk/userinfo
    // with the "Authorization: Bearer ${accessToken}` header
    const userinfo = await client.userinfo<UserInfo>(
        tokenSet.access_token
    );

    // If the core identity claim is not present GOV.UK One Login
    // was not able to prove your user’s identity or the claim
    // wasn't requested.
    let coreIdentity: string | undefined;
    if (userinfo.hasOwnProperty(Claims.CoreIdentity)) {

        // Read the resulting core identity claim
        // See: https://auth-tech-docs.london.cloudapps.digital/integrate-with-integration-environment/process-identity-information/#process-your-user-s-identity-information
        const coreIdentityJWT = userinfo[Claims.CoreIdentity];

        // Check the validity of the claim using the public key
        const { payload } = await jwtVerify(coreIdentityJWT!, configuration.identityVerificationPublicKey!, {
            issuer: ISSUER,
        });

        // Check the Vector of Trust (vot) to ensure the expected level of confidence was achieved.
        if (payload.vot !== "P2") {
            throw new Error("Expected level of confidence was not achieved.");
        }

        coreIdentity = JSON.stringify(payload, null, 2);
    }

    return {
        accessToken,
        idToken,
        idTokenDecoded,
        userinfo: JSON.stringify(userinfo, null, 2),
        coreIdentity,
    };

}

export const callbackHandler = (configuration: OneLoginConfiguration, client: BaseClient) =>
    asyncHandler(async (req: Request, res: Response) => {
    // Check for an error
    if (req.query["error"]) {
        throw new Error(`${req.query.error} - ${req.query.error_description}`);
    }

    // Get all the parameters to pass to the token exchange endpoint
    const params = client.callbackParams(req);
    const nonce = req.cookies[NONCE_COOKIE_NAME];
    const state = req.cookies[STATE_COOKIE_NAME];

    const redirectUri = getRedirectUri(req)


    // Call the userinfo endpoint the retrieve the results of the flow.
    const result = await handleCallback(configuration, client, params, nonce, state, redirectUri);

    // Display the results.
    res.render("result.njk", result);
});