public class CoreIdentity {

    public String sub;
    public String aud;
    public Long nbf;
    public String iss;
    public String vot;
    public Long exp;
    public Long iat;
    public VerifiableCredential vc;

    public class VerifiableCredential {    
        public List<String> type;
        public CredentialSubject credentialSubject;
    }

    public class CredentialSubject { 
        public List<Name> name;
        public List<BirthDate> birthDate;
    }

    public class Name {
        public List<NameParts> nameParts;
    }
    
    public class NameParts{
        public String value;
        public String type;
    }

    public class BirthDate {
        public String value;
    }
    
    public String vtm;
}



