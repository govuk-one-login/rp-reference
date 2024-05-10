# JWTGovUK Salesforce Apex Class

## Overview
The `JWTGovUK` Salesforce Apex class is designed to facilitate JSON Web Token (JWT) authentication with a GOV.UK One Login It extends the `Auth.AuthProviderPluginClass`, making it suitable for use as an authentication provider plugin within the Salesforce platform. This is intended as a reference and doesn't represent production quality code.

## Features
- Initiates authentication with the GOV.UK One Login.
- Handles callback from the authentication provider.
- Retrieves user information after successful authentication.

## Usage
1. **Installation**: Add the `JWTGovUK` class to your Salesforce organization.
2. **Configuration**:
   - Ensure that the necessary custom metadata types are set up correctly (`Jwtflowexample__mdt`).
   - Set up the authentication provider configuration parameters (`Authorize_Endpoint_URL__c`, `Consumer_Key__c`, `Redirect_URL__c`, `Default_Scopes__c`, `Token_Endpoint_URL__c`, `PrivateKeyTest__c`, `User_Info_Endpoint_URL__c`).
3. Alternatively, you can import the CustomMetaDatatype.xls
   - Install Custom Metadata Type Data Loader as per instruction here: https://appexchange.salesforce.com/appxListingDetail?listingId=a0N4V00000HrQTdUAN
4. **Integration**:
   - Use the `initiate` method to initiate the authentication flow.
   - Implement the callback handling logic in the `handleCallback` method.
   - Retrieve user information using the `getUserInfo` method.

## Dependencies
- Generate key pair using OpenSSL
- Salesforce Apex environment.
- Integration with GOV.UK One Login.

## Configuration Parameters
- `Authorize_Endpoint_URL__c`: URL for authorization endpoint.
- `Consumer_Key__c`: Consumer key provided by the authentication provider.
- `Redirect_URL__c`: Redirect URL for callback after authentication.
- `Default_Scopes__c`: Default scopes required for authentication.
- `Token_Endpoint_URL__c`: URL for token endpoint.
- `PrivateKeyTest__c`: Private key for signing JWT tokens.
- `User_Info_Endpoint_URL__c`: URL for user information endpoint.

## Custom Exceptions
- `RegPluginException`: Exception thrown for registration plugin errors.
- `CustomException`: Generic custom exception for handling errors.

## Utility Methods
- `generateJWT`: Generates a JWT token for authentication.
- `generateRandomJti`: Generates a random value for the JWT ID (jti).
- `generateNonce`: Generates a random string for nonce.
- `base64UrlEncode`: Encodes Blob data into a base64 URL-safe string.
- `getTokenValueFromResponse`: Extracts token values from HTTP response body.

