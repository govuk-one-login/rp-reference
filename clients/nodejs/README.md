# GOV.UK One Login Relying Party Single Client example

An example  Node.js TypeScript application using GOV.UK One Login to authenticate users for use with the [GOV.UK One Login integration environment](https://docs.sign-in.service.gov.uk/before-integrating/register-and-manage-your-service/) and the [GOV.UK One Login Simulator](https://github.com/govuk-one-login/simulator).

> [!WARNING]
> This is intended as a reference and doesn't represent production quality code.

`git clone https://github.com/govuk-one-login/rp-reference`

`cd rp-reference/clients/nodejs`

`cp example.env .env`

configure your `.env` file to point to integration or the simulator

`npm install`

`npm run build`

`npm run dev`

go to http://localhost:3001
