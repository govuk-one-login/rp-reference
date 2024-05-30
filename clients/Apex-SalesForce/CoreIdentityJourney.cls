global class COREIdentityJWTGovUK extends Auth.AuthProviderPluginClass {
    
    
    public String redirectUrl;
    private String clientId;
    private String authUrl;
    private String tokenUrl;
    private String userInfoUrl;
    private String scope;

    public class RegPluginException extends Exception {}
    public class CustomException extends Exception {}
    public class JWTDecodeException extends Exception {}
    
   
    // Declare global variable to hold access token
    private String accessToken;
    private String CoreIdentityClaimIssuer = 'https://identity.integration.account.gov.uk/';
    private String IssuerPublicKey = 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAENPGA7cyIKtH1nz2CJIH14s9/CtC93NwdCQcEi+ADvxjZxN2YcCZmOKCGXLfiVdzETDnRxsoVXsVM51kqE4bumw==';
    private String RequiredLevelOfConfidence = 'P2';
    public String CoreIdentityClaimIdentifier = 'https://vocab.account.gov.uk/v1/coreIdentityJWT';
    public String ClientID_AUD = 'xtfaCWk8nMe7FO4224QK8S6GuQst6Jeekg';
    String userId  = '';
    String jwtToken = '';
    Map<String, Object> headerJsonMap;
    Map<String, Object> payloadMap;

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
    String claimUrl = 'https://vocab.account.gov.uk/v1/coreIdentityJWT';
    String claimUrl2 = 'https://vocab.account.gov.uk/v1/address';

    String nonce = generateNonce(); // Generate a random nonce

    // Build the URL with parameters
    String url = authUrl + '?client_id=' + clientId + '&response_type=code' +
                 '&redirect_uri=' + redirectUrl + '&scope=' + scope +
                 '&state=' + stateToPropagate + '&nonce=' + nonce +
                 '&vtr=["Cl.Cm.P2"]&claims={"userinfo":{"' + claimUrl +
                 '": null }}';

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
        String code = queryParams.get('code');
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
        
        system.debug('accessTokentoday:' + accessToken); 
    
       
        return new Auth.AuthProviderTokenResponse('OneLogin', null, accessToken, sfdcState);
    }
    

    global Auth.UserData getUserInfo(Map<String, String> authProviderConfiguration, Auth.AuthProviderTokenResponse response) {
        
        String userInfoUrl = authProviderConfiguration.get('User_Info_Endpoint_URL__c');
        String fullName = '';
        String birthDate = '';
        String GivenName= '';
        String FamilyName = '';
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(userInfoUrl);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);

        Http http = new Http();
        HTTPResponse res;

        try {
            res = http.send(req);
            System.debug('resOutput: ' + res.getBody());
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
            System.debug('userInfoasIS: ' + userInfo);
        } catch (Exception e) {
            throw new CustomException('Failed to parse JSON response: ' + e.getMessage());
        }
        
        // Check for error response
        if (userInfo.containsKey('error')) {
            throw new CustomException('Error response from userinfo endpoint: ' + userInfo.get('error') + 
                                       ', Description: ' + userInfo.get('error_description'));
        }
        
        // Extract user information from the response
         userId = (String) userInfo.get('sub');
        //String firstName = (String) userInfo.get('given_name');
       // String lastName = (String) userInfo.get('family_name');
        //String fullName = (String) userInfo.get('name');
        String email = (String) userInfo.get('email');
        String locale = (String) userInfo.get('locale');
        jwtToken  = (String)userInfo.get('https://vocab.account.gov.uk/v1/coreIdentityJWT');
    
    try{
        System.debug('JWTToken: ' + jwtToken );
        JWTDecoder decoder = new JWTDecoder(jwtToken);
        System.debug('Header: ' + decoder.headerJson);

      // Deserialize headerJsonMap into a map
    headerJsonMap = (Map<String, Object>)JSON.deserializeUntyped(decoder.headerJson);
     // Deserialize payloadJson into a map
     payloadMap = (Map<String, Object>)JSON.deserializeUntyped(decoder.payloadJson);
   

     System.debug('Payload: ' + decoder.payloadJson);
        // Accessing 'vc' and 'credentialSubject' fields
    VerifiableIdentityCredential verifiableCredential = new VerifiableIdentityCredential();
    Map<String, Object> vc = (Map<String, Object>)payloadMap.get('vc');
    Map<String, Object> credentialSubject = (Map<String, Object>)vc.get('credentialSubject');

    // Accessing 'name' and 'birthDate' fields
    List<Object> nameList = (List<Object>)credentialSubject.get('name');
    List<Object> birthDateList = (List<Object>)credentialSubject.get('birthDate');

    // Process 'name' field
    for (Object nameObj : nameList) {
        Map<String, Object> nameMap = (Map<String, Object>)nameObj;
        List<Object> nameParts = (List<Object>)nameMap.get('nameParts');
        
        for (Object namePartObj : nameParts) {
            Map<String, Object> namePartMap = (Map<String, Object>)namePartObj;
            fullName += (String)namePartMap.get('value') + ' ';
            String Nametype = (String) namePartMap.get('type');
            String value = (String) namePartMap.get('value');
           
              if(Nametype == 'GivenName') {
                 givenName = value;
        }else if(Nametype == 'FamilyName'){
               familyName = value;
        }
        }
        System.debug('Full Name: ' + fullName.trim());
    }

    // Process 'birthDate' field
    for (Object birthDateObj : birthDateList) {
        Map<String, Object> birthDateMap = (Map<String, Object>)birthDateObj;
        birthDate = (String)birthDateMap.get('value');
        System.debug('Birth Date: ' + birthDate);
    }
        
        
        }catch (JWTDecodeException e){
         System.debug('Error decoding JWT: ' + e.getMessage());
        }
        
         validateCoreIdentityClaim();
        return new Auth.UserData(userId, givenName, familyName, fullName, email, null, birthDate, null, 'OneLogin', null, null);
        
        
    }

    
    
 private String generateJWT(String clientId, String privateKey) {
    // Create a random value for the JWT ID (jti)
    String jti = generateRandomJti();

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

    
    // generateNonce methods.
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
    
public void validateCoreIdentityClaim() {
   
    String algorithmName = 'SHA256withECDSA'; // ES256 algorithm

    try {
        System.debug('Token jwtToken: ' + jwtToken);
        // Extract signature from the token
        List<String> parts = jwtToken.split('\\.');
        System.debug('Token Parts: ' + parts);
        
        // Convert base64url encoded parts to standard Base64 encoding
        String decodedHeader = Newbase64UrlToBase64(parts[0]);
        String decodedPayload = Newbase64UrlToBase64(parts[1]);
        System.debug('decodedHeader: ' + decodedHeader);
        System.debug('decodedPayload: ' + decodedPayload);

        Blob signedData = Blob.valueOf(decodedHeader + '.' + decodedPayload);
        Blob signature = EncodingUtil.base64Decode(Newbase64UrlToBase64(parts[2]));
        
         System.debug('signature: ' + signature);

        // Verify signature
        if (!verifySignature(signedData, signature, IssuerPublicKey)) {
            throw new CustomException('Invalid token signature');
        }

        // Extract issuer from the token
        String tokenIssuer = (String) payloadMap.get('iss');

        // Validate issuer
        if (!CoreIdentityClaimIssuer.equals(tokenIssuer)) {
            throw new CustomException('Invalid token issuer');
        }

        // Extract algorithm from the token
        String tokenAlgorithm = (String) headerJsonMap.get('alg');

        // Validate algorithm (ES256)
        if (!'ES256'.equals(tokenAlgorithm)) {
            throw new CustomException('Invalid token algorithm');
        }

        // Validate required level of confidence
        Map<String, Object> decodedToken = (Map<String, Object>) JSON.deserializeUntyped(EncodingUtil.base64Decode(decodedPayload).toString());
        String votClaimValue = (String) decodedToken.get('vot');
        if (String.isBlank(votClaimValue) || !votClaimValue.equals(requiredLevelOfConfidence)) {
            throw new CustomException('vot mismatch. Required level of confidence not achieved');
        }

        // Validate aud claim matches client ID
        String audClaimValue = (String) decodedToken.get('aud');
        if (String.isBlank(audClaimValue) || !audClaimValue.equals(ClientID_AUD)) {
            throw new CustomException('aud claim does not match client ID');
        }

        // Validate sub claim matches expected sub claim
        String subClaimValue = (String) decodedToken.get('sub');
        if (String.isBlank(subClaimValue) || !subClaimValue.equals(userId)) {
            throw new CustomException('sub claim does not match expected sub claim');
        }

        // Validate exp claim (current time should be before exp time)
        Long expClaimValue = (Long) decodedToken.get('exp');
        if (expClaimValue == null || System.currentTimeMillis() >= expClaimValue * 1000) {
            throw new CustomException('Token has expired');
        }

        // If everything is valid, the token is considered valid
    } catch (Exception e) {
        // Handle any exceptions that may occur during token validation
        throw new CustomException('Error validating JWT token: ' + e.getMessage());
    }
}

private String Newbase64UrlToBase64(String input) {
    // Replace '-' with '+', '_' with '/', and calculate the correct padding
    String result = input.replace('-', '+').replace('_', '/');
    
    // Calculate the number of padding characters needed
    Integer paddingNeeded = Math.mod(result.length(), 4);
    if (paddingNeeded == 2) {
        result += '=='; // Add two padding characters
    } else if (paddingNeeded == 3) {
        result += '='; // Add one padding character
    }

    return result;
}

//Method to verify ES256 algo
private Boolean verifySignature(Blob signedData, Blob signature, String publicKeyStr) {
    try {
        // Include PEM headers for the public key
        String publicKeyPEM = '-----BEGIN PUBLIC KEY-----\n' + publicKeyStr + '\n-----END PUBLIC KEY-----';
        
        // Remove PEM headers and newline characters from the public key string
        publicKeyPEM = publicKeyPEM.replaceAll('-----BEGIN PUBLIC KEY-----', '');
        publicKeyPEM = publicKeyPEM.replaceAll('-----END PUBLIC KEY-----', '');
        publicKeyPEM = publicKeyPEM.replaceAll('\\n', '');

        // Decode the PEM-formatted public key from Base64
        Blob publicKeyDER = EncodingUtil.base64Decode(publicKeyPEM);
        //Blob publicKeyX509 = EncodingUtil.base64Decode(publicKeyPEM);
        //String publicKeyBase64 = EncodingUtil.base64Encode(publicKeyX509);
        //Blob publicKeyX5092 = EncodingUtil.base64Decode(publicKeyBase64);
        //System.debug('publicKeyX509: ' + publicKeyX509);

        // Verify the signature using ES256 algorithm
        return Crypto.verify('ECDSA', signedData, signature, publicKeyDER);
    } catch (Exception e) {
        // Log the exception
        System.debug('Error verifying signature: ' + e.getMessage());
        return false; // Return false indicating signature verification failure
    }
}



public class UserData {
    private String userInfoResponse;

    public UserData(String userInfoResponse) {
        this.userInfoResponse = userInfoResponse;
    }

    public String getUserInfoResponse() {
        return this.userInfoResponse;
    }
}


public class CoreIdentity {
    public VerifiableIdentityCredential vc { get; set; }
}

public class VerifiableIdentityCredential {
    public Person credentialSubject { get; set; }
}

public class Person {
    public List<Name> name { get; set; }
    public List<BirthDate> birthDate { get; set; }
}

public class Name {
    public string validFrom { get; set; }
    public List<NamePart> nameParts { get; set; }
}

public class NamePart {
    public string value { get; set; }
    public string type { get; set; }
}

public class BirthDate {
    public string value { get; set; }
    public DateTime validFrom { get; set; }
    public DateTime validUntil { get; set; }
}

    public class JWTDecoder {
    public String headerJson { get; private set; }
    public String payloadJson { get; private set; }

    public JWTDecoder(String token) {
        List<String> parts = token.split('\\.');
        if (parts.size() != 3) {
            throw new JWTDecodeException('Invalid JWT token format');
        }

        Blob headerBlob = EncodingUtil.base64Decode(base64UrlToBase64(parts[0]));
        Blob payloadBlob = EncodingUtil.base64Decode(base64UrlToBase64(parts[1]));

        headerJson = headerBlob.toString();
        payloadJson = payloadBlob.toString();
    }

    private String base64UrlToBase64(String input) {
    String result = input.replace('-', '+').replace('_', '/');
    Integer paddingNeeded = 4 - Math.mod(result.length(), 4); // Calculate how many padding characters are needed
    while (paddingNeeded > 0) {
        result += '='; // Add padding characters
        paddingNeeded--; // Decrement paddingNeeded
    }
    return result;
}


}

}
