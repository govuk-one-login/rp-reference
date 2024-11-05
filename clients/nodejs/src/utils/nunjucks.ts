import { configure, ConfigureOptions } from "nunjucks";
import { Application } from "express";
import { getNodeEnv } from "./config";

export function nunjucks(app: Application, viewsPath: string): void {
  const isDevelopment = getNodeEnv() !== "production";
  const configureOptions: ConfigureOptions = {
    autoescape: true,
    express: app,
    // Don't cache in development mode so we can make changes to templates without restarting the server
    noCache: isDevelopment,
  };
  const viewPaths = [viewsPath, "node_modules/govuk-frontend/"];
  configure(viewPaths, configureOptions);
}
