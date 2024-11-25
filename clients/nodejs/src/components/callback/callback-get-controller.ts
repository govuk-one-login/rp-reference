import * as openidClient from "openid-client";
import { Request, Response } from "express";
import { Config } from "../../config.js";
import { decodeJwt, jwtVerify } from "jose";
import { readPublicKey, getKidFromToken } from "../../helpers/crypto.js";
import DIDKeySet from "../../types/did-keyset.js";
import { fetchPublicKeys } from "../../helpers/did.js";
import { logger } from "../../logger.js";
import { KeyObject } from "crypto";

export const callbackGetController = async (
    req: Request, 
    res: Response): Promise<void> => {
    
    // Check for an error
    if (req.query["error"]) {
        throw new Error(`${req.query.error} - ${req.query.error_description}`);
    }

    const clientConfig = Config.getInstance();
    
    //const vtr = JSON.stringify([clientConfig.getAuthenticationVtr()]);
    let nonce = req.cookies["nonce"];
    let state = req.cookies["state"];

    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    let currentUrl: URL = new URL(fullUrl);
    let tokens = await openidClient.authorizationCodeGrant(
        clientConfig.getOpenidClientConfiguration(), 
        currentUrl, 
        {
          expectedNonce: nonce,
          expectedState: state,
          idTokenExpected: true,
        }
    )

    const idTokenSub = tokens.claims().sub;
    // Call the userinfo endpoint then retreive the results of the flow.
    const userinfoResponse: openidClient.UserInfoResponse = await openidClient.fetchUserInfo(
        clientConfig.getOpenidClientConfiguration(), 
        tokens.access_token, 
        idTokenSub
    );
    
    let coreIdentityPayload;
    let coreIdentityJWT;
    let ivPublicKey: JsonWebKey | KeyObject;

    //check for a coreIdentityJWT
    if (userinfoResponse.hasOwnProperty("https://vocab.account.gov.uk/v1/coreIdentityJWT")) {
    
        coreIdentityJWT = userinfoResponse["https://vocab.account.gov.uk/v1/coreIdentityJWT"].toString() || "";
        console.log(coreIdentityJWT);
        
        // check to see if we have a static key
        if (clientConfig.getIvPublicKey().length == 0)
            const kid: string | undefined = getKidFromToken(coreIdentityJWT);
            
            let publicKeys: DIDKeySet[] = clientConfig.getIvPublicKeys();
            
            // check to see if we have any keys stored
            if (publicKeys.length == 0) {
                publicKeys = await fetchPublicKeys();
                clientConfig.setIvPublicKeys(publicKeys);
            }

            // check to see if we now have the kid and matching key
            const keySet = clientConfig.getIvPublicKeys().find(keyset => keyset.id === kid);
            if (keySet) {
                ivPublicKey = keySet.publicKeyJwk;    
            } else {
                logger.error(`No matching public key found for key id:${kid}`);
                throw new Error("coreIdentityJWTValidationFailed: unexpected \"kid\" found in JWT header");
            }
        } else {
            ivPublicKey = readPublicKey(clientConfig.getIvPublicKey());
        }

        //decode the coreIdentity
        const { payload } = await jwtVerify(
            coreIdentityJWT!, 
            ivPublicKey, 
            {
                issuer: clientConfig.getIvIssuer()
            }
        );

        // validate the coreIdentity data
        let vtrToCheck;
        const vtr = clientConfig.getIdentityVtr();
        const regex = /[.Clm]/g;

        if (vtr != null) {
            vtrToCheck = vtr?.replace(regex,"");
        }
        
        // Check that the sub in the coreIdentity sub matches the one in the idToken and userinfo
        if (payload.sub === idTokenSub && payload.sub === userinfoResponse.sub) {
            console.log("All subs match");
        } else {
            throw new Error("coreIdentityJWTValidationFailed: unexpected \"sub\" claim value");
        }

        // Check aud = client-id
        if (payload.aud !== clientConfig.getClientId()) {
            throw new Error("coreIdentityJWTValidationFailed: unexpected \"aud\" claim value");
        }
        
        // Check the Vector of Trust (vot) to ensure the expected level of confidence was achieved.
        if (payload.vot !== vtrToCheck) {
            throw new Error("coreIdentityJWTValidationFailed: unexpected \"vot\" claim value");
        }

        coreIdentityPayload = payload;
    }

    let returnCodeValue: openidClient.JsonValue | undefined;
    if (userinfoResponse.hasOwnProperty("https://vocab.account.gov.uk/v1/returnCode")) {

        returnCodeValue = userinfoResponse["https://vocab.account.gov.uk/v1/returnCode"];
    }

    req.session.user = { 
        sub: idTokenSub, 
        idToken: decodeJwt(tokens.id_token), 
        accessToken: decodeJwt(tokens.access_token),        
        userinfo: userinfoResponse,
        coreIdentity: coreIdentityPayload,
        returnCode: returnCodeValue
    };

    // Display the results.
    res.redirect("/home");
};