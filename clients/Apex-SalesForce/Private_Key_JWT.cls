global class JWTGovUK extends Auth.AuthProviderPluginClass {
    
    
    public String redirectUrl;
    private String clientId;
    private String authUrl;
    private String tokenUrl;
    private String userInfoUrl;
    private String scope;

    public class RegPluginException extends Exception {}
    public class CustomException extends Exception {}
    
    
    // Declare global variable to hold access token
    private String accessToken;

    //A call to the CustomMetadataTypes 
    global String getCustomMetadataType() {
        return 'Jwtflowexample__mdt';
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
        authUrl = authProviderConfiguration.get('Authorize_Endpoint_URL__c');
        clientId = authProviderConfiguration.get('Consumer_Key__c');
        redirectUrl = authProviderConfiguration.get('Redirect_URL__c');
        scope = authProviderConfiguration.get('Default_Scopes__c');
        
        String nonce = generateNonce(); // Generate a random nonce
        
        String url = authUrl + '?client_id=' + clientId + '&response_type=code&redirect_uri=' + redirectUrl + '&scope='+ scope + '&state=' + stateToPropagate  + '&nonce=' + nonce;

        
        return new PageReference(url);

    }

    global Auth.AuthProviderTokenResponse handleCallback(Map<String, String> authProviderConfiguration, Auth.AuthProviderCallbackState state) {
        
        clientId = authProviderConfiguration.get('Consumer_Key__c');
        tokenUrl = authProviderConfiguration.get('Token_Endpoint_URL__c');
        redirectUrl = authProviderConfiguration.get('Redirect_URL__c');
        String PrivateKey = authProviderConfiguration.get('PrivateKeyTest__c');
        String sfdcState = state.queryParameters.get('state');

        // Remove BEGIN and END markers and newline characters from the private key string
        PrivateKey = PrivateKey.replaceAll('-----BEGIN PRIVATE KEY-----', '');
        PrivateKey = PrivateKey.replaceAll('-----END PRIVATE KEY-----', '');
        PrivateKey = PrivateKey.replaceAll('\\n', '');


        Blob privateKeyBlob = EncodingUtil.base64Decode(PrivateKey);


        // Convert Blob to Base64 encoded string
         String privateKeyBase64 = EncodingUtil.base64Encode(privateKeyBlob);

        Map<String, String> queryParams = state.queryParameters;
        String code  = queryParams.get('code');
         String jwtToken = generateJWT(clientId, privateKeyBase64);

        HttpRequest req = new HttpRequest();
        req.setEndpoint(tokenUrl);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

        String reqBody = 'client_id=' + clientId + '&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=' + jwtToken + '&grant_type=authorization_code&code=' + code + '&redirect_uri=' + redirectUrl;

        req.setBody(reqBody);

        Http http = new Http();
        HTTPResponse res = http.send(req);

        String responseBody = res.getBody();
        system.debug('RESPONSE_ToString' + res.toString()); 
        system.debug(responseBody);   

        accessToken = getTokenValueFromResponse(responseBody, 'access_token', false);

        return new Auth.AuthProviderTokenResponse('OneLogin', null, accessToken, sfdcState);
    }

    global Auth.UserData getUserInfo(Map<String, String> authProviderConfiguration, Auth.AuthProviderTokenResponse response) {
        
        String userInfoUrl = authProviderConfiguration.get('User_Info_Endpoint_URL__c');

        HttpRequest req = new HttpRequest();
        req.setEndpoint(userInfoUrl);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);

        Http http = new Http();
        HTTPResponse res;

        try {
            res = http.send(req);
        } catch (Exception e) {
            throw new CustomException('Failed to send HTTP request: ' + e.getMessage());
        }
        
        if (res.getStatusCode() != 200) {
            throw new CustomException('HTTP request failed with status code: ' + res.getStatusCode());
        }
        
        // Parse the JSON response
        Map<String, Object> userInfo;
        try {
            userInfo = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        } catch (Exception e) {
            throw new CustomException('Failed to parse JSON response: ' + e.getMessage());
        }
        
        // Check for error response
        if (userInfo.containsKey('error')) {
            throw new CustomException('Error response from userinfo endpoint: ' + userInfo.get('error') + 
                                       ', Description: ' + userInfo.get('error_description'));
        }
        
        // Extract user information from the response
        String userId = (String) userInfo.get('sub');
        String firstName = (String) userInfo.get('given_name');
        String lastName = (String) userInfo.get('family_name');
        String fullName = (String) userInfo.get('name');
        String email = (String) userInfo.get('email');
        String locale = (String) userInfo.get('locale');
        
        // Construct Auth.UserData object with retrieved information
        return new Auth.UserData(userId, firstName, lastName, fullName, email, null, locale, null, 'OneLogin', null, null);
    }

    
 private String generateJWT(String clientId, String privateKey) {
    // Create a random value for the JWT ID (jti)
    String jti = generateRandomJti();

    // Create JWT payload (claims)
    Long iat = DateTime.now().getTime() / 1000; // Current timestamp in seconds
    Long exp = iat + 3600; // Expiry time: 1 hour from issuance (adjust as needed)

    String _FamilyName = fromJSON.FamilyName 
     

    // Construct JWT header
    Map<String, Object> headerMap = new Map<String, Object>();
    headerMap.put('alg', 'RS256');
    headerMap.put('typ', 'JWT');
    String headerJson = JSON.serialize(headerMap);
    String header = base64UrlEncode(Blob.valueOf(headerJson));
    
    // Construct JWT payload (claims)
    Map<String, Object> payloadMap = new Map<String, Object>();
    payloadMap.put('aud', tokenUrl);
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



// Method to generate a random value for the JWT ID (jti)
private String generateRandomJti() {
    String chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    String jti = '';
    Integer length = 16; 
    while (length-- > 0) {
        Integer rand = Math.abs(Math.mod(Crypto.getRandomInteger(), chars.length()));
        jti += chars.charAt(rand);
    }
    return jti;
}

    
    //Method to generate a random string for nonce
    global String generateNonce() {
        // Generate a random string for nonce
        String chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        String nonce = '';
        Integer length = 32; 
        while (length-- > 0) {
            Integer rand = Math.mod(Crypto.getRandomInteger(), chars.length());
            System.debug('rand: ' + rand);
            System.debug('chars.length(): ' + chars.length());
            if (rand >= 0 && rand < chars.length()) {
                nonce += chars.charAt(rand);
            } else {
                System.debug('Invalid rand value: ' + rand);
            }
        }
        return nonce;
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
        System.debug('JSON Response: ' + jsonResponse);

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
