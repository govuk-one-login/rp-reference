export function getLogLevel(): string {
    return process.env.LOGS_LEVEL || "debug";
}

export function getOIDCClientId(): string {
    return process.env.OIDC_CLIENT_ID || "HGIOgho9HIRhgoepdIOPFdIUWgewi0jw";
}

export function getNodeEnv(): string {
    return process.env.NODE_ENV || "development";
}

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message
    return String(error)
}

export function getGlobalLogoutUrl(): string {
    return process.env.GLOBAL_SIGN_OUT_URL || "https://home.integration.account.gov.uk/sign-out";
}

export function getServiceUrl(): string {
    return process.env.SERVICE_URL || "http://localhost:3001";
}