import { BaseClient } from 'openid-client';
import asyncHandler from './async-handler';
import { Request, Response } from 'express';

const getPostLogoutRedirectUri = (req: Request) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers.host;
    return `${protocol}://${host}/oauth/post-logout`;
};

export const logoutHandler = (client: BaseClient) => asyncHandler(async (req: Request, res: Response) => {
    const idToken = req.body.token;

    // Send the user back to One Login to terminate the session there
    const endSessionUrl = client.endSessionUrl({
        id_token_hint: idToken,
        post_logout_redirect_uri: getPostLogoutRedirectUri(req)
    })

    //res.redirect(endSessionUrl)
    res.render("logout.njk", {
        endSessionUrl
    });
});