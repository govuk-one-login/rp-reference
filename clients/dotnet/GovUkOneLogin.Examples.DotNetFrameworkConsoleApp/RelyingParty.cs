using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace GovUkOneLogin.Examples.DotNetFrameworkConsoleApp
{
    public class RelyingParty
    {
        public const string CoreIdentityClaimIdentifier = "https://vocab.account.gov.uk/v1/coreIdentityJWT";

        private readonly string ClientId;
        private readonly OpenIdConnectProtocolValidator ProtocolValidator;
        private readonly HttpClient BackChannel;
        private readonly IConfigurationManager<OpenIdConnectConfiguration> ConfigurationManager;
        private readonly SecurityKey ClientPrivateKey;
        private readonly SecurityKey IssuerPublicKey;
        private readonly string CoreIdentityClaimIssuer;

        public RelyingParty(string clientId, string metadataAddress, SecurityKey clientPrivateKey, SecurityKey issuerPublicKey, string coreIdentityClaimIssuer)
        {
            ClientPrivateKey = clientPrivateKey;
            IssuerPublicKey = issuerPublicKey;
            ClientId = clientId;
            CoreIdentityClaimIssuer = coreIdentityClaimIssuer;

            ProtocolValidator = new OpenIdConnectProtocolValidator
            {
                RequireNonce = true,
                RequireState = true,
                RequireStateValidation = true
            };

            BackChannel = new HttpClient();

            // Metadata endpoint requires a user agent header.
            var assemblyName = Assembly.GetCallingAssembly().GetName();
            BackChannel.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue(assemblyName.Name, assemblyName.Version.ToString()));

            ConfigurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(metadataAddress, new OpenIdConnectConfigurationRetriever(), BackChannel);
        }

        public string GenerateNonce()
        {
            return ProtocolValidator.GenerateNonce();
        }

        public async Task<string> BuildAuthenticationRequestUrl(string redirectUri, string nonce, string state, CancellationToken cancellationToken)
        {
            var config = await ConfigurationManager.GetConfigurationAsync(cancellationToken);
            var authenticationRequestMessage = new OpenIdConnectMessage();
            authenticationRequestMessage.IssuerAddress = config.AuthorizationEndpoint;
            authenticationRequestMessage.Scope = "openid email";
            authenticationRequestMessage.ClientId = ClientId;
            authenticationRequestMessage.RedirectUri = redirectUri;
            authenticationRequestMessage.ResponseType = OpenIdConnectResponseType.Code;
            authenticationRequestMessage.Nonce = nonce;
            authenticationRequestMessage.State = state;
            authenticationRequestMessage.Parameters.Add("vtr", "[\"Cl.Cm.P2\"]");
            authenticationRequestMessage.Parameters.Add("claims", "{\"userinfo\":{\"https://vocab.account.gov.uk/v1/coreIdentityJWT\": null }}");
            return authenticationRequestMessage.CreateAuthenticationRequestUrl();
        }

        public async Task<string> Callback(NameValueCollection nameValueCollection, string redirectUri, string nonce, string state, CancellationToken cancellationToken)
        {
            var authenticationResponseMessage = new OpenIdConnectMessage(nameValueCollection);
            ValidateAuthenticationResponse(authenticationResponseMessage, state);

            // Exchange the authorization code for access_token and id_token
            var tokenResponseMessage = await RedeemAuthorizationCode(authenticationResponseMessage.Code, redirectUri, nonce, cancellationToken);
            var validatedIdToken = await GetValidatedIdToken(tokenResponseMessage);
            ValidateTokenResponse(tokenResponseMessage, validatedIdToken, nonce);

            // Use the access token to call the userinfo endpoint
            var userinfoEndpointResponse = await GetUserInformation(tokenResponseMessage.AccessToken, cancellationToken);
            ValidateUserInfoResponse(validatedIdToken, userinfoEndpointResponse);

            return userinfoEndpointResponse;
        }

        private void ValidateAuthenticationResponse(OpenIdConnectMessage protocolMessage, string state)
        {
            var context = new OpenIdConnectProtocolValidationContext();
            context.ProtocolMessage = protocolMessage;
            context.State = state;
            ProtocolValidator.ValidateAuthenticationResponse(context);
        }

        // Make a token request
        // https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/integrate-with-code-flow/#make-a-token-request
        public async Task<OpenIdConnectMessage> RedeemAuthorizationCode(string authorizationCode, string redirectUri, string nonce, CancellationToken cancellationToken)
        {
            var config = await ConfigurationManager.GetConfigurationAsync(cancellationToken);
            var tokenEndpoint = config.TokenEndpoint;

            var clientAssertion = CreateClientAssertion(tokenEndpoint);

            var parameters = new Dictionary<string, string>();
            parameters.Add("grant_type", "authorization_code");
            parameters.Add("code", authorizationCode);
            parameters.Add("redirect_uri", redirectUri);
            parameters.Add("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
            parameters.Add("client_assertion", clientAssertion);

            var requestMessage = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint);
            requestMessage.Content = new FormUrlEncodedContent(parameters);

            var responseMessage = await BackChannel.SendAsync(requestMessage);
            var responseContent = await responseMessage.Content.ReadAsStringAsync();
            return new OpenIdConnectMessage(responseContent);
        }

        // Create a JWT assertion
        // https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/integrate-with-code-flow/#create-a-jwt-assertion
        private string CreateClientAssertion(string tokenEndpoint)
        {
            var signingCredentials = new SigningCredentials(ClientPrivateKey, "RS256");

            var handler = new JwtSecurityTokenHandler()
            {
                SetDefaultTimesOnTokenCreation = true,
                TokenLifetimeInMinutes = 1
            };

            var claims = new Claim[]
            {
                new Claim("sub", ClientId),
                new Claim("jti", GenerateJti())
            };
            var subject = new ClaimsIdentity(claims);

            return handler.CreateEncodedJwt(ClientId, tokenEndpoint, subject, null, null, null, signingCredentials);
        }

        private string GenerateJti()
        {
            return Guid.NewGuid().ToString();
        }

        // Validate your ID token
        // https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/integrate-with-code-flow/#validate-your-id-token
        private async Task<JwtSecurityToken> GetValidatedIdToken(OpenIdConnectMessage message)
        {
            var parameters = new TokenValidationParameters
            {
                // Setting the configuration manager uses it to obtain the signing keys and issuer
                ConfigurationManager = (BaseConfigurationManager)ConfigurationManager,
                ValidAudience = ClientId,
                ValidAlgorithms = new[] { "ES256" },
                RequireSignedTokens = true
            };

            var handler = new JwtSecurityTokenHandler();
            var result = await handler.ValidateTokenAsync(message.IdToken, parameters);
            if (!result.IsValid)
            {
                throw result.Exception;
            }

            return (JwtSecurityToken)result.SecurityToken;
        }

        private void ValidateTokenResponse(OpenIdConnectMessage message, JwtSecurityToken validatedIdToken, string nonce)
        {
            var validationContext = new OpenIdConnectProtocolValidationContext();
            validationContext.ProtocolMessage = message;
            validationContext.Nonce = nonce;
            validationContext.ValidatedIdToken = validatedIdToken;
            ProtocolValidator.ValidateTokenResponse(validationContext);
        }

        // Retrieve user information
        // https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/integrate-with-code-flow/#retrieve-user-information
        private async Task<string> GetUserInformation(string accessToken, CancellationToken cancellationToken)
        {
            var config = await ConfigurationManager.GetConfigurationAsync(cancellationToken);
            var userInfoEndpoint = config.UserInfoEndpoint;
            var requestMessage = new HttpRequestMessage(HttpMethod.Get, userInfoEndpoint);
            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            var responseMessage = await BackChannel.SendAsync(requestMessage, cancellationToken);
            responseMessage.EnsureSuccessStatusCode();
            return await responseMessage.Content.ReadAsStringAsync();
        }

        private void ValidateUserInfoResponse(JwtSecurityToken idToken, string userInfoEndpointResponse)
        {
            var validationContext = new OpenIdConnectProtocolValidationContext();
            validationContext.UserInfoEndpointResponse = userInfoEndpointResponse;
            validationContext.ValidatedIdToken = idToken;
            ProtocolValidator.ValidateUserInfoResponse(validationContext);
        }

        public async Task ValidateCoreIdentityClaim(string coreIdentityClaim, string requiredLevelOfConfidence)
        {
            var parameters = new TokenValidationParameters
            {
                IssuerSigningKey = IssuerPublicKey,
                ValidateAudience = false,
                ValidIssuer = CoreIdentityClaimIssuer,
                ValidateIssuer = true,
                ValidAlgorithms = new[] { "ES256" }
            };

            var handler = new JwtSecurityTokenHandler();
            var result = await handler.ValidateTokenAsync(coreIdentityClaim, parameters);
            if (!result.IsValid)
            {
                throw result.Exception;
            }

            var token = result.SecurityToken as JwtSecurityToken;

            // Check your user’s identity credential matches the level of confidence needed
            // https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/process-identity-information/#check-your-user-s-identity-credential-matches-the-level-of-confidence-needed
            var votClaim = token.Claims.FirstOrDefault(claim => claim.Type == "vot");
            if (votClaim == null || votClaim.Value != requiredLevelOfConfidence)
            {
                throw new Exception("vot mismatch. Required level of confidence not acheived");
            }
        }
    }
}
