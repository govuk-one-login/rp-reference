using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Specialized;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace GovUkOneLogin.Examples.DotNetFrameworkConsoleApp
{
    internal class Program
    {
        private const string ClientId = "IcV...<your client id>...G0Y";
        private const string ClientPrivateKey = "MIIE...<your prvate key>...fbGw=";
        private const string IssuerPublicKey = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAENPGA7cyIKtH1nz2CJIH14s9/CtC93NwdCQcEi+ADvxjZxN2YcCZmOKCGXLfiVdzETDnRxsoVXsVM51kqE4bumw==";
        private const string MetadataAddress = "https://oidc.integration.account.gov.uk/.well-known/openid-configuration";
        private const string CoreIdentityClaimIssuer = "https://identity.integration.account.gov.uk/";
        private const string LoginUri = "http://localhost:3001/oauth/login";
        private const string RedirectUri = "http://localhost:3001/oauth/callback";
        private const string RequiredLevelOfConfidence = "P2";

        static void Main(string[] args)
        {
            Start(CancellationToken.None).Wait();
        }

        private static async Task Start(CancellationToken cancellationToken)
        {
            var clientPrivateKey = SecurityKeyHelpers.ReadRsaPrivateKey(Convert.FromBase64String(ClientPrivateKey));
            var issuerPublicKey = SecurityKeyHelpers.ReadEcDsaNistP256PublicKey(Convert.FromBase64String(IssuerPublicKey));

            var rp = new RelyingParty(ClientId, MetadataAddress, clientPrivateKey, issuerPublicKey, CoreIdentityClaimIssuer);

            var nonce = rp.GenerateNonce();
            var state = "example state";

            // Wait for a browser to navigate to the login URL.(this can be helpful if running automation in a separate process).
            Console.WriteLine($"Navigate to {LoginUri} in a web browser");
            
            // Redirect the user on to the authorize endpoint URI
            await HttpHelpers.WaitForLogin(LoginUri, () => rp.BuildAuthenticationRequestUrl(RedirectUri, nonce, state, cancellationToken));

            // Wait for the browser to come back to the redirect uri
            var queryParameters = await HttpHelpers.WaitForCallbackQueryParameters(RedirectUri);

            // Do the token exchange and get the userinfo response back as JSON.
            var userInfoJson = await rp.Callback(queryParameters, RedirectUri, nonce, state, cancellationToken);

            /* 
             * Process your user’s identity information
             * https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/process-identity-information/#process-your-user-s-identity-information
             */

            // Parse the userinfo JSON so we can pull out the core identity claim.
            var userInfo = JwtPayload.Deserialize(userInfoJson);
            var coreIdentityClaim = userInfo.Claims.FirstOrDefault(claim => claim.Type == RelyingParty.CoreIdentityClaimIdentifier);
            if (coreIdentityClaim != null) {

                /*
                * Understand your user’s core identity claim
                * https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/process-identity-information/#understand-your-user-s-core-identity-claim
                */

                // Validate your user’s identity credential. Checking the signature with the public key from
                // the GOV.UK One Login service and ensuring the level of confidence is met.
                await rp.ValidateCoreIdentityClaim(coreIdentityClaim.Value, RequiredLevelOfConfidence);

                // Read the require values out of the validated core identity claim
                var handler = new JwtSecurityTokenHandler();
                var coreIdentityJwt = handler.ReadJwtToken(coreIdentityClaim.Value);
                var coreIdentity = JsonSerializer.Deserialize<CoreIdentity>(Base64UrlEncoder.Decode(coreIdentityJwt.EncodedPayload));

                foreach (var name in coreIdentity.vc.credentialSubject.name)
                {
                    var fullName = string.Join(" ", name.nameParts.Select(namePart => namePart.value));
                    Console.WriteLine(fullName);
                }

                foreach (var birthDate in coreIdentity.vc.credentialSubject.birthDate)
                {
                    Console.WriteLine(birthDate.value);
                }
            }

            Console.ReadLine();
        }
    }
}
