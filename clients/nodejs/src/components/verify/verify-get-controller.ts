import * as openidClient from "openid-client";
import { Request, Response } from "express";
import { Config } from "../../config.js";
import { getAuthorizeParameters } from "../../helpers/authorize-request.js";

export const verifyGetController = async (
    req: Request, 
    res: Response): Promise<void> => {
    
    const clientConfig = Config.getInstance();

    const parameters = getAuthorizeParameters(clientConfig, res, true);

    let redirectTo = openidClient.buildAuthorizationUrl(clientConfig.getOpenidClientConfiguration(), parameters);
    res.redirect(redirectTo.href);
}