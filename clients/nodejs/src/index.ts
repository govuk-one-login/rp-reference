import express, { Application, NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { nunjucks } from "./config/nunjucks";
import { auth } from "./config/auth";

export const app: Application = express();
const port = process.env.NODE_PORT || 3000;

(async () => {
  // Configure Nunjucks view engine
  nunjucks(app, path.join(__dirname, "views"));

  // Configure serving static assets like images and css
  app.use(express.static(path.join(__dirname, "public")));

  // Configure parsing cookies - required for storing nonce in authentication
  app.use(cookieParser());

  // Configure OpenID Connect Authentication middleware
  app.use(
    await auth({
      clientId: process.env.OIDC_CLIENT_ID,
      privateKey: process.env.OIDC_PRIVATE_KEY,
      discoveryEndpoint: process.env.OIDC_ISSUER_DISCOVERY_ENDPOINT,
      redirectUri: process.env.OIDC_REDIRECT_URI,
      identityVerificationPublicKey: process.env.IV_PUBLIC_KEY
    })
  );

  // Application routes
  app.get("/", (req: Request, res: Response) => {
    res.render("home.njk");
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
