# GOV.UK One Login example Salesforce authentication provider

> This is provided as a reference only and doesn't represent production quality code. It does not contain all the necessary error handing, tests etc that are required by production quality code.


## Overview

 Salesforce applications can be integrated with GOV.UK One Login through the use of the Salesforce [Authentication Provider SSO with Salesforce as the Relying Party](https://help.salesforce.com/s/articleView?id=sf.sso_authentication_providers.htm&type=5).
 
 This example authentication provider extends the [`Auth.AuthProviderPluginClass`](https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_Auth_AuthProviderPluginClass.htm) using `private_key_jwt` shows how a Salesforce application can use [JSON Web Token (JWT)](https://en.wikipedia.org/wiki/JSON_Web_Token) to authenticate with GOV.UK One Login. 
 
 See the `JWTGovUK` class in the [`Private_key_JWT.cls`](Private_key_JWT.cls) file for the implementatation.

## Features
- Uses the identity journey
- Uses the `private_key_jwt` token authentication method with a private RSA key
- Makes a request to the [`/authorize`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#make-a-request-to-the-authorize-endpoint) endpoint to get an authorisation code
- Exchanges the authorisation code for an access token using the [`/token`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#make-a-token-request) endpoint
- Retrieves claims from the [`/userinfo`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#retrieve-user-information) endpoint using the access token
- **TODO** Validate the token
- **TODO** Log out using the`/logout` 

## Before you start
You must [register a client on GOV.UK One Login](https://docs.sign-in.service.gov.uk/before-integrating/set-up-your-service-s-configuration/#register-your-service-to-use-gov-uk-one-login). You can [use the self service admin tool](https://admin.sign-in.service.gov.uk/register/enter-email-address) to create a client to test with in our integration environment.

You must have access to a Salesforce [developer environment](https://developer.salesforce.com/) in which to configure the code.

## Configuring the example


### 1. Add the  GOV.UK One Login example authentication provider for `private_key_jwt`

- browse to the [`Private_Key_JWT.cls`](https://raw.githubusercontent.com/govuk-one-login/rp-reference/main/clients/Apex-SalesForce/Private_Key_JWT.cls) class source code, select all the code and copy to the clipboard
- [log into Salesforce](https://developer.salesforce.com)
- go to "[PLATFORM - TOOLS - Custom Code - Apex Classes](https://gds-c-dev-ed.develop.lightning.force.com/lightning/setup/ApexClasses/home)"
- select the "[New](https://gds-c-dev-ed.develop.lightning.force.com/lightning/setup/ApexClasses/page?address=%2Fsetup%2Fbuild%2FeditApexClass.apexp%3FretURL%3D%252Fsetup%252Fbuild%252FlistApexClass.apexp%26sfdcIFrameOrigin%3Dhttps%253A%252F%252Fgds-c-dev-ed.develop.lightning.force.com%26clc%3D1)" button to add an Apex class and paste in the source code from the clipboard, select the "Save" button.

### 2. Configure a custom metadata type

The configuration parameters for the authentication provider are defined using a [Salesforce Custom MetaData Type](https://help.salesforce.com/s/articleView?id=sf.custommetadatatypes_overview.htm&type=5).


- browse to go to "[PLATFORM - TOOLS - Custom Code - Custom Metadata Types](https://gds-c-dev-ed.develop.lightning.force.com/lightning/setup/CustomMetadata/home)"
- select the "[New Custom Metadata Type](https://gds-c-dev-ed.develop.lightning.force.com/lightning/setup/CustomMetadata/page?address=%2F01I%2Fe%3Fsetupid%3DCustomMetadata%26retURL%3D%252F_ui%252Fplatform%252Fui%252Fschema%252Fwizard%252Fentity%252FCustomMetadataTypeListPage%253FretURL%253D%25252Fsetup%25252Fhome%2526appLayout%253Dsetup%2526tour%253D%2526isdtp%253Dp1%2526sfdcIFrameOrigin%253Dhttps%25253A%25252F%25252Fgds-c-dev-ed.develop.lightning.force.com%2526sfdcIFrameHost%253Dweb%2526nonce%253D2717ed99b68d45fb9cea311a523e7da2aa1aec600fe219c6d7b4f5f4e83ff874%2526ltn_app_id%253D%2526clc%253D1)" button

Ensure that the necessary custom metadata type  (`Jwtflowexample__mdt`) is set up correctly.
  
|name | type |desc|value|
|-----|------|----|-----|
|`Authorize_Endpoint_URL`| text |URL for authorization endpoint| `https://oidc.integration.account.gov.uk/authorize` |
|`Token_Endpoint_URL` | text | URL for token endpoint| `https://oidc.integration.account.gov.uk/token` |
|`User_Info_Endpoint_URL` | text|  URL for user information endpoint| `https://oidc.integration.account.gov.uk/userinfo` |
|`Default_Scopes` | text| Default scopes required for authentication| `openid email phone` |
|`Redirect_URL` | text |Redirect URL for callback after authentication| {REDIRECT_URI} |
|`Consumer_Key`| text| The One Login Client ID ||
|`PrivateKeyTest` | textarea | Private key for signing JWT tokens| an RSA private key |


### 3. Configure the authentication provider

- browse to [Settings - Identity - Auth. providers](https://gds-c-dev-ed.develop.lightning.force.com/lightning/setup/AuthProviders/home)
- select the `new` button
- Select provider type of `JWTGovUK` from the provider type dropdown
- enter ONELOGIN for the name
- configure the rest of the parameters
  - URL Suffix = `ONELOGIN` 
  - Authorize_Endpoint_URL = 	`https://oidc.integration.account.gov.uk/authorize`
  - Token_Endpoint_URL	= `https://oidc.integration.account.gov.uk/token`
  - User_Info_Endpoint	= `https://oidc.integration.account.gov.uk/userinfo`
  - Logout_Endpoint_URL	= `https://oidc.integration.account.gov.uk/logout`
  - Consumer_Key	= One Login cleint ID
  - PrivateKeyTest	= RSA private key
  - Default_Scopes	= `openid email phone`
  - Redirect_URL	= `https://gds-b-dev-ed.develop.my.salesforce.com/services/authcallback/GOVUK_JWT` 
- On the registration handler field, click on the "Automatically create a registration handler template" link to create the registration handle class on save of the auth provider


### 4. Test the integration

Browse to https://gds-c-dev-ed.develop.my.salesforce.com/services/auth/test/ONELOGIN 

