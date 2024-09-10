import express, { Application, NextFunction, Request, Response } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "node:path";
import { nunjucks } from "../shared/utils/nunjucks";
import { auth } from "../shared/auth";
import { getNodeEnv, getRootRoute, getHomeRoute, getHomePageUrl, getServiceUrl, getServiceName } from "../shared/utils/config"; 
import { AuthenticatedUser, isAuthenticated } from "../shared/utils/helpers";
export const app: Application = express();
const port = process.env.NODE_PORT || 3000;

declare module 'express-session' {
  interface SessionData {
    user: any,
    identity: any;
  }
};

(async () => {
  // Configure Nunjucks view engine
  const nunjucksPath = path.join(__dirname, "../shared/views");
  nunjucks(app, nunjucksPath);

  // Configure serving static assets like images and css
  const publicPath = path.join(__dirname, "../../public");
  app.use(express.static(publicPath));

  // Configure body-parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Configure parsing cookies - required for storing nonce in authentication
  app.use(cookieParser());
  app.use(session({
    name: process.env.SESSION_NAME + "-session",
    secret: process.env.SESSION_SECRET!, 
    cookie: {
      maxAge: 1000 * 120 * 60, // 2 hours
      secure: false,
      httpOnly: true
    },
    resave: false,
    saveUninitialized: true
  }));

  // Configure OpenID Connect Authentication middleware
  app.use(
    await auth({
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      tokenAuthMethod: process.env.OIDC_TOKEN_AUTH_METHOD,
      privateKey: process.env.OIDC_PRIVATE_KEY,
      idTokenSigningAlg: process.env.OIDC_ID_TOKEN_SIGNING_ALG,
      discoveryEndpoint: process.env.OIDC_ISSUER_DISCOVERY_ENDPOINT,
      authorizeRedirectUri: process.env.OIDC_AUTHORIZE_REDIRECT_URI,
      postLogoutRedirectUri: process.env.OIDC_LOGOUT_REDIRECT_URI,
      identityVerificationPublicKey: process.env.IV_PUBLIC_KEY,
      identityVerificationIssuer: process.env.IV_ISSUER,
      uiLocales: process.env.UI_LOCALES,
      auth_vtr: process.env.AUTH_VECTOR_OF_TRUST,
      idv_vtr: process.env.IDENTITY_VECTOR_OF_TRUST
    })
  );

  // Redirect root to start
  app.get("/", (req: Request, res: Response) => {
    res.redirect(`${getRootRoute()}`);
  });

  app.get(`${getRootRoute()}`, (req: Request, res: Response) => {
    res.render("start.njk", 
      {
        authenticated: isAuthenticated(req, res),
        // Start page config
        serviceName: getServiceName(), 
        serviceIntroMessage: process.env.SERVICE_INTRO_MESSAGE,  
        serviceType: process.env.SERVICE_TYPE,
        // GOV.UK header config
        homepageUrl: `${getHomePageUrl()}`,
        serviceUrl: `${getServiceUrl()}`
      }
    );
  });

  // Application routes
  app.get(`${getHomeRoute()}`, AuthenticatedUser, (req: Request, res: Response) => {
    res.render(
      "dashboard.njk", 
      { 
        authenticated: isAuthenticated(req, res),
        // Service header config
        isProduction: getNodeEnv() == "development" ? false : true, 
        serviceName: getServiceName()
      }
    )
  });

  // Generic error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    res.render("error.njk", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
  });

  const server = await app.listen(port);
  const listeningAddress = server.address();
  if (listeningAddress && typeof listeningAddress === "object") {
    console.log(
      `Server listening ${listeningAddress.address}:${listeningAddress.port}`
    );
  }
})();
