import * as openidClient from "openid-client";
import { Request, Response } from "express";
import { Config } from "../../config.js";
import { decodeJwt } from "jose";

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

    const expectedSubject = tokens.claims().sub;
    // Call the userinfo endpoint then retreive the results of the flow.
    const userinfoResponse = await openidClient.fetchUserInfo(clientConfig.getOpenidClientConfiguration(), tokens.access_token, expectedSubject);
    req.session.user = { 
        sub: expectedSubject, 
        idToken: decodeJwt(tokens.id_token), 
        accessToken: decodeJwt(tokens.access_token),        
        userinfo: userinfoResponse
    };

    // Display the results.
    res.redirect("/home");
};