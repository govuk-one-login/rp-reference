import * as openidClient from "openid-client";
import { Request, Response } from "express";
import { Config } from "../../config.js";
import { CLAIMS } from "../../utils/app.constants.js";

export const verifyGetController = async (
    req: Request, 
    res: Response): Promise<void> => {
    
    const clientConfig = Config.getInstance();

    const vtr = JSON.stringify([clientConfig.getIdentityVtr()]);
    console.log("vtr=" + vtr);

    const generatedNonce = openidClient.randomNonce();
    // Store the nonce and state in a session cookie so it can be checked in callback
    res.cookie("nonce", generatedNonce, {
        httpOnly: true,
    });

    // res.cookie(STATE_COOKIE_NAME, state, {
    //     httpOnly: true,
    // });

    // this should come from config - will fix later
    const claimsRequest = {
        userinfo: {
          [CLAIMS.CoreIdentity]: null,
          [CLAIMS.Address]: null,
          [CLAIMS.ReturnCode]: null
        }
    }

    // Construct the url and redirect on to the authorization endpoint
    let parameters: Record<string, string> = {
        redirect_uri: clientConfig.getAuthorizeRedirectUrl(),
        scope: clientConfig.getScopes().join(" "),
        vtr: vtr,
        nonce: generatedNonce,
        claims: JSON.stringify(claimsRequest)
    }

    //let config = await openidClient.discovery(new URL(clientConfig.getIssuer()), clientConfig.getClientId());

    let redirectTo = openidClient.buildAuthorizationUrl(clientConfig.getOpenidClientConfiguration(), parameters);
  
    console.log(redirectTo);
    res.redirect(redirectTo.href);
}