import type { NextApiRequest, NextApiResponse } from "next"
import NextAuth from "next-auth"
// import GoogleProvider from "next-auth/providers/google"
// import FacebookProvider from "next-auth/providers/facebook"
// import GithubProvider from "next-auth/providers/github"
// import TwitterProvider from "next-auth/providers/twitter"
// import Auth0Provider from "next-auth/providers/auth0"
// import AppleProvider from "next-auth/providers/apple"
// import EmailProvider from "next-auth/providers/email"
import GovUkSignInProvider from "../../../providers/govuksignin"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default (req: NextApiRequest, res: NextApiResponse) =>
  NextAuth(req, res, {
    // https://next-auth.js.org/configuration/providers/oauth
    providers: [
      // GOV.UK Sign In - https://www.sign-in.service.gov.uk/
      // The redirect_uris in the client registration must match.
      // To test locally with npm run dev use http://localhost:3000/api/auth/callback/govuksignin
      // see: https://next-auth.js.org/configuration/providers/oauth#how-to
      GovUkSignInProvider(req, res, {
        clientId: process.env.GOVUKSIGNIN_ID,
        privateKey: process.env.GOVUKSIGNIN_PRIVATE_KEY,
      }),
      /*
      EmailProvider({
        server: process.env.EMAIL_SERVER,
        from: process.env.EMAIL_FROM,
      }),
      // Temporarily removing the Apple provider from the demo site as the
      // callback URL for it needs updating due to Vercel changing domains
      Providers.Apple({
        clientId: process.env.APPLE_ID,
        clientSecret: {
          appleId: process.env.APPLE_ID,
          teamId: process.env.APPLE_TEAM_ID,
          privateKey: process.env.APPLE_PRIVATE_KEY,
          keyId: process.env.APPLE_KEY_ID,
        },
      }),
      FacebookProvider({
        clientId: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
      }),
      GithubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
      }),
      TwitterProvider({
        clientId: process.env.TWITTER_ID,
        clientSecret: process.env.TWITTER_SECRET,
      }),
      Auth0Provider({
        clientId: process.env.AUTH0_ID,
        clientSecret: process.env.AUTH0_SECRET,
        issuer: process.env.AUTH0_ISSUER,
      }),
      */
    ],
    theme: {
      colorScheme: "light",
    },
    callbacks: {
      async jwt({ token }) {
        token.userRole = "admin"
        return token
      },
    },
  })
