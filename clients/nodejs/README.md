# Example GOV.UK One Login relying party client using Node.js and Typescript

> [!WARNING]
> This is intended as a example and is not production quality code.

An example [Node.js](https://nodejs.org/) [TypeScript](https://www.typescriptlang.org/) application using GOV.UK One Login to authentication and identity.

The example demonstrates:

- configuration using the discovery metadata endpoint and a local environment variables
- authentication request
- identity verification request
- coreIdentityJWT validation using a public key retrieved from the DID endpoint
- logout request
- use of JWT Authorisation Request (JAR)

Works with the:

- [GOV.UK One Login Simulator](https://github.com/govuk-one-login/simulator)
which is preconfigured to allow authentication and identity journeys.
- [GOV.UK One Login integration environment](https://docs.sign-in.service.gov.uk/before-integrating/register-and-manage-your-service/) which requires you use the [GOV.UK One Login admin tool](https://admin.sign-in.service.gov.uk/register/enter-email-address) to create configuration and that you update your `.env.integration` configuration file with the Client ID and Public Key.

## Get the example code

```bash
git clone https://github.com/govuk-one-login/onboarding-examples
cd onboarding-examples/clients/nodejs
```

## Run example and simulator in Docker containers using compose

```bash
docker compose up 
```

Browse to [http://localhost:8080](http://localhost:8080)

## Run example from source and the simulator in a Docker container

### 1. Start the simulator

Run the simulator locally with

```bash
npm run simulator:start 
```

Check it is working with

```bash
curl -s http://localhost:3000/.well-known/openid-configuration | jq .
```

### 2. Build the example

Resolve dependencies and build the app

```bash
nvm install 22.11.0 && nvm use 22.11.0
npm ci && npm npm run build
```

### 3. Run the example

Start the example with

```bash
npm run dev:sim
```

Browse to open [http://localhost:8080](http://localhost:8080) then

- press the "Make a request for authentication" button
- press the "Make a request for authentication and identity" button to check identity
- click the "Sign out" link in the service header
