# GOV.UK One Login example Salesforce authentication provider

> This is provided as a reference only and doesn't represent production ready code. It does not contain all the necessary error handing (none in fact). Runtime and validation errors will cause a fatal error in the AuthProviderPluginClass. Secret and key management has not been implemented. It has not been thoroughly tested and should be used as a guide only.

## Overview

 Salesforce applications can be integrated with GOV.UK One Login through the use of the [Salesforce custom external authentication provider](https://help.salesforce.com/s/articleView?id=sf.sso_provider_plugin_custom.htm&type=5).

 This example authentication provider extends the [Auth.AuthProviderPluginClass](https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_Auth_AuthProviderPluginClass.htm).

## Features

- optionally supports identity verification requests
- the sample is hard coded to request the `https://vocab.account.gov.uk/v1/coreIdentityJWT`, `https://vocab.account.gov.uk/v1/address` and `https://vocab.account.gov.uk/v1/returnCode` claims see [Choose which claims your service can request](https://docs.sign-in.service.gov.uk/before-integrating/choose-which-user-attributes-your-service-can-request/#choose-which-claims-your-service-can-request)
- uses the `private_key_jwt` token authentication method with a RSA private key, see [Generate a key pair](https://docs.sign-in.service.gov.uk/before-integrating/generate-a-key/)
- makes a request to the [`/authorize`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#make-a-request-to-the-authorize-endpoint) endpoint to authenticate your user and get an authorisation code
- makes a request to the [`/token`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#make-a-token-request) endpoint to retrieve id and access tokens
- makes a request to the [`/userinfo`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#retrieve-user-information) endpoint using the access token to retrieve the user attributes as claims
- validates id token signature
- validates id token claims
- validates coreIdentityJWT signature using a key retrieved from the DID endpoint, see [Validate the core identity claim JWT using a public key](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/prove-users-identity/#validate-the-core-identity-claim-jwt-using-a-public-key)
- validates coreIdentityJWT claims

## Before you start

You must [register a client on GOV.UK One Login](https://docs.sign-in.service.gov.uk/before-integrating/set-up-your-service-s-configuration/#register-your-service-to-use-gov-uk-one-login). You can [use the admin tool](https://admin.sign-in.service.gov.uk/register/enter-email-address) to create a client to test with in our integration environment. Registering to use this service requires a gov.uk email address.

You must have access to a Salesforce [developer account](https://developer.salesforce.com/) to configure and use the code example.

## Configuring the example

### 1. Create the required Apex Classes

- navigate to PLATFORM TOOLS - Custom Code - Apex Classes in the Salesforce developer console
- browse to the [Apex-SalesForce](https://raw.githubusercontent.com/govuk-one-login/rp-reference/main/clients/Apex-SalesForce/) example source code
- for each class do the following:
  - select the New button in the developer console to add an Apex class and paste in the source code from GitHub, select the Save button

### 2. Create a custom metadata type

The configuration parameters for the authentication provider are defined using a [Salesforce Custom MetaData Type](https://help.salesforce.com/s/articleView?id=sf.custommetadatatypes_overview.htm&type=5).

- browse to go to PLATFORM TOOLS - Custom Code - Custom Metadata Types
- select the New Custom Metadata Type button
- enter OneLoginClientConfiguration for Label, the value for Object Name is automatically added
- enter OneLoginClientConfigurations for Plural Label
- click Save
- click the New button in the Custom Fields section
- add the custom fields as detailed below, select the Data Type as specified and use the same name
  
| Name | Data Type | Description | Value |
|------|------|------|------|
| ClientID| Text| The GOV.UK One Login Client ID ||
| DIDUrl| URL | URL for DID endpoint| [](https://identity.integration.account.gov.uk/.well-known/did.json) |
| DiscoveryUrl | URL | URL for discovery endpoint| [](https://oidc.integration.account.gov.uk/.well-known/openid-configuration) |
| IdentityIssuer | URL | The issuer specified in the `iss` claim in the coreIdentityJWT | [](https://identity.integration.account.gov.uk/) |
| PrivateKey | Text Area (Long) | Private key for signing JWT tokens| an RSA private key |
| RedirectUrl | URL | Redirect URL for callback after authentication| This is generated by Salesforce |
| Scopes | Text | Default scopes required for authentication| openid email phone |
| VectorOfTrust | Text | The vtr parameter to send in the request to the `authorize` endpoint | `Cl` or `Cl.Cm` or `Cl.Cm.P2` |

### 3. Configure the authentication provider

- browse to Settings - Identity - Auth. Providers
- select the New button
- select provider type of OneLoginProvider from the provider type dropdown. This is the name of the custom AuthProviderPluginClass
- configure the Auth. Provider parameters as shown below

| Attribute | Value |
|-----|-----|
| Name | OneLogin |
| URL Suffix | OneLogin |
| DiscoveryUrl | [](https://oidc.integration.account.gov.uk/.well-known/openid-configuration) |
| DIDUrl | [](https://identity.integration.account.gov.uk/.well-known/did.json) |
| ClientID | Your GOV.UK One Login client-id |
| PrivateKey | Your RSA private key |
| Scopes | openid email phone |
| VectorOfTrust | `Cl` or `Cl.Cm` or `Cl.Cm.P2` - using `Cl.Cm.P2` will trigger the identity verification option |

- on the registration handler field, click on the Automatically create a registration handler template link to create a registration handler class
- click Save, this generates the required Salesforce URLs and displays them at the bottom of the page
- copy the Callback URL
- click Edit and paste the value of the generated Callback URL into the RedirectUrl field
- using the Self Service admin tool and the same redirect URL to your GOV.UK One Login client configuration

### 4. Configure Remote Site Settings

- by default Salesforce will not allow contact to external websites
- you must add the GOV.UK One Login URLs to the Remote Site list: Setup->Security->Remote site settings
  - OneLoginIntegration = `https://oidc.integration.account.gov.uk`
  - IntegrationIdentityKeyEndpoint = `https://identity.integration.account.gov.uk`

### 5. Create a Platform cache partition

The platform cache is used to temporarily store data used by the code example.

- browse to go to PLATFORM TOOLS - Custom Code - Platform Cache
- click New Partition Cache Partition
- enter default for label
- click Save

### 5. Test the integration

- browse to Settings - Identity - Auth. providers
- click OneLogin
- copy the Test-Only Initialization URL
- navigate to the URL in a new browser tab
- the browser will be redirected to GOV.UK One Login to complete the authentication flow
- when returned to Salesforce you will see the data retrieved from GOV.UK One Login in XML format