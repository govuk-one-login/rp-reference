# Example automation for GOV.UK One Login clients
This repo contains example of browser based automation of the authentication and
identity verification steps to validate a client integration with the GOV.UK One
Login.

## How to run

### Prerequisites

 1. Install NodeJS
 2. Install node modules `npm install`
 3. Register a test user account to perform authentication with. You will need to select App based 2FA (not SMS) to automate authentication and record the TOTP secret.
 3. Use `testdata.json.example` as a template for `testdata.json` and update the appropriate values.
 4. Update the `RP_URL` value in `.env` to the initial page of the relying party.
 5. Update the code to start the journey in the RP interface.  

### Run
```
npm start
```