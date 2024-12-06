import * as openidClient from "openid-client";
import { Request, Response } from "express";
import { Config } from "../../config.js";
import { NextFunction } from "express-serve-static-core";
import { logger } from "../../logger.js";

export const logoutController = async (
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    
    try {
        const clientConfig = Config.getInstance();
        
        const postLogoutRedirectUrl = clientConfig.getPostLogoutRedirectUrl();
    
        const state = req.cookies["state"];
        const idtoken = req.cookies["id-token"];
        
        const config: openidClient.Configuration = clientConfig.getOpenidClientConfiguration();  

        const logoutUrl = openidClient.buildEndSessionUrl(
            config, 
            {
                post_logout_redirect_uri: postLogoutRedirectUrl,
                id_token_hint: idtoken,
                state: state
            }
        )
        req.session.user = null;
        req.session.destroy(function(err) {
            // cannot access session here
        });

        logger.debug(logoutUrl);
            
        res.redirect(logoutUrl.href);
    } catch (error) {
        // Unexpected errors
        next(error);
    }    
}