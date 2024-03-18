# GOV.UK One Login Relying Party Multi-client Application

A NodeJS+TypeScript application using GOV.UK One Login to authenticate users.

This is intended as a reference and doesn't represent production quality code.

This example contains two client appliocations:

1. Camelid dashboard - is an authentication only service that takes the use to a dashboard used to access the other service.
1. Alpaca tracker - is a n athentication and identity verification service. Once authenticated the main service page outputs the data returned by GOV.UK One Login.

## Development

``` bash
npm install
npm run dev-dashboard
npm run dev-alpaca
```

## Configuration

To configure the two client applications you will need to create a .env file in the 2 client application folders:

`clients\nodejs-multiclient\services\camelid-dashboard\` and
`clients\nodejs-multiclient\services\alpaca-tracker\`

You can use the file `clients\nodejs-multiclient\example.env` as a template.

Add more details here...
