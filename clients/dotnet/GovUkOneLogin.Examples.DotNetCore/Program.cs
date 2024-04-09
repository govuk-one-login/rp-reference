using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

namespace govuk_one_login_aspdotnet_core
{
  public class Program
  {
    const string ENVIRONMENT_DOMAIN = "oidc.integration.account.gov.uk";

    public static void Main(string[] args)
    {
      var builder = WebApplication.CreateBuilder(args);

      // Add services to the container.
      builder.Services
        .AddAuthentication(options =>
        {
          options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
          options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
          options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        })
        .AddCookie()
        .AddOpenIdConnect(options =>
        {
          options.ClientId = "dotnet";
          options.MetadataAddress = $"https://{ENVIRONMENT_DOMAIN}/.well-known/openid-configuration";

          // Scope is a list of information that the client is requesting from the user.
          options.Scope.Clear();
          options.Scope.Add("openid");
          options.Scope.Add("email");
          options.Scope.Add("phone");

          options.UsePkce = false;
          options.ResponseMode = "query";
          options.ResponseType = "code";

          options.SaveTokens = true;

          // The UserInfo endpoint is used to get the claims.
          options.GetClaimsFromUserInfoEndpoint = true;

          // GOV.UK One Login used a client assertian to secure the token exchange instead of a client secret.
          // This is a JWT signed with the client's private key.
          // The public key is registered with GOV.UK One Login.
          options.Events.OnAuthorizationCodeReceived = context =>
          {
            // Load the private key from a secure location.
            // This example loads the private key from a file, but you could use a secret store.
            var rsa = RSA.Create();
            rsa.ImportFromPem(File.ReadAllText("./keys/example_private_key.pem"));
            var clientPrivateKey = new RsaSecurityKey(rsa);
            var signingCredentials = new SigningCredentials(clientPrivateKey, "RS256");

            // Create a JWT token with the client ID as the issuer and the token endpoint as the audience.
            var jwt = new JwtSecurityToken(
              issuer: context.Options.ClientId,
              audience: $"https://{ENVIRONMENT_DOMAIN}/token",
              claims: new List<Claim> {
                new Claim("sub", context.Options.ClientId),
                new Claim("jti", Guid.NewGuid().ToString())
              },
              expires: DateTime.UtcNow.AddMinutes(5),
              signingCredentials: signingCredentials
            );

            var tokenHandler = new JwtSecurityTokenHandler();
            var clientAssertion = tokenHandler.WriteToken(jwt);
            context.TokenEndpointRequest!.ClientAssertion = clientAssertion;
            context.TokenEndpointRequest.ClientAssertionType = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
            return Task.CompletedTask;
          };
        }
      );

      var app = builder.Build();
      app.UseAuthentication();
      app.UseCookiePolicy(new CookiePolicyOptions
      {
        // Configure cookies to be set for non-secure connections while testing.
        // In production, you should set Secure to Always.
        OnAppendCookie = cookieContext =>
        {
          cookieContext.CookieOptions.SameSite = SameSiteMode.Lax;
          cookieContext.CookieOptions.Secure = false;
        },
        HttpOnly = HttpOnlyPolicy.Always,
        MinimumSameSitePolicy = SameSiteMode.Lax,
        Secure = CookieSecurePolicy.None
      });

      app.MapGet("/", async (ctx) =>
      {
        if (ctx.User.Identity!.IsAuthenticated)
        {
          await ctx.Response.WriteAsync("<html><head><title>Home</title></head><body><a href=\"/logout\">Logout</a></body></html>");
        }
        else
        {
          await ctx.Response.WriteAsync("<html><head><title>Home</title></head><body><a href=\"/login\">Login</a></body></html>");
        }
      });

      app.MapGet("/login", async (ctx) =>
      {
        if (!ctx.User.Identity!.IsAuthenticated)
        {
          await ctx.ChallengeAsync();
        }
        else
        {
          ctx.Response.Redirect("/");
        }
      });

      app.MapGet("/logout", async (ctx) =>
      {
        await ctx.SignOutAsync();
        ctx.Response.Redirect("/");
      });

      app.Run("http://localhost:3000");
    }
  }
}