# GOV.UK One Login example Salesforce authentication provider

> This is provided as a reference only and doesn't represent production quality code. It does not contain all the necessary error handing, tests etc that are required by production quality code.

## Overview

 Salesforce applications can be integrated with GOV.UK One Login through the use of the Salesforce [custom external authentication provider](https://help.salesforce.com/s/articleView?id=sf.sso_provider_plugin_custom.htm&type=5).

 This example authentication provider extends the [`Auth.AuthProviderPluginClass`](https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_Auth_AuthProviderPluginClass.htm).

## Features

- Optionally supports identity verification
- Uses the `private_key_jwt` token authentication method with a RSA private key
- Makes a request to the [`/authorize`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#make-a-request-to-the-authorize-endpoint) endpoint to get an authorisation code
- Exchanges the authorisation code for id and access tokens using the [`/token`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#make-a-token-request) endpoint
- Retrieves claims from the [`/userinfo`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#retrieve-user-information) endpoint using the access token
- Validates the id-token signature and claims
- Validates the coreIdentityJWT signtaure and claims
- Retrieves identity public signing key from DID endpoint
- **TODO** Log out using the`/logout` endpoint

> NB. this sample is not production ready code. It has not been thoroughly tested and should be used as a guide only. There is very little error handling implemented. Most errors will cause a fatal error in the AuthProviderPluginClass.

## Before you start\

You must [register a client on GOV.UK One Login](https://docs.sign-in.service.gov.uk/before-integrating/set-up-your-service-s-configuration/#register-your-service-to-use-gov-uk-one-login). You can [use the self service admin tool](https://admin.sign-in.service.gov.uk/register/enter-email-address) to create a client to test with in our integration environment.

You must have access to a Salesforce [developer environment](https://developer.salesforce.com/) in which to configure the code.

## Configuring the example

### 1. Add the  GOV.UK One Login example authentication provider for `OneLoginProvider`

Navigate to `PLATFORM - TOOLS - Custom Code - Apex Classes` in the Salesforce developer console.

Browse to the [`Apex-SalesForce`](https://raw.githubusercontent.com/govuk-one-login/rp-reference/main/clients/Apex-SalesForce/) source code.

For each class do the following:

- select the New button in the developer console to add an Apex class and paste in the source code from GitHub, select the Save button

### 2. Configure a custom metadata type

The configuration parameters for the authentication provider are defined using a [Salesforce Custom MetaData Type](https://help.salesforce.com/s/articleView?id=sf.custommetadatatypes_overview.htm&type=5).

- browse to go to `PLATFORM - TOOLS - Custom Code - Custom Metadata Types`
- select the New Custom Metadata Type button
- the custom meta data type holds the configuration data for the custom authentication provider
- the name of the custom meta data type API name `OneLoginClientConfiguration__mdt` is referenced in the `OneLoginProvider.cls` code sample
- add the custom fields detailed below
  
|name | type |desc|value|
|-----|------|----|-----|
|`DiscoveryUrl`| text |URL for discovery endpoint| `https://oidc.integration.account.gov.uk/.well-known/openid-configuration` |
|`DIDUrl`| text |URL for DID endpoint| `https://identity.integration.account.gov.uk/.well-known/did.json` |
|`IdentityIssuer` | text | The issuer in the coreIdentityJWT | `https://identity.integration.account.gov.uk/` |
|`User_Info_Endpoint_URL` | text|  URL for user information endpoint| `https://oidc.integration.account.gov.uk/userinfo` |
|`Scopes` | text| Default scopes required for authentication| `openid email phone` |
|`VectorOfTrust` | text | The vtr parameter to sedn in the request to the `authorize` endpoint | `Cl` or `Cl.Cm` or `Cl.Cm.P2` |
|`RedirectUrl` | text | Redirect URL for callback after authentication| {REDIRECT_URI} |
|`ClientID`| text| The One Login Client ID ||
|`PrivateKey` | textarea | Private key for signing JWT tokens| an RSA private key |

### 3. Configure the authentication provider

- browse to `Settings - Identity - Auth. providers`
- select the `New` button
- Select provider type of `OneLoginProvider` from the provider type dropdown. This is the name of the custom `AuthProviderPluginClass`.
- enter OneLogin for the name
- configure the rest of the parameters
  - URL Suffix = `OneLogin`
  - DiscoveryUrl = `https://oidc.integration.account.gov.uk/.well-known/openid-configuration`
  - DIDUrl = `https://identity.integration.account.gov.uk/.well-known/did.json`
  - ClientID = Your GOV.UK One Login client-id
  - PrivateKey = Your RSA private key
  - Scopes = `openid email phone`
  - VectorOfTrust = `Cl` or `Cl.Cm` or `Cl.Cm.P2`
  - Redirect_URL = `{REDIRECT_URI}`

- On the registration handler field, click on the "Automatically create a registration handler template" link to create the registration handle class on save of the auth provider
- click Save. This will populate the required Salesforce urls. Copy the Callback URL.
- click Edit. Paste the value of the generated Callback URL into the RedirectUrl field.
- using the Self Service admin tool make sure your One Login configuration has the same redirect url configured.

### 4. Configure Remote Site Settings

- by default Salesforce will not allow contact to external websites
- you need to add the GOV.UK One Login URLs to the Remote Site list: `Setup -> Security -> Remote site settings`
  - OneLoginIntegration = `https://oidc.integration.account.gov.uk`
  - IntegrationIdentityKeyEndpoint = `https://identity.integration.account.gov.uk`

### 5. Create a Platform cache partition

- browse to go to `PLATFORM - TOOLS - Custom Code - Platform Cache`
- click New Partition Cache Partition
- enter default for label, click Save

### 5. Test the integration

Browse to `https://{placeholder-dev-ed}.develop.my.salesforce.com/services/auth/test/ONELOGIN`
