global class OneLoginProvider extends Auth.AuthProviderPluginClass {

    public class RegPluginException extends Exception {}
    public class CustomException extends Exception {}
    public class JWTVerificationException extends Exception {}
    public class TokenVerificationException extends Exception {}

    public Enum TokenType {ID_TOKEN, ACCESS_TOKEN}

    // Declare global variable to hold tokens
    String userinfoUrl; 

    //A call to the CustomMetadataTypes 
    global String getCustomMetadataType() {
        return 'OneLoginClientConfiguration__mdt';
    }

    global PageReference initiate(Map<String, String> authProviderConfiguration, String stateToPropagate) {
        
        // Parse the provider configuration
        String clientId = authProviderConfiguration.get('ClientId__c');
        System.debug('clientId=' + clientId);

        String redirectUrl = authProviderConfiguration.get('RedirectUrl__c');
        System.debug('redirectUrl=' + redirectUrl);

        String scope = authProviderConfiguration.get('Scopes__c');
        System.debug('scope=' + scope);

        String discoveryUrl = authProviderConfiguration.get('DiscoveryUrl__c');
        System.debug('discoveryUrl=' + discoveryUrl);
        
        Map<String, Object> discoveryMetadataMap = getMetadataMap(discoveryUrl);
        
        String authorizeUrl = (String) discoveryMetadataMap.get('authorization_endpoint');
        System.debug('authorizeUrl=' + authorizeUrl);
        
        String vtr = authProviderConfiguration.get('VectorOfTrust__c');
        System.debug('vtr=' + vtr);

        // Generate a random nonce
        String nonce = UUID.randomUUID().toString();
        System.debug('nonce=' + nonce);
        System.debug('state=' + stateToPropagate);
        String nonceCacheId = getCacheId(stateToPropagate);
        System.debug('nonceCacheId=' + nonceCacheId);
        PlatformCacheRecipes.storeValueInOrgCache(nonceCacheId, nonce, 1200);

        vtr = '["' + vtr + '"]';

        String url = authorizeUrl + '?client_id=' + clientId + 
                                    '&response_type=code' +
                                    '&redirect_uri=' + redirectUrl + 
                                    '&scope='+ scope + 
                                    '&state=' + stateToPropagate  + 
                                    '&nonce=' + nonce + 
                                    '&vtr=' + vtr;
              
        if (vtr.contains('P')) {
            url = url + '&claims={"userinfo":{"https://vocab.account.gov.uk/v1/coreIdentityJWT":null,"https://vocab.account.gov.uk/v1/address":null,"https://vocab.account.gov.uk/v1/returnCode":null}}';
        }

        return new PageReference(url);
    }

    global Auth.AuthProviderTokenResponse handleCallback(Map<String, String> authProviderConfiguration, Auth.AuthProviderCallbackState state) {
    
        System.debug('handleCallback starting');
    
        String publicKey = '';
  
        // setup up configuration
        String clientId = authProviderConfiguration.get('ClientId__c');
        System.debug('clientId=' + clientId);
        String redirectUrl = authProviderConfiguration.get('RedirectUrl__c');
        System.debug('redirectUrl=' + redirectUrl);
        String discoveryUrl = authProviderConfiguration.get('DiscoveryUrl__c');
        System.debug('discoveryUrl=' + discoveryUrl);

        Map<String, Object> discoveryMetadataMap = getMetadataMap(discoveryUrl);        
        // String tokenUrl = authProviderConfiguration.get('TokenUrl__c');
        String tokenUrl = (String) discoveryMetadataMap.get('token_endpoint');
        System.debug('tokenUrl=' + tokenUrl);
        // String jwksEndpoint = authProviderConfiguration.get('JwksEndpoint__c');
        String jwksEndpoint = (String) discoveryMetadataMap.get('jwks_uri');
        System.debug('jwksEndpoint=' + jwksEndpoint);
        // String issuer = authProviderConfiguration.get('Issuer__c');
        String issuer = (String) discoveryMetadataMap.get('issuer');
        System.debug('issuer=' + issuer);

        String privateKey = authProviderConfiguration.get('PrivateKey__c');
        // the returned state is automatically check by Salesforce authentication system
        String stateReturned = state.queryParameters.get('state');
        System.debug('stateReturned=' + stateReturned);
        String nonceCacheId = getCacheId(stateReturned);
        String nonce = PlatformCacheRecipes.getValuefromOrgCache(nonceCacheId);
        System.debug('nonce=' + nonce);

        // Remove BEGIN and END markers and newline characters from the private key string
        privateKey = privateKey.replace('-----BEGIN PRIVATE KEY-----', '');
        privateKey = privateKey.replace('-----END PRIVATE KEY-----', '');
        privateKey = privateKey.replace('\\n', '');
        System.debug('privateKey=' + privateKey);

        Map<String, String> queryParams = state.queryParameters;
        String code  = queryParams.get('code');
        String jwtToken = generateJWT(clientId, privateKey, tokenUrl);

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

        String accessToken = getTokenValueFromResponse(responseBody, 'access_token', false);
        String idToken = getTokenValueFromResponse(responseBody, 'id_token', false);

        // validate idToken before passing back to client application
        // if the idToken fails to validate an fatal exception is thrown
        Auth.JWT parsedIdToken = Auth.JWTUtil.validateJWTWithKeysEndpoint(idToken, jwksEndpoint, True); 
        System.debug('Token contents: ' + parsedIdToken.toJSONString());
        
        // validate id token
        Boolean idTokenValidated = validateToken(parsedIdToken, TokenType.ID_TOKEN, clientId, issuer, nonce);

        if (!idTokenValidated) {
            throw new TokenVerificationException('ID token validation failed');
        }
        return new Auth.AuthProviderTokenResponse('OneLogin', accessToken, idToken, stateReturned);
    }

    global Auth.UserData getUserInfo(Map<String, String> authProviderConfiguration, Auth.AuthProviderTokenResponse response) {
        
        System.debug('getUserInfo starting');
    
        String clientId = authProviderConfiguration.get('ClientId__c');
        System.debug('clientId=' + clientId);
        String vtr = authProviderConfiguration.get('VectorOfTrust__c');
        System.debug('vtr=' + vtr);
        String didUrl = authProviderConfiguration.get('DIDUrl__c');
        System.debug('didUrl=' + didUrl);    
        String identityIssuer = authProviderConfiguration.get('IdentityIssuer__c');
        System.debug('identityIssuer=' + identityIssuer);        
        String discoveryUrl = authProviderConfiguration.get('DiscoveryUrl__c');
        System.debug('discoveryUrl=' + discoveryUrl);
        
        Map<String, Object> discoveryMetadataMap = getMetadataMap(discoveryUrl);

        String userinfoUrl = (String) discoveryMetadataMap.get('userinfo_endpoint');
        System.debug('userinfoUrl=' + userinfoUrl);

        String accessToken = response.oauthToken;
        System.debug('accessToken=' + accessToken);

        HttpRequest req = new HttpRequest();
        req.setEndpoint(userinfoUrl);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);

        Http http = new Http();
        HTTPResponse res;

        res = http.send(req);
        
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
        CoreIdentity coreId;
        UserDetails userDetails;

        if (vtr.contains('P')) {
            //returnCodeJson  = (String) userinfo.get(RETURN_CODE_CLAIM);
            if (userinfo.containsKey(RETURN_CODE_CLAIM)) {
                returnCodes = (List<Object>) userinfo.get(RETURN_CODE_CLAIM);
                if (!returnCodes.isEmpty()) {
                    // we have a return code - add return code processing logic here
                    System.debug(returnCodes.toString());
                    // copy return Codes to attribute map                    
                    attributeMap.put('returnCodes', returnCodes.toString());
                }
            }
            if (userinfo.containsKey(ADDRESS_CLAIM)) {
                address = userinfo.get(ADDRESS_CLAIM).toString();
                System.debug('address=' + address);
                // copy address to attribute map
                attributeMap.put('address', address);
            }
            if (userinfo.containsKey(CORE_IDENTITY_CLAIM)) {
                coreIdentityJWT = (Object) userinfo.get(CORE_IDENTITY_CLAIM);
                System.debug('coreIdentityJWT=' + coreIdentityJWT.toString());                
                
                // String publicKey = authProviderConfiguration.get('IdentityPublicKey__c');
                // System.debug('publicKey=' + publicKey);

                String coreIdentityPayload = verifyCoreIdentityJWTSignature(coreIdentityJWT.toString(), didUrl); 
                if (coreIdentityPayload <> 'ValidationFailed') {
                    System.debug('coreIdentityJWTSignatureValidated=true');
                    coreId = (CoreIdentity) JSON.deserialize(coreIdentityPayload, CoreIdentity.class);
                    
                    if (validateCoreIdentity(coreId, identityIssuer, clientId, userId)) {
                        // copy identity to attribute map
                        attributeMap.put('coreIdentity', coreId.toString());
                        userDetails = mapCoreIdentityToUserDetails(coreId);
                    } else {
                        throw new JWTVerificationException('Validation of coreIdentityJWT failed');
                    }                   
                } else {
                    System.debug('coreIdentityJWTSignatureValidated=false');
                    throw new JWTVerificationException('Validation of coreIdentityJWT signature failed');
                }
            }
        }
        
        // Construct Auth.UserData object with retrieved information
        return new Auth.UserData(userId, userDetails.givenName, userDetails.familyName, userDetails.givenName + ' ' + userDetails.familyName, email, userDetails.identityConfidenceLevel, email, 'en-GB', 'OneLogin', 'siteLoginUrl', attributeMap);
    }
    
    private String verifyCoreIdentityJWTSignature(String coreIdentityJWT, String didUrl) {
        // returns CoreIdentity payload if validation succeeds
        // Split the JWT into header, payload, and signature
        List<String> jwtParts = coreIdentityJWT.split('\\.');
        if (jwtParts.size() != 3) {
            throw new JWTVerificationException('Invalid token format');
        }
        
        String header = EncodingUtil.base64Decode(jwtParts[0]).toString();
        System.debug('header=' + header);

        // get the public key, retrieve and process the DID doc if necessary
        String publicKey = getPublicKey(header, didUrl);
        System.debug('publicKey=' + publicKey);        

        String payload = EncodingUtil.base64Decode(jwtParts[1]).toString();
        System.debug('payload=' + payload);

        String signature = jwtParts[2];
        System.debug('signature=' + signature);
        // signature needs to be normalised from Url encoded form
        Blob signatureBlob = base64UrlDecode(signature);
        
        // then converted to a hex string
        String signatureHex = EncodingUtil.convertToHex(signatureBlob);
        System.debug('signatureHex=' + signatureHex);
        
        Blob signatureDerBlob = convertJoseToDer(signatureHex);
        // System.debug('signatureDerBlob=' + signatureDerBlob);
            
        // Create the data to verify (header + "." + payload)
        Blob signedDataBlob = Blob.valueOf(jwtParts[0] + '.' + jwtParts[1]);

        
        Blob publicKeyBlob = EncodingUtil.base64Decode(publicKey);
    
        String algorithmName = 'ECDSA-SHA256';
        
        Boolean signatureVerified = Crypto.verify(algorithmName, signedDataBlob, signatureDerBlob, publicKeyBlob);

        String returnValue;
        if (signatureVerified) {
            returnValue = payload;
        } else {
            returnValue = 'ValidationFailed';
        }
        return returnValue;
    }
    
    private Boolean validateToken(Auth.JWT jwt, TokenType token, string clientId, string issuer, string nonce) {
        // Validate the issuer (iss), audience (aud), expiration (exp), etc.
        // Example: Validate the expiration time
        if (token == TokenType.ID_TOKEN) {

            // Not sure why but getAud returns client-id surrounded by []
            if (jwt.getAud().replace('[', '').replace(']', '') != clientId) {
                System.debug('clientId=' + clientId);
                System.debug('jwt.getAud=' + jwt.getAud());
                throw new JWTVerificationException('Invalid audience specified in ID token');
            }
            if (jwt.getIss() != issuer) {
                throw new JWTVerificationException('Invalid issuer specified in ID token');
            }
            Map<String, Object> claims = jwt.getAdditionalClaims();
            System.debug(claims);

            Datetime exp = (Datetime) claims.get('exp');
            System.debug('exp=' + exp.toString());   
            if (exp == null || exp < DateTime.now()) {
                throw new JWTVerificationException('Invalid expiry time specified in ID token');
            }

            Datetime iat = (Datetime) claims.get('iat');
            System.debug('iat=' + iat.toString());   
            if (iat == null || iat > DateTime.now()) {
                throw new JWTVerificationException('Invalid issued at time specified in ID token');
            }

            String returnedNonce = (String) claims.get('nonce');
            System.debug('returnedNonce=' + returnedNonce);
            if (returnedNonce != nonce) {
                System.debug('returnedNonce=' + returnedNonce);
                System.debug('nonce=' + nonce);
                throw new JWTVerificationException('Invalid nonce specified in ID token');
            }
        }

        return true;
    }

    private Boolean validateCoreIdentity(CoreIdentity coreIdentity, String issuer, String clientId, String sub) {
        // Check the iss claim is https://identity.integration.account.gov.uk/.
        // Check the aud claim matches your client ID you received when you registered your service to use GOV.UK One Login.
        // Check the sub claim matches the sub claim you received in the id_token from your token request.
        // Check the current time is before the time in the exp claim.
        // Check iat and nbf are after current time 
        // Check vot is an acceptable value

        if (coreIdentity.iss <> issuer) {
            throw new JWTVerificationException('Invalid iss specified in coreIdentity');
        }
        if (coreIdentity.sub <> sub) {
            throw new JWTVerificationException('Invalid sub specified in coreIdentity');
        }
        if (coreIdentity.aud <> clientId) {
            throw new JWTVerificationException('Invalid aud specified in coreIdentity');
        }

        datetime nowDt = datetime.now();

        System.debug('iat=' + coreIdentity.iat);
        DateTime iatDt = DateTime.newInstance(coreIdentity.iat * 1000);
        System.debug('iat DateTime=' + iatDt);
        
        if (nowDt < iatDt) {
            throw new JWTVerificationException('Invalid iat specified in coreIdentity');
        }

        System.debug('nbf=' + coreIdentity.nbf);
        DateTime nbfDt = DateTime.newInstance(coreIdentity.nbf * 1000);
        System.debug('nbf DateTime=' + nbfDt);

        if (nowDt < nbfDt) {
            throw new JWTVerificationException('Invalid nbf specified in coreIdentity');
        }

        System.debug('exp=' + coreIdentity.exp);
        DateTime expDt = DateTime.newInstance(coreIdentity.exp * 1000);
        System.debug('exp DateTime=' + expDt);

        if (nowDt > expDt) {
            throw new JWTVerificationException('Invalid exp specified in coreIdentity');
        }

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

    private String getTokenValueFromResponse(String response, String key, Boolean isArray) {
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

    private String base64UrlEncode(Blob input) {
        // Encode the input Blob into a base64 string
        String encoded = EncodingUtil.base64Encode(input);
    
        // Replace characters as per base64url encoding rules
        encoded = encoded.replace('+', '-');
        encoded = encoded.replace('/', '_');
        encoded = encoded.removeEnd('=');    
        return encoded;
    }

    private Blob base64UrlDecode(String input) {

        String normalised = input.replace('-', '+').replace('_', '/');
        
        Integer remainingLength = Math.mod(normalised.length(), 4);

        while (Math.mod(normalised.length(), 4) != 0) {
            normalised += '=';
        }
        System.debug('normalised=' + normalised);

        return EncodingUtil.base64Decode(normalised);   
    }

    private string getCacheId(String seed) {    
        // creates a hash of the state parsmeter to create short key for the PlatformCache store
        return base64URLencode(Crypto.generateDigest('SHA1', Blob.valueOf(seed))).remove('_').remove('-');  
    }
    
    private String toHexString(Integer value) {
        String hexChars = '0123456789abcdef';
        String hex = '';

        // Handle 0 explicitly
        if (value == 0) {
            return '00';
        }

        while (value > 0) {
            Integer remainder = Math.mod(value, 16);
            hex = hexChars.substring(remainder, remainder + 1) + hex;
            value = (Math.floor(value / 16)).intValue();
        }

        // Ensure the hex string has an even length by padding with '0' if necessary
        if (Math.mod(hex.length(), 2) != 0) {
           hex = '0' + hex;
        }

        return hex;
    }

    private Blob convertJoseToDer(String hexSignature) {
        // Extract R and S from the hex signature
        String rHex = hexSignature.substring(0, 64);
        String sHex = hexSignature.substring(64, 128);

        // Convert R and S to DER format
        Blob derR = encodeDerInteger(rHex);
        Blob derS = encodeDerInteger(sHex);

        // Construct the DER sequence
        Integer totalLength = derR.size() + derS.size();
        String derSequenceHex = '30' + toHexString(totalLength) + EncodingUtil.convertToHex(derR) + EncodingUtil.convertToHex(derS);
        System.debug('derSequenceHex=' + derSequenceHex);
        // Convert the final hex sequence back to Blob
        return EncodingUtil.convertFromHex(derSequenceHex);
    }

    private Blob encodeDerInteger(String hexValue) {

        // If the first byte (first 2 hex chars) is >= 0x80, prepend '00'
        if (hexValue.startsWith('8') || hexValue.startsWith('9') || hexValue.toUpperCase().startsWith('A') || 
            hexValue.toUpperCase().startsWith('B') || hexValue.toUpperCase().startsWith('C') || hexValue.toUpperCase().startsWith('D') || 
            hexValue.toUpperCase().startsWith('E') || hexValue.toUpperCase().startsWith('F')) {
            hexValue = '00' + hexValue;
        }
        // DER encoding: '02' for INTEGER type, followed by the length 
        String lengthHex = '02' + toHexString(hexValue.length() / 2);

        String derHex = '';
        // add the value on the end and prefix with a 0 if required
        if (lengthHex.length() == 1) {
            derHex = '0' + lengthHex + hexValue;
        } else {
            derHex = lengthHex + hexValue;
        }

        // Convert back to Blob
        return EncodingUtil.convertFromHex(derHex);
    }

    private UserDetails mapCoreIdentityToUserDetails(CoreIdentity coreIdentity) {
        UserDetails userDetails = new UserDetails();
        
        System.debug('coreIdentity.sub=' + coreIdentity.sub);
        
        userDetails.sub = coreIdentity.sub;

        Integer i = 0;
        Integer j = 0;

        // loop through names - there will be only one - one day there may be more
        while (i < coreIdentity.vc.credentialSubject.name.size()) {
            // loop through name parts
            while (j < coreIdentity.vc.credentialSubject.name[i].nameParts.size()) {
                if (coreIdentity.vc.credentialSubject.name[i].nameParts[j].type == 'FamilyName') {
                    if (userDetails.familyName == null) {
                        userDetails.familyName = coreIdentity.vc.credentialSubject.name[i].nameParts[j].value;
                    } else {
                        userDetails.familyName += coreIdentity.vc.credentialSubject.name[i].nameParts[j].value;
                    }
                } else if (coreIdentity.vc.credentialSubject.name[i].nameParts[j].type == 'GivenName') {
                    if (userDetails.givenName == null) {
                        userDetails.givenName = coreIdentity.vc.credentialSubject.name[i].nameParts[j].value;
                    } else { 
                        userDetails.givenName += coreIdentity.vc.credentialSubject.name[i].nameParts[j].value;
                    }
                }
                j++;
            }
            j = 0;
            i++;
        }

        i = 0;

        // loop through DoBs - there will be only one - one day there may be more
        while (i < coreIdentity.vc.credentialSubject.birthDate.size()) {
            userDetails.dateOfBirth = Date.valueOf(coreIdentity.vc.credentialSubject.birthDate[i].value);
            i++;
        }

        userDetails.identityConfidenceLevel = coreIdentity.vot;

        return userDetails;
    }

    private Map<String, Object> getMetadataMap(String discoveryUrl) {

        String discoveryMetadata = getCachedWebResource(discoveryUrl);
        Map<String, Object> discoveryMetadataMap = (Map<String, Object>) JSON.deserializeUntyped(discoveryMetadata);

        return discoveryMetadataMap;
    }

    private String getPublicKey(String header,  String didUrl) {
        // header contains the required kid
        // e.g.{"kid":"did:web:identity.integration.account.gov.uk#c9f8da1c87525bb4165357128129daa936","alg":"ES256"}

        Map<String, Object> headerMap = (Map<String, Object>) JSON.deserializeUntyped(header);
        String kid = (String) headerMap.get('kid');
        List<String> kidParts = kid.split('#');
        String controllerId = kidParts[0];
        String uniqueKeyId  = kidParts[1];

        String publicKey = getCachedPublicKey(kid);

        if (publicKey != 'Cache Miss') {            
            return publicKey;
        } else {
            // String expectedDidId = 'did:web:' + didUrl.replace('/.well-known/did.json', '').replace('https://', '');
            // System.debug('expectedDidId=' + expectedDidId);
            DecentralizedIdentifierDocument did = getDid(didUrl, controllerId);
            if (did != null) {
                Map<String, String> publicKeys = processDidFile(did);
                if (publicKeys.containsKey(kid)) {
                    publicKey = publicKeys.get(kid);
                }
            }

            return publicKey;
        }
    }

    private Map<String, String> processDidFile(DecentralizedIdentifierDocument did) {
        // extract key(s) from DID
        Map<String, String> publicKeys = new Map<String, String>();
        Integer i = 0;

        while (i < did.assertionMethod.size()) {
            String publicKey = convertJWKSToPEM(did.assertionMethod[i].publicKeyJwk.x, did.assertionMethod[i].publicKeyJwk.y);
            String assertionMethodId = did.assertionMethod[i].id;
            cachePublicKey(assertionMethodId, publicKey);
            publicKeys.put(assertionMethodId, publicKey);
            i++;
        }        
        return publicKeys;
    }

    private DecentralizedIdentifierDocument getDid(String didUrl, String controllerId) {

        String didJSON = getWebResource(didUrl);
        DecentralizedIdentifierDocument did = (DecentralizedIdentifierDocument) JSON.deserialize(didJSON, DecentralizedIdentifierDocument.class);
        // check if controllerId is correct
        if (did.id == controllerId) {
            return did;
        } else {
            return null;
        }
    }

    private String getWebResource(String resourceUrl) {

        HttpRequest req = new HttpRequest();
        req.setEndpoint(resourceUrl);
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');

        Http http = new Http();
        HTTPResponse res = http.send(req);
        String resource = res.getBody();

        return resource;
    }

    private String getCachedWebResource(String resourceUrl) {
        String cacheId = getCacheId(resourceUrl);
        System.debug('resourceUrl=' + resourceUrl);
        System.debug('cacheId=' + cacheId);
        String cachedResource = PlatformCacheRecipes.getValuefromOrgCache(cacheId);

        System.debug('cachedResource=' + cachedResource);

        if (cachedResource == 'Cache Miss') {
            cachedResource = getWebResource(resourceUrl);
            PlatformCacheRecipes.storeValueInOrgCache(cacheId, cachedResource, 1800);
        }
        return cachedResource;
    }

    private void cachePublicKey(String kid, String publicKey) {
        String cacheId = getCacheId(kid);
        System.debug('kid=' + kid);
        System.debug('cacheId=' + cacheId);
        PlatformCacheRecipes.storeValueInOrgCache(cacheId, publicKey, 1800);
    }

    private String getCachedPublicKey(String kid) {
        String cacheId = getCacheId(kid);
        System.debug('kid=' + kid);
        System.debug('cacheId=' + cacheId);
        String cachedPublicKey = PlatformCacheRecipes.getValuefromOrgCache(cacheId);

        return cachedPublicKey;
    }

    public String convertJWKSToPEM(String x, String y) {
        // Decode the base64url encoded x and y coordinates
        Blob xBlob = base64UrlDecode(x);
        Blob yBlob = base64UrlDecode(y);

        // Encode the key in ASN.1 DER format
        String asn1Encoded = constructAsn1Sequence(xBlob, yBlob);
        System.debug('asn1Encoded=' + asn1Encoded);

        String pemBody = EncodingUtil.base64Encode(EncodingUtil.convertFromHex(asn1Encoded));
        System.debug('pemBody=' + pemBody);

        return pemBody;
    }

    private String constructAsn1Sequence(Blob blob1, Blob blob2) {
        // ASN.1 structure for EC public keys
        // SEQUENCE {
        //   SEQUENCE {
        //     OBJECT IDENTIFIER 1.2.840.10045.2.1 (ecPublicKey)
        //     OBJECT IDENTIFIER 1.2.840.10045.3.1.7 (prime256v1)
        //   }
        //   BIT STRING {
        //     0x04 <x> <y>
        //   }
        // }

        // EC Public Key ASN.1 Header in hex format
        String publicKeyPrefix = '3059301306072a8648ce3d020106082a8648ce3d030107034200';

        // Convert Blobs to hex strings
        String hex1 = EncodingUtil.convertToHex(blob1);
        String hex2 = EncodingUtil.convertToHex(blob2);

        // Concatenate the hex strings
        return publicKeyPrefix + '04' + hex1 + hex2;
    }
}