import * as openidClient from "openid-client";
import { Request, Response } from "express";
import { Config } from "../../config.js";
import { getAuthorizeParameters } from "../../helpers/authorize-request.js";

export const verifyGetController = async (
    req: Request, 
    res: Response): Promise<void> => {
    
    const clientConfig = Config.getInstance();

    // const vtr = JSON.stringify([clientConfig.getIdentityVtr()]);
    
    // // Store the nonce and state in a session cookie so it can be checked in callback
    // const generatedNonce = openidClient.randomNonce();
    // res.cookie("nonce", generatedNonce, {
    //     httpOnly: true,
    // });

    // const generatedState = openidClient.randomState();
    // res.cookie("state", generatedState, {
    //     httpOnly: true,
    // });

    // this should come from config - will fix later
    // const claimsRequest = {
    //     userinfo: {
    //       [CLAIMS.CoreIdentity]: null,
    //       [CLAIMS.Address]: null,
    //       [CLAIMS.ReturnCode]: null
    //     }
    // }

    // // Construct the url and redirect on to the authorization endpoint
    // let parameters: Record<string, string> = {
    //     redirect_uri: clientConfig.getAuthorizeRedirectUrl(),
    //     scope: clientConfig.getScopes().join(" "),
    //     vtr: vtr,
    //     nonce: generatedNonce,
    //     state: generatedState,
    //     claims: JSON.stringify(claimsRequest)
    // }

    const parameters = getAuthorizeParameters(clientConfig, res, true);

    let redirectTo = openidClient.buildAuthorizationUrl(clientConfig.getOpenidClientConfiguration(), parameters);
    res.redirect(redirectTo.href);
}