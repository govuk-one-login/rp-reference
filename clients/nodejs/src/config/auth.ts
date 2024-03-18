import { Request, Response, Router, urlencoded } from "express";
import { jwtVerify, decodeJwt, KeyLike } from "jose";
import {
  Client,
  generators,
  TokenSet,
  AuthorizationParameters,
  BaseClient,
} from "openid-client";
import asyncHandler from "../async-handler";
import { Claims, createClient, createIssuer, hash, readPrivateKey, readPublicKey } from "../govuk-one-login";


/*
  The various elements that control the user journey and returned results.
 */

// Scopes
const SCOPES = [
  "openid", // Always included
  "email", // Return the user's email address (NB: this is the username rather than their preferred communication email address) 
  "phone", // Return the user's telephone number
  "offline_access" // Return a refresh token so the access token can be refreshed before it expires
];

// Issuer that is must have issued identity claims.
const ISSUER = "https://identity.integration.account.gov.uk/";

const STATE_COOKIE_NAME = "state";
const NONCE_COOKIE_NAME = "nonce";

function getRedirectUri(req: Request) {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers.host;
  return `${protocol}://${host}/oauth/callback`;
}

function getPostLogoutRedirectUri(req: Request) {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers.host;
  return `${protocol}://${host}/oauth/post-logout`;
}

async function getResult(
  ivPublicKey: KeyLike,
  client: Client,
  tokenSet: TokenSet
) {
  if (!tokenSet.access_token) {
    throw new Error("No access token received");
  }

  const accessToken = JSON.stringify(tokenSet.access_token, null, 2);

  const idToken = tokenSet.id_token;
  const idTokenDecoded = tokenSet.id_token
    ? JSON.stringify(decodeJwt(tokenSet.id_token), null, 2)
    : undefined;

  const refreshToken = tokenSet.refresh_token
    ? tokenSet.refresh_token
    : undefined;

  // Use the access token to authenticate the call to userinfo
  // Note: This is an HTTP GET to https://oidc.integration.account.gov.uk/userinfo
  // with the "Authorization: Bearer ${accessToken}` header
  const userinfo = await client.userinfo<GovUkOneLoginUserInfo>(
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
    const { payload } = await jwtVerify(coreIdentityJWT!, ivPublicKey, {
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
    refreshToken,
    idToken,
    idTokenDecoded,
    userinfo: JSON.stringify(userinfo, null, 2),
    coreIdentity,
  };
}

function buildAuthorizationUrl(
  configuration: AuthMiddlewareConfiguration,
  req:Request,
  res: Response<any, Record<string, any>>,
  client: BaseClient,
  vtr: string,
  claims?: { userinfo: any },
  additionalParameters?: any
  ): string {

  const redirectUri = configuration.authorizeRedirectUri ||
    configuration.redirectUri ||
    getRedirectUri(req);

  // Generate values that protect the flow from replay attacks.
  const nonce = generators.nonce();
  const state = generators.state();

  // Store the nonce and state in a session cookie so it can be checked in callback
  res.cookie(NONCE_COOKIE_NAME, nonce, {
    httpOnly: true,
  });

  res.cookie(STATE_COOKIE_NAME, state, {
    httpOnly: true,
  });

  const authorizationParameters: AuthorizationParameters = {
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state: hash(state),
    nonce: hash(nonce),
    vtr: vtr,
    ui_locales: "en-GB en",
  };

  if(typeof claims === "object"){
    authorizationParameters.claims = JSON.stringify(claims);
  }

  if(typeof additionalParameters === "object") {
    Object.assign(authorizationParameters, additionalParameters);
  }

  // Construct the url and redirect on to the authorization endpoint
  return client.authorizationUrl(authorizationParameters);
}

export async function auth(configuration: AuthMiddlewareConfiguration) {
  // Load private key is required for signing token exchange
  const jwks = [readPrivateKey(configuration.privateKey).export({
    format: "jwk",
  })]

  // Load the public key required to verify the core identity claim
  const ivPublicKey = readPublicKey(
    configuration.identityVerificationPublicKey!
  );

  // Configuration for the authority that authenticates users and issues the tokens.
  const issuer = await createIssuer(configuration);

  // The client that requests the tokens.
  const client:BaseClient = createClient(configuration, issuer, jwks);

  const router = Router();

  router.get("/oauth/login", (req: Request, res: Response) => {

    // Vector of trust for authentication
    const vtr = `["Cl.Cm"]`;

    // Calculate the redirect URL the should be returned to after completing the OAuth flow
    const authorizationUrl = buildAuthorizationUrl(configuration, req, res, client, vtr, undefined, req.query);

      // Redirect to the authorization server
    res.redirect(authorizationUrl);
  });

  router.get("/oauth/iv", (req: Request, res: Response) => {

    // Vector of trust for medium level of confidence
    const vtr = `["P2.Cl.Cm"]`;

    // Requested claims
    const claims = {
      userinfo: {
        // Core identity
        [Claims.CoreIdentity]: { essential: true },
        // Address
        //[Claims.Address]: { essential: true },
      },
    };

    // Calculate the redirect URL the should be returned to after completing the OAuth flow
    const authorizationUrl = buildAuthorizationUrl(configuration, req, res, client, vtr, claims, req.query);

      // Redirect to the authorization server
    res.redirect(authorizationUrl);
  });

  // Callback receives the code and state from the authorization server
  router.get(
    "/oauth/callback",
    asyncHandler(async (req: Request, res: Response) => {
      // Check for an error
      if (req.query["error"]) {
        throw new Error(`${req.query.error} - ${req.query.error_description}`);
      }

      // Get all the parameters to pass to the token exchange endpoint
      const redirectUri =
        configuration.callbackRedirectUri ||
        configuration.redirectUri ||
        getRedirectUri(req);
      const params = client.callbackParams(req);
      const nonce = req.cookies[NONCE_COOKIE_NAME];
      const state = req.cookies[STATE_COOKIE_NAME];

      // Exchange the access code in the url parameters for an access token.
      // The access token is used to authenticate the call to get userinfo.
      const tokenSet = await client.callback(redirectUri, params, {
        state: hash(state),
        nonce: hash(nonce),
      });

      // Call the userinfo endpoint the retreive the results of the flow.
      const result = await getResult(ivPublicKey, client, tokenSet);

      // Display the results.
      res.render("result.njk", result);
    })
  );

  // Use the refresh token to get a new an access token and update the results.
  router.post(
    "/oauth/refresh",
    urlencoded({extended:true}),
    asyncHandler(async (req: Request, res: Response) => {
      const refreshToken = req.body.token;

      // Exchange the refresh token for a new access token.
      const tokenSet = await client.refresh(refreshToken);

      // Call the userinfo endpoint the retreive the results of the flow.
      const result = await getResult(ivPublicKey, client, tokenSet);

      // Display the results.
      res.render("result.njk", result);
    })
  );

  router.post(
    "/oauth/logout",
    urlencoded({extended:true}),
    asyncHandler(async (req: Request, res: Response) => {
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
    })
  );

  router.get(
    "/oauth/post-logout",
    asyncHandler(async (req: Request, res: Response) => {
      res.render("post-logout.njk");
    })
  );

  return router;
}
