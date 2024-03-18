export function getLogLevel(): string {
    return process.env.LOGS_LEVEL || "debug";
}

export function getOIDCClientId(): string {
    return process.env.OIDC_CLIENT_ID;
}

export function getNodeEnv(): string {
    return process.env.NODE_ENV || "development";
}

export function getLogoutTokenMaxAge(): number {
    return Number(process.env.LOGOUT_TOKEN_MAX_AGE_SECONDS) || 120;
}

export function getTokenValidationClockSkew(): number {
    return Number(process.env.TOKEN_CLOCK_SKEW) || 10;
}

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message
    return String(error)
}

export function getGlobalLogoutUrl(): string {
    return process.env.GLOBAL_SIGN_OUT_URL || "https://home.integration.account.gov.uk/sign-out";
}

export function getRootRoute(): string {
    return process.env.ROOT_ROUTE || "/";
}

export function getHomeRoute(): string {
    return process.env.HOME_ROUTE || `${getRootRoute()}/home`;
}

export function getServiceUrl(): string {
    return process.env.SERVICE_URL || "https://gov.uk";
}

export function getHomePageUrl(): string {
    return process.env.HOME_PAGE_URL || "https://gov.uk";
}

export function getServiceName(): string {
    return process.env.SERVICE_NAME || "";
}

export function getServiceIntroMessage(): string {
    return process.env.SERVICE_INTRO_MESSAGE || "";
}