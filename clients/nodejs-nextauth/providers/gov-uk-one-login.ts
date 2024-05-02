import type { NextApiRequest, NextApiResponse } from "next"
import { createPrivateKey, createHash } from "node:crypto"
import { OAuthConfig } from "next-auth/providers"
import { generators, TokenSetParameters } from "openid-client"
import * as cookie from "cookie"

const PROVIDER_ID = "govuksignin"
const PROVIDER_NAME = "GOV.UK"
const NONCE_COOKIE_NAME = "next-auth.nonce"
const DEFAULT_DISCOVERY_ENDPOINT =
  "https://oidc.integration.account.gov.uk/.well-known/openid-configuration"

export interface GovUkSignInProfile extends Record<string, any> {
  sub: string
  email: string
  phone_number: string
}

export interface GovUkSignInConfig {
  clientId: string
  privateKey: string
  wellKnown?: string
}

// GOV.UK Sign In uses the private_key_jwt client authentication method this requires a private key.
// https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
export default function GovUkSignInProvider<P extends GovUkSignInProfile>(
  req: NextApiRequest,
  res: NextApiResponse,
  options: GovUkSignInConfig
): OAuthConfig<P> {
  return {
    id: PROVIDER_ID,
    name: PROVIDER_NAME,
    wellKnown: options.wellKnown ?? DEFAULT_DISCOVERY_ENDPOINT,
    type: "oauth",
    authorization: {
      params: {
        nonce: setNonce(req, res),
        scope: "openid email phone",
      },
    },
    idToken: false,
    token: {
      // Extend the default behaviour to include the nonce value in token
      // exchange.
      // See: https://github.com/nextauthjs/next-auth/blob/641d917175026ec974d1d255064b2591db0c56e6/packages/next-auth/src/core/lib/oauth/callback.ts#L105
      async request({
        provider,
        params,
        client,
        checks,
      }): Promise<{ tokens: TokenSetParameters }> {
        // The `nonce` value needs to be stored in the client (in a cookie)
        // passed into the token exchange, to ensure it matches the value
        // provided in the authorize request
        const nonce = getNonce(req, res)
        const redirectUri = provider.callbackUrl
        const tokens = await client.callback(redirectUri, params, {
          ...checks,
          nonce,
        })
        return { tokens }
      },
    },
    profile: (profile) => {
      return {
        id: profile.sub,
        email: profile.email,
        phone: profile.phone_number,
      }
    },
    client: {
      client_id: options.clientId,
      token_endpoint_auth_method: "private_key_jwt",
      token_endpoint_auth_signing_alg: "PS256",
      id_token_signed_response_alg: "ES256",
    },
    jwks: { keys: [parseJwk(options.privateKey)] },
  }
}

function isRoute(req: NextApiRequest, action: string, providerId: string) {
  const { nextauth } = req.query
  return nextauth?.[0] === action && nextauth?.[1] === providerId
}

function hashNonce(nonce: string) {
  return createHash("sha256").update(nonce).digest("base64url")
}

function setNonce(
  req: NextApiRequest,
  res: NextApiResponse<any>
): string | undefined {
  if (isRoute(req, "signin", PROVIDER_ID)) {
    const nonce = generators.nonce()
    const hashedNonce = hashNonce(nonce)
    writeCookie(res, NONCE_COOKIE_NAME, nonce)
    return hashedNonce
  }
  return undefined
}

function getNonce(
  req: NextApiRequest,
  res: NextApiResponse<any>
): string | undefined {
  if (isRoute(req, "callback", PROVIDER_ID)) {
    const nonce = readCookie(req, NONCE_COOKIE_NAME)
    clearCookie(res, NONCE_COOKIE_NAME)
    return hashNonce(nonce)
  }
  return undefined
}

function clearCookie(res: NextApiResponse<any>, name: string) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(name, "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
    })
  )
}

function readCookie(req: NextApiRequest, name: string) {
  const cookieHeader = req.headers.cookie || ""
  const cookies = cookie.parse(cookieHeader)
  return cookies[name]
}

function writeCookie(res: NextApiResponse<any>, name: string, value: string) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(name, value, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    })
  )
}

function parseJwk(privateKey: string) {
  return createPrivateKey({
    key: Buffer.from(privateKey, "base64"),
    type: "pkcs8",
    format: "der",
  }).export({
    format: "jwk",
  })
}
