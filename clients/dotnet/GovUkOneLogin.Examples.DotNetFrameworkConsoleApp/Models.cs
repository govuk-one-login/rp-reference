using System;
using System.Collections.Generic;

namespace GovUkOneLogin.Examples.DotNetFrameworkConsoleApp
{
    public class CoreIdentity
    {
        public VerifiableIdentityCredential vc { get; set; }
    }

    public class VerifiableIdentityCredential
    {
        public Person credentialSubject { get; set; }
    }

    public class Person
    {
        public List<Name> name { get; set; }

        public List<BirthDate> birthDate {get; set;}
    }

    public class Name
    {
        public string validFrom { get; set; }
        public List<NamePart> nameParts { get; set; }
    }

    public class NamePart
    {
        public string value { get; set; }

        public string type { get; set; }
    }

    public class BirthDate
    {
        public string value { get; set; }

        public DateTime? validFrom { get; set; }

        public DateTime? validUntil { get; set; }
    }
}
