# Example GOV.UK One Login relying party client in Typescript

> [!WARNING]
> This is intended as a example and is not production quality code.

An example [Node.js](https://nodejs.org/) [TypeScript](https://www.typescriptlang.org/) application using GOV.UK One Login to authentication and identity.

Works with the:

- [GOV.UK One Login Simulator](https://github.com/govuk-one-login/simulator)
- [GOV.UK One Login integration environment](https://docs.sign-in.service.gov.uk/before-integrating/register-and-manage-your-service/)

It is preconfigured to show an authentication and identity with a local instance of the GOV.UK One Login Simulator. 

You will need to configure a client in the integration environmnent with the [GOV.UK One Login admin tool](https://admin.sign-in.service.gov.uk/register/enter-email-address) and update the configuration in the local`.env.integration` file with the Client ID and Public Key. 

### Get the example code

```
git clone https://github.com/govuk-one-login/onboarding-examples
cd onboarding-examples/clients/nodejs
```

## TL;DR

```
(sleep 3; open http://localhost:8080) &
docker compose up 
```


```
cd $(mktemp -d)
git clone -b refactor-and-bump-openid-client https://github.com/govuk-one-login/onboarding-examples
cd onboarding-examples/clients/nodejs
npm run simulator:start 
nvm install 22.11.0 && nvm use 22.11.0
npm ci && npm npm run build
npm run dev:sim
```



## 1. Get the code
```
git clone -b refactor-and-bump-openid-client https://github.com/govuk-one-login/onboarding-examples
cd onboarding-examples/clients/nodejs
```

## 2. Start the simulator

Run the simulator locally with

```bash
npm run simulator:start 
```

Check it is working with

```
curl -s http://localhost:3000/.well-known/openid-configuration | jq .
```

## 3. Start an authentication journey

Resolve dependencies and build the app

```
nvm install 22.11.0 && nvm use 22.11.0
npm ci && npm npm run build
```

Start the example with 
```
npm run dev:sim
```

Browse to open http://localhost:8080 and press the green button.

Inspect the data returned

Select "Sign out" from the menu

You will be redirected

## 4. Start an identity journey

Resolve dependencies and build the app

```bash
nvm install 22.11.0 && nvm user 22.11.0
npm ci && npm npm run build
```

Start the example
```bash
npm run dev:sim
```

Browse to open http://localhost:8080 and press the green button.

Inspect the data returned

Select the "identity" button

You will receive an error because it is not yet configured

Configure the identity journey with 

```bash
npm run simulator:configure:keys
```

---
## Reference
There are some npm run targets provided to help you work with the simulator with Docker Desktop:

- `npm run simulator:restart` - restart     the simulator
- `npm run simulator:start` - start a copy of the simulator
- `npm run simulator:status`- check the status of the simulator
- `npm run simulator:stop` - stop the simulator
- `npm run simulator:shell` - run a shell inside the simulator

