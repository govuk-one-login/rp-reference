global class GovUK extends Auth.AuthProviderPluginClass {
    
    
    public String redirectUrl;
    private String clientId;
    private String clientSecret;
    private String authUrl;
    private String tokenUrl;
    private String userInfoUrl;
    private String scope;
    
    public class RegPluginException extends Exception {}
    
    global String getCustomMetadataType() {
        return 'OneLogin_Auth_Provider_Metadata__mdt'; 
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
    clientSecret = authProviderConfiguration.get('Consumer_Secret__c');
    tokenUrl = authProviderConfiguration.get('Token_Endpoint_URL__c');
    redirectUrl = authProviderConfiguration.get('Redirect_URL__c'); 
       
    
    Map<String, String> queryParams = state.queryParameters;
    String code = queryParams.get('code');
    String sfdcState = queryParams.get('state');
       
    HttpRequest req = new HttpRequest();
    req.setEndpoint(tokenUrl);
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    
      String reqbody = 'code=' + code + '&client_id=' + clientId + '&client_secret=' + clientSecret + '&grant_type=authorization_code'+ '&redirect_uri='+ redirectUrl;
        req.setBody(reqbody); 
        System.debug('handleCallback req:' + req);
    
       try {
    Http http = new Http();
    HTTPResponse res = http.send(req);
    
    String responseBody = res.getBody();
    system.debug('RESPONSE_ToString'+res.toString()); 
    system.debug(responseBody);   
    String idtoken = getTokenValueFromResponse(responseBody, 'id_token', false);
    String accessToken = getTokenValueFromResponse(responseBody, 'access_token', false);

           
           return new Auth.AuthProviderTokenResponse('OneLogin', idToken, accessToken, sfdcState);
   
       }
       catch(RegPluginException e){
            throw new RegPluginException(e.getMessage());
       }

  }
    
    global Auth.UserData getUserInfo(Map<String, String> authProviderConfiguration, Auth.AuthProviderTokenResponse response) {
       
        String accessToken = response.oauthToken;
        System.debug('accessToken:' + accessToken);
        
        userInfoUrl = authProviderConfiguration.get('User_Info_Endpoint_URL__c');
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(userInfoUrl);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        
        Http http = new Http();
        HTTPResponse res = http.send(req);
        
        Map<String, Object> userInfo = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
        
        
        String userId = (String)userInfo.get('sub');
        String firstName = (String)userInfo.get('given_name');
        String lastName = (String)userInfo.get('family_name');
        String fullName = firstName + ' ' + lastName;
        String email = (String)userInfo.get('email');
        String locale = (String)userInfo.get('locale');
        
        
        return new Auth.UserData(userId, firstName, lastName, fullName, email, null, locale, null, 'OneLogin', null, null);
    }
    
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
        
        try{
            Map<String, Object> jsonResponse =  (Map<String, Object>) json.deserializeUntyped(response);
            System.debug('jsonResponse'+jsonResponse);
            if(!isArray){
                ret=jsonResponse.get(key).toString();
            } else{
                List<Object> emailsArray =  (List<Object>) jsonResponse.get(key);
                ret= emailsArray[0].toString();
            }
            System.debug(key + ': ' +ret);
        } catch(RegPluginException e){
            throw new RegPluginException(key + ' is not available in response.' + e.getMessage());    
        }
        return ret;
        
    }

}