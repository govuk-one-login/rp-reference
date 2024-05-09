# GOV.UK One Login Relying Party Multi-client Application

A Node.js TypeScript application using GOV.UK One Login to authenticate users.

This is intended as a reference and doesn't represent production quality code.

This example contains two client appliocations:

1. Camelid dashboard - an authentication only service that takes the user to a dashboard used to access the other service.
1. Alpaca tracker - an athentication and identity verification service. Once authenticated the main service landing page outputs the data returned by GOV.UK One Login.

## Development

``` bash
npm install
npm run dev-dashboard
npm run dev-alpaca
```

## Configuration

To configure the two client applications you will need to create a .env file in the 2 client application folders:

`clients\nodejs-multiclient\services\camelid-dashboard\` and
`clients\nodejs-multiclient\services\alpaca-tracker\`

You can use the file `clients\nodejs-multiclient\example.env` as a template.

| Option | Suggested value | Description |
| ------ | ----------- | ----------- |
| NODE_ENV | development | Flag to stop caching of Nunjucks templates and to change link to home page in the header  |
| NODE_PORT | 3001 | Port that client application runs on |
| OIDC_CLIENT_ID |  | The client-id for your service in GOV.UK One Loing integration environment |
| OIDC_PRIVATE_KEY |  | The private key you use to sign the client-assertion as part of the client authentication process when using `private_key_jwt`. This would normally be stored in a Key Management Store or similar. |
| OIDC_CLIENT_SECRET |  | The client secret you use as part of the client authentication process when using `client_secret_post`. This would normally be stored in a Key Management Store or similar. |
| OIDC_ISSUER_DISCOVERY_ENDPOINT | https://oidc.integration.account.gov.uk/.well-known/openid-configuration | The OpenID Connect Discovery enpoint URL |
| OIDC_TOKEN_AUTH_METHOD | `private_key_jwt` | The client authentication method can be either `private_key_jwt` or `client_secret_post` |
| OIDC_ID_TOKEN_SIGNING_ALG | ES256 | The signing algorithm that GOV.UK One Login uses to sign the id-token. Can be either ES256 or RS256 |
| IV_PUBLIC_KEY |  | The public key used to sign the coreIdentityJWT claim returned by a userinfo request when identity verification is requested |
| IV_ISSUER | https://identity.integration.account.gov.uk/ | The value of the issuer claim in the coreIdentityJWT |
| OIDC_AUTHORIZE_REDIRECT_URI | http://localhost:3001/oauth/callback | The redirect URL registered with GOV.UK One Login. Your user is redirected to this url after authenticating. |
| OIDC_LOGOUT_REDIRECT_URI | http://localhost:3001/logged-out | The post logout redirect URL registered with GOV.UK One Login. Your user is redirected to this url after signing out. |
| LOGOUT_TOKEN_MAX_AGE_SECONDS | 120 | The maximum age in seconds of the logout token |
| TOKEN_CLOCK_SKEW | 10 | The allowed tolerance for time variation used when verifying the logout token. Expressed in seconds. |
| SERVICE_NAME |  | The service name shown on the service start page |
| SERVICE_INTRO_MESSAGE | Login or register to access the blah blah service | Text displayed on the service start page |
| SESSION_SECRET |  | The secret used to secure the express-session store |
| SERVICE_URL | http://localhost:3001 | Service URL used on the GOV.UK header |
| HOME_PAGE_URL=https://gov.uk | Home URL used on the GOV.UK header |
| SESSION_NAME=session-name | The name of the express-session store |
| ROOT_ROUTE | /start | Path to the service start page |
| HOME_ROUTE | /blahblah/home | Path to the service home page |
| SERVICE_TYPE | verify | The type of service either login (authentication only ) or verify (identity verification) |
| UI_LOCALES | en-GB | Language that GOV.UK One Login user journey is shown in. Can be either cy or en-GB |

## Known issues

The back channel logout functionality is a work in progress. Currently the implementation fails to find and clean up the express session associated with the logout token. The current functionality may be useful if you need to see the structure of the logout token payload.

N.B. To use the back channel logout functionality you will need an publicly accessible (internet connected) `back_channel_logout_uri` to send the logout-token to.
