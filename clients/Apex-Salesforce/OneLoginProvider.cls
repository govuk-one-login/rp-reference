global class OneLoginProvider extends Auth.AuthProviderPluginClass {

    public class RegPluginException extends Exception {}
    public class CustomException extends Exception {}
    public class JWTVerificationException extends Exception {}

    // Declare global variable to hold tokens
    static String accessToken;
    static String idToken;

    //A call to the CustomMetadataTypes 
    global String getCustomMetadataType() {
        return 'OneLoginClientConfiguration__mdt';
    }
    
    private String base64UrlEncode(Blob input) {
        // Encode the input Blob into a base64 string
        String encoded = EncodingUtil.base64Encode(input);
    
        // Replace characters as per base64url encoding rules
        encoded = encoded.replace('+', '-');
        encoded = encoded.replace('/', '_');
        encoded = encoded.removeEnd('=');    
        return encoded;
    }

    global PageReference initiate(Map<String, String> authProviderConfiguration, String stateToPropagate) {
        
        // Parse the provider configuration
        // String tokenUrl;
        // String userinfoUrl;
        // String logoutUrl;
        String clientId;
        String redirectUrl;
        String scope;
        String authorizeUrl;
        Boolean requestIdentityVerification;

        clientId = authProviderConfiguration.get('ClientId__c');
        System.debug('clientId=' + clientId);

        redirectUrl = authProviderConfiguration.get('RedirectUrl__c');
        System.debug('redirectUrl=' + redirectUrl);

        scope = authProviderConfiguration.get('Scopes__c');
        System.debug('scope=' + scope);

        authorizeUrl = authProviderConfiguration.get('AuthorizeUrl__c');
        System.debug('authorizeUrl=' + authorizeUrl);

        requestIdentityVerification = Boolean.valueOf(authProviderConfiguration.get('RequestIdentityVerification__c'));
        System.debug('requestIdentityVerification=' + requestIdentityVerification);   
                
        // Generate a random nonce
        String nonce = UUID.randomUUID().toString();
        System.debug('nonce=' + nonce);

        String vtr;

        if (requestIdentityVerification) {
            vtr = '["Cl.Cm.P2"]';
        } else {
            vtr = '["Cl.Cm"]';
        }

        String url = authorizeUrl + '?client_id=' + clientId + 
                                    '&response_type=code' +
                                    '&redirect_uri=' + redirectUrl + 
                                    '&scope='+ scope + 
                                    '&state=' + stateToPropagate  + 
                                    '&nonce=' + nonce + 
                                    '&vtr=' + vtr;
              
        if (requestIdentityVerification) {
            url = url + '&claims={"userinfo":{"https://vocab.account.gov.uk/v1/coreIdentityJWT":null,"https://vocab.account.gov.uk/v1/address":null,"https://vocab.account.gov.uk/v1/returnCode":null}}';
        }

        return new PageReference(url);
    }

    global Auth.AuthProviderTokenResponse handleCallback(Map<String, String> authProviderConfiguration, Auth.AuthProviderCallbackState state) {
    
        System.debug('handleCallback starting');
    
        String clientId;
        String redirectUrl;
        String tokenUrl;

        // setup up configuration
        clientId = authProviderConfiguration.get('ClientId__c');
        System.debug('clientId=' + clientId);
        redirectUrl = authProviderConfiguration.get('RedirectUrl__c');
        System.debug('redirectUrl=' + redirectUrl);
        tokenUrl = authProviderConfiguration.get('TokenUrl__c');
        System.debug('tokenUrl=' + tokenUrl);

        String privateKey = authProviderConfiguration.get('PrivateKey__c');
        // the returned state is automatically check by Salesforce authentication system
        String stateReturned = state.queryParameters.get('state');

        // Remove BEGIN and END markers and newline characters from the private key string
        privateKey = privateKey.replaceAll('-----BEGIN PRIVATE KEY-----', '');
        privateKey = privateKey.replaceAll('-----END PRIVATE KEY-----', '');
        privateKey = privateKey.replaceAll('\\n', '');

        Blob privateKeyBlob = EncodingUtil.base64Decode(privateKey);
        
        // Convert Blob to Base64 encoded string
        String privateKeyBase64 = EncodingUtil.base64Encode(privateKeyBlob);

        Map<String, String> queryParams = state.queryParameters;
        String code  = queryParams.get('code');
        String jwtToken = generateJWT(clientId, privateKeyBase64, tokenUrl);

        HttpRequest req = new HttpRequest();
        req.setEndpoint(tokenUrl);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

        String reqBody = 'client_id=' + clientId + '&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=' + jwtToken + '&grant_type=authorization_code&code=' + code + '&redirect_uri=' + redirectUrl;

        req.setBody(reqBody);

        Http http = new Http();
        HTTPResponse res = http.send(req);

        String responseBody = res.getBody();
        System.debug('Token response:' + responseBody);   

        accessToken = getTokenValueFromResponse(responseBody, 'access_token', false);
        idToken = getTokenValueFromResponse(responseBody, 'id_token', false);

        return new Auth.AuthProviderTokenResponse('OneLogin', accessToken, idToken, stateReturned);
    }

    global Auth.UserData getUserInfo(Map<String, String> authProviderConfiguration, Auth.AuthProviderTokenResponse response) {
        
        System.debug('getUserInfo starting');
        
        String userinfoUrl;
        Boolean requestIdentityVerification;

        userinfoUrl = authProviderConfiguration.get('UserinfoUrl__c');
        System.debug('userinfoUrl=' + userinfoUrl);
        requestIdentityVerification = Boolean.valueOf(authProviderConfiguration.get('RequestIdentityVerification__c'));
        System.debug('requestIdentityVerification=' + requestIdentityVerification);   
       
        String accessToken = response.oauthToken;
        System.debug('accessToken=' + accessToken);

        HttpRequest req = new HttpRequest();
        req.setEndpoint(userinfoUrl);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);

        Http http = new Http();
        HTTPResponse res;

        try {
            res = http.send(req);
        } catch (Exception e) {
            throw new CustomException('Failed to send HTTP request to userinfo endpoint: ' + e.getMessage());
        }
        
        if (res.getStatusCode() != 200) {
            throw new CustomException('HTTP request to userinfo endpoint failed with status code: ' + res.getStatusCode());
        } else {
            System.debug('Userinfo response=' + res.getBody());
        }
        
        // Parse the JSON response here
        Map<String, Object> userinfo;
        try {
            userinfo = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        } catch (Exception e) {
            throw new CustomException('Failed to parse JSON response from userinfo endpoint: ' + e.getMessage());
        }
        
        // Check for error response
        if (userinfo.containsKey('error')) {
            throw new CustomException('Error response from userinfo endpoint: ' + userinfo.get('error') + 
                                       ', Description: ' + userinfo.get('error_description'));
        }
        
        // Extract user information from the response
        String userId = (String) userinfo.get('sub');
        String email = (String) userinfo.get('email');
        String phone = (String) userinfo.get('phone_number');

        String RETURN_CODE_CLAIM = 'https://vocab.account.gov.uk/v1/returnCode';
        String ADDRESS_CLAIM = 'https://vocab.account.gov.uk/v1/address';
        String CORE_IDENTITY_CLAIM = 'https://vocab.account.gov.uk/v1/coreIdentityJWT';
       
        List<Object> returnCodes;        
        String address;
        Object coreIdentityJWT;
        Map<String, String> attributeMap = new Map<String, String>();

        if (requestIdentityVerification) {
            //returnCodeJson  = (String) userinfo.get(RETURN_CODE_CLAIM);
            if (userinfo.containsKey(RETURN_CODE_CLAIM)) {
                returnCodes = (List<Object>) userinfo.get(RETURN_CODE_CLAIM);
                if (!returnCodes.isEmpty()) {
                    // we have a return code - add return code processing logic here
                    System.debug(returnCodes.toString());
                }
            }
            if (userinfo.containsKey(ADDRESS_CLAIM)) {
                address = userinfo.get(ADDRESS_CLAIM).toString();
                System.debug(address);
                // copy address to attribute map
                attributeMap.put('address', address);
            }
            if (userinfo.containsKey(CORE_IDENTITY_CLAIM)) {
                coreIdentityJWT = (Object) userinfo.get(CORE_IDENTITY_CLAIM);
                System.debug(coreIdentityJWT.toString());
                if (validateCoreIdentity(coreIdentityJWT)) {
                    // copy identity to attribute map
                    attributeMap.put('coreIdentity', coreIdentityJWT.toString());
                }
            }
        }
        // Construct Auth.UserData object with retrieved information
        return new Auth.UserData(userId, 'FirstName', 'LastName', 'FullName', email, 'link', email, 'Locale', 'OneLogin', 'siteLoginUrl', attributeMap);
    }

    private Boolean validateIdToken(String idToken, String publicKey) {

        try {
            // Split the JWT into header, payload, and signature
            List<String> tokenParts = idToken.split('\\.');
            if (tokenParts.size() != 3) {
                throw new JWTVerificationException('Invalid token format');
            }
            
            String header = tokenParts[0];
            String payload = tokenParts[1];
            String signature = tokenParts[2];

            // Base64 decode the header and payload
            String decodedHeader = EncodingUtil.urlDecode(header, 'UTF-8');
            String decodedPayload = EncodingUtil.urlDecode(payload, 'UTF-8');

            // Create the data to verify (header + "." + payload)
            String dataToVerify = header + '.' + payload;

            // Verify the signature using ES256
            if (!verifySignature(dataToVerify, signature, publicKey)) {
                throw new JWTVerificationException('Signature verification failed');
            }

            // Deserialize the payload to a map
            Map<String, Object> claims = (Map<String, Object>) JSON.deserializeUntyped(EncodingUtil.base64Decode(payload).toString());

            // Validate the claims (e.g., iss, exp, aud)
            if (!validateClaims(claims)) {
                throw new JWTVerificationException('Claim validation failed');
            }

            return true;
        } catch (Exception e) {
            System.debug('JWT verification failed: ' + e.getMessage());
            return false;
        }
    }
    
    private static Boolean verifySignature(String data, String signature, String publicKey) {
        // Implement the ES256 signature verification
        // Note: Salesforce does not have built-in support for ES256, so you will need to use a library or service that supports ES256 verification.
        // For the purpose of this example, we will assume you have a method `verifyES256Signature` that performs this verification.

        // Decode the signature
        Blob decodedSignature = EncodingUtil.base64Decode(signature);

        // Call the external method/library to verify the signature
        return verifyES256Signature(data, decodedSignature, publicKey);
    }
    
    private static Boolean validateClaims(Map<String, Object> claims) {
        // Validate the issuer (iss), audience (aud), expiration (exp), etc.
        // Example: Validate the expiration time
        Long exp = (Long) claims.get('exp');
        if (exp == null || exp < (DateTime.now().getTime() / 1000)) {
            return false;
        }

        // Add additional claim validations as needed
        return true;
    }
    
    private static Boolean verifyES256Signature(String data, Blob signature, String publicKey) {
        // Placeholder for actual ES256 signature verification logic
        // Implement this using an appropriate library or service
        // For example, you could use a third-party library or call an external service to verify the signature

        // This example does not include the actual ES256 verification implementation
        throw new JWTVerificationException('ES256 verification not implemented');
    }

    private Boolean validateCoreIdentity(Object coreIdentityJWT) {
        // implement logic here to validate coreIdentityJWT
        return true;
    }

    private String generateJWT(String clientId, String privateKey, String audience) {
        // Create a random value for the JWT ID (jti)
        String jti = UUID.randomUUID().toString();
        System.debug('jti=' + jti);
    
        // Create JWT payload (claims)
        Long iat = DateTime.now().getTime() / 1000; // Current timestamp in seconds
        Long exp = iat + 3600; // Expiry time: 1 hour from issuance (adjust as needed)
    
        // Construct JWT header
        Map<String, Object> headerMap = new Map<String, Object>();
        headerMap.put('alg', 'RS256');
        headerMap.put('typ', 'JWT');
        String headerJson = JSON.serialize(headerMap);
        String header = base64UrlEncode(Blob.valueOf(headerJson));
        
        // Construct JWT payload (claims)
        Map<String, Object> payloadMap = new Map<String, Object>();
        payloadMap.put('aud', audience);
        payloadMap.put('iss', clientId);
        payloadMap.put('sub', clientId);
        payloadMap.put('exp', exp); // Expiration timestamp
        payloadMap.put('iat', iat); // Issued at timestamp
        payloadMap.put('jti', jti);
        String payloadJson = JSON.serialize(payloadMap);
        String payload = base64UrlEncode(Blob.valueOf(payloadJson));
    
        // Combine header and payload with a dot separator
        String unsignedToken = header + '.' + payload;
    
        // Convert the private key from a string to a Blob
        Blob privateKeyBlob = EncodingUtil.base64Decode(privateKey);
    
        // Sign the digest using RSA-SHA256 with the private key
        Blob signatureBlob = Crypto.sign('RSA-SHA256', Blob.valueOf(unsignedToken), privateKeyBlob);
        String signature = base64UrlEncode(signatureBlob);
    
        // Combine all parts of the JWT (header, payload, signature) with dot separators
        String jwtToken = unsignedToken + '.' + signature;
    
        return jwtToken;
    }

    public String getTokenValueFromResponse(String response, String key, Boolean isArray) {
        String ret = null;
        
        try {
            // Check if the response is null or empty
            if (String.isBlank(response)) {
                System.debug('Response is null or empty.');
                return null;
            }
    
            // Parse the JSON response
            Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(response);
    
            // Check if the key exists in the response
            if (jsonResponse.containsKey(key)) {
                // Retrieve the value for the key
                Object value = jsonResponse.get(key);
    
                // Check if the value is an array
                if (isArray && value instanceof List<Object>) {
                    List<Object> valueList = (List<Object>) value;
                    if (!valueList.isEmpty()) {
                        // Get the first element of the array
                        ret = String.valueOf(valueList[0]);
                    } else {
                        System.debug('Array is empty for key: ' + key);
                    }
                } else {
                    // Value is not an array or is null
                    ret = String.valueOf(value);
                }
            } else {
                System.debug('Key "' + key + '" not found in response.');
            }
        } catch (Exception e) {
            // Handle any exception that may occur during parsing
            System.debug('Error parsing JSON response: ' + e.getMessage());
        }
    
        System.debug(key + ': ' + ret);
        return ret;
    }
}