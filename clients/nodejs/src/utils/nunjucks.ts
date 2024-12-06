import nunjucks from "nunjucks";
import { Application } from "express";
import { getNodeEnv } from "./config.js";

export function setupNunjucks(app: Application, viewsPath: string): void {
  const isDevelopment = getNodeEnv() !== "production";
  const configureOptions: nunjucks.ConfigureOptions = {
    autoescape: true,
    express: app,
    // Don't cache in development mode so we can make changes to templates without restarting the server
    noCache: isDevelopment,
  };
  const viewPaths = [viewsPath, "node_modules/govuk-frontend/"];
  nunjucks.configure(viewPaths, configureOptions);
}
