import * as openidClient from "openid-client";
import { Request, Response } from "express";
import { Config } from "../../config.js";
import { createPrivateKey } from 'crypto';

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
            name: 'RSA-PSS', // Use the appropriate algorithm here (e.g., RSA-PSS, RSASSA-PKCS1-v1_5, etc.)
            hash: 'SHA-256' // Specify the hash algorithm
        },
        true, // Whether the key is extractable
        ['sign'] // Key usages (e.g., 'sign' or 'decrypt' for private keys)
    );
    
    let clientMetadata!: Partial<openidClient.ClientMetadata> | string | undefined

    let substituteAudience: openidClient.ModifyAssertionOptions = {
        [openidClient.modifyAssertion]: (header, _payload) => {
            _payload.aud = "http://localhost:3000/token"
        }
    };

    let openidClientConfiguration : openidClient.Configuration = await openidClient.discovery(
        new URL(clientConfig.getIssuer()), 
        clientConfig.getClientId(),
        clientMetadata,
        openidClient.PrivateKeyJwt(privateKey, substituteAudience),
        {
            execute: [openidClient.allowInsecureRequests],
        }
    );

    clientConfig.setOpenidClientConfiguration(openidClientConfiguration);

    const vtr = JSON.stringify([clientConfig.getAuthenticationVtr()]);
    
    // Store the nonce and state in a session cookie so it can be checked in callback
    const generatedNonce = openidClient.randomNonce();
    res.cookie("nonce", generatedNonce, {
        httpOnly: true,
    });

    const generatedState = openidClient.randomState();
    res.cookie("state", generatedState, {
        httpOnly: true,
    });

    let parameters: Record<string, string> = {
        redirect_uri: clientConfig.getAuthorizeRedirectUrl(),
        scope: clientConfig.getScopes().join(" "),
        vtr: vtr,
        nonce: generatedNonce,
        state: generatedState
    }

    let redirectTo = openidClient.buildAuthorizationUrl(openidClientConfiguration, parameters);
    console.log(redirectTo);
    res.redirect(redirectTo.href);
}