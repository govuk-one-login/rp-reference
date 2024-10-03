import { ClientMetadata, IssuerMetadata } from 'openid-client';
import type { KeyObject } from 'node:crypto';

export type OneLoginConfiguration = {
    clientId: string;
    privateKey: KeyObject;
    clientMetadata?: Partial<ClientMetadata>;
    redirectUri?: string;
    authorizeRedirectUri?: string;
    callbackRedirectUri?: string;
    identityVerificationPublicKey?: KeyObject;
} & (
    | {
    issuerMetadata: IssuerMetadata;
}
    | {
    discoveryEndpoint: string;
    issuerMetadata?: Partial<IssuerMetadata>;
}
    );