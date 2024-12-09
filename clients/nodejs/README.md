# Example GOV.UK One Login Relying Party in Typescript

> [!WARNING]
> This is intended as a example and is not production quality code.

An example Node.js TypeScript application using GOV.UK One Login to authenticate users for use with the [GOV.UK One Login integration environment](https://docs.sign-in.service.gov.uk/before-integrating/register-and-manage-your-service/) and the [GOV.UK One Login Simulator](https://github.com/govuk-one-login/simulator).

It is preconfigured to work with a local instance of the GOV.UK One Login Simulator. It can be configured to work with the integration environmnent by configuring a client using the [self service admin tool](https://admin.sign-in.service.gov.uk/register/enter-email-address) and updating the `.env`. 


## Start the simulator

The example requires a local copy of the simulator running on port 3000.

Run the simulator locally with:

`docker run --rm -d -p 3000:3000 --name simulator ghcr.io/govuk-one-login/simulator:latest`

There are some npm run targets provided to help you work with the simulator with Docker Desktop:

- `npm run simulator:start` - start a copy of the simulator
- `npm run simulator:status`- check the status of the simulator
- `npm run simulator:stop` - stop the simulator
- `npm run simulator:shell` - run a shell inside the simulator

## Run the example from source
```
git clone https://github.com/govuk-one-login/onboarding-examples
cd rp-reference/clients/nodejs
npm install
npm run build
npm run dev:sim
open http://localhost:8080
```
