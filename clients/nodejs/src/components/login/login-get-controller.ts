import * as openidClient from "openid-client";
import { Request, Response } from "express";
import { Config } from "../../config.js";
import { getAuthorizeParameters } from "../../helpers/authorize-request.js";

export const loginGetController = async (
    req: Request, 
    res: Response): Promise<void> => {
    
    const clientConfig = Config.getInstance();

    const binaryDer = Buffer.from(clientConfig.getPrivateKey(), 'base64');

    // Import the ArrayBuffer as a CryptoKey
    let privateKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        {
            name: 'RSA-PSS',
            hash: 'SHA-256'
        },
        true, // Whether the key is extractable
        ['sign'] // Key usages (e.g., 'sign' or 'decrypt' for private keys)
    );
    
    let clientMetadata!: Partial<openidClient.ClientMetadata> | string | undefined

    // Modify the audience claim in the private_key_jwt
    let substituteAudience: openidClient.ModifyAssertionOptions = {
        [openidClient.modifyAssertion]: (header, _payload) => {
            _payload.aud = `${clientConfig.getIssuer()}/token`
        }
    };

    // call discovery endpoint and setup private_key_jwt
    // use allowInsecureRequests if connection to HTTP endpoint e.g. when running simulator locally
    let openidClientConfiguration : openidClient.Configuration = await openidClient.discovery(
        new URL(clientConfig.getIssuer()), 
        clientConfig.getClientId(),
        clientMetadata,
        openidClient.PrivateKeyJwt(privateKey, substituteAudience),
        {
            execute: [openidClient.allowInsecureRequests]
        }
    );

    clientConfig.setOpenidClientConfiguration(openidClientConfiguration);

    // const vtr = JSON.stringify([clientConfig.getAuthenticationVtr()]);
    
    // // Store the nonce and state in a session cookie so it can be checked in callback
    // const generatedNonce = openidClient.randomNonce();
    // res.cookie("nonce", generatedNonce, {
    //     httpOnly: true,
    // });

    // const generatedState = openidClient.randomState();
    // res.cookie("state", generatedState, {
    //     httpOnly: true,
    // });

    // let parameters: Record<string, string> = {
    //     redirect_uri: clientConfig.getAuthorizeRedirectUrl(),
    //     scope: clientConfig.getScopes().join(" "),
    //     vtr: vtr,
    //     nonce: generatedNonce,
    //     state: generatedState
    // }

    const parameters = getAuthorizeParameters(clientConfig, res, false);

    let redirectTo = openidClient.buildAuthorizationUrl(openidClientConfiguration, parameters);
    res.redirect(redirectTo.href);
}