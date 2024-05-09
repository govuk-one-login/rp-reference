# GovUkOneLogin.Examples.DotNetCore

This project is an example of integrating .NET Core with GOV.UK One Login using ASP.NET Core and OpenID Connect.

## Overview

The `GovUkOneLogin.Examples.DotNetCore` project demonstrates how to authenticate users via the GOV.UK One Login service in a .NET Core application. It uses the ASP.NET Core framework and the OpenID Connect protocol for secure user authentication.

## Prerequisites

To run this project, you will need:

- .NET Core 3.1 or later
- A GOV.UK One Login client ID and public key pair
- A GOV.UK One Login account

## Key Components

Call the `AddAuthentication` method to configure the authentication services. In this example, the default scheme is set to `CookieAuthenticationDefaults.AuthenticationScheme`, which is the scheme that can persist the identity that is provided by the GOV.UK One Login. The `DefaultChallengeScheme` is set to `OpenIdConnectDefaults.AuthenticationScheme`, which is used to authenticate users via GOV.UK One Login when they are challenged.

```csharp
services.AddAuthentication(options =>
{
  options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
```

Call `AddOpenIdConnect` to configure the OpenID Connect authentication handler. This method is used to configure the OpenID Connect authentication handler with the necessary settings to use GOV.UK One Login. The `ClientId` and are provided by GOV.UK One Login. The `MetadataAddress` is the URL of the GOV.UK One Login service environment.

Set the `ResponseMode` to `query` and `ResponseType` to `code` to use the authorization code flow.

```csharp
options.ResponseMode = "query";
options.ResponseType = "code";
```

Set the scopes based on the details about the user that you need.

```csharp
options.Scope.Clear();
options.Scope.Add("openid");
options.Scope.Add("email");
options.Scope.Add("phone");
```

To retrieve the user claims from the userinfo endpoint, set the `GetClaimsFromUserInfoEndpoint` property to `true`.

```csharp
options.GetClaimsFromUserInfoEndpoint = true;
```

GOV.UK One Login uses a client assertion to secure the token exchange instead of a client secret.
This is a JWT signed with the client's private key.
The public key should be registered with GOV.UK One Login.

```csharp
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
```

## Running the Project

To run the project, use the following command in the terminal:

```bash
dotnet run
```

This will start the application. You can then navigate to `http://localhost:5000` in your web browser to view the application.
