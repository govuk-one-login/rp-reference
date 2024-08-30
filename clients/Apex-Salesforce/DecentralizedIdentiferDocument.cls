public class DecentralizedIdentifierDocument {

    public List<String> context;
    public String id;
    public List<AssertionMethod> assertionMethod;

    public class AssertionMethod {
        public string type;
        public string id;
        public String controller;
        public PublicKeyJWK publicKeyJwk;
    }
    
    public class PublicKeyJWK {    
        public String kty;
        public String crv;
        public String x;
        public String y;
        public String alg;
    }
}
