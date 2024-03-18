
import { generateToken } from "./lib/totp";
import TestData from "../.testdata.json";
import { ProveIdentityWelcomeUnauthenticatedPage } from "./pages/ProveIdentityWelcomeUnauthenticatedPage";
import { KbvQuestionPage } from "./pages/KbvQuestionPage";
import { ProveIdentityWelcomeAuthenticatedPage } from "./pages/ProveIdentityWelcomePageAuthenticated";
import { IpvIdentityStartPage } from "./pages/IpvIdentityStartPage";
import { IpvSuccessPage } from "./pages/IpvSuccessPage";
import { setupDriver } from "./lib/setup-driver";
import { By, ThenableWebDriver } from "selenium-webdriver";

(async () => {

  const driver = setupDriver();

  // Start from the RP interface
  await driver.navigate().to(process.env.RP_URL);

  // Perform steps at RP to initiate the OpenID Connect flow
  await clickContinue(driver);

  // Do basic authentication to access the integration environment
  await basicAuthentication(driver, process.env.ENV_USER, process.env.ENV_PASSWORD);

  // Authenticate and perform identity verification
  const ipvIdentityStartPage = await authenticate(driver);
  const ipvSuccessPage = await iv(ipvIdentityStartPage);
  const ipvCallbackPage = await ipvSuccessPage.continue();
  await ipvCallbackPage.waitForRedirectToRp();

  // Browser should now have returned to RP redirect_uri

  // Try running the journey again, now that the user is authenticated
  await driver.navigate().to(process.env.RP_URL);

  // Perform steps at RP to initiate the OpenID Connect flow
  await clickContinue(driver);

  const proveIdentityWelcomeAuthenticatedPage = new ProveIdentityWelcomeAuthenticatedPage(driver);
  const ipvIdentityStartPage2 = await proveIdentityWelcomeAuthenticatedPage.continueToSignInOrCreateAccount();
  const ipvSuccessPage2 = await iv(ipvIdentityStartPage2);
  const ipvCallbackPage2 = await ipvSuccessPage2.continue();
  await ipvCallbackPage2.waitForRedirectToRp();

  // Browser should now have returned to RP redirect_uri

  await driver.quit();
})();

async function clickContinue(driver: ThenableWebDriver) {
  const continueButton = driver.findElement(By.xpath("//node()[text()[normalize-space() = 'Continue']]"));
  await continueButton.click();
}

async function authenticate(driver: ThenableWebDriver): Promise<IpvIdentityStartPage> {
  const proveIdentityWelcomeUnauthenticatedPage = new ProveIdentityWelcomeUnauthenticatedPage(driver);
  const photoIdPage = await proveIdentityWelcomeUnauthenticatedPage.continueToSignInOrCreateAccount();
  const signInOrCreateAccountPage = await photoIdPage.doYouHavePhotoIdYes();
  const enterEmailAddressPage = await signInOrCreateAccountPage.signIn();
  const enterPasswordPage = await enterEmailAddressPage.enterEmailAddress(TestData.username);
  const enterSecurityCodePage = await enterPasswordPage.enterPassword(TestData.password);
  const ipvIdentityStartPage = await enterSecurityCodePage.enterSecurityCode(generateToken(TestData.totpSecret));
  return ipvIdentityStartPage;
}

async function iv(ipvIdentityStartPage: IpvIdentityStartPage) : Promise<IpvSuccessPage> {
  const selectDevicePage = await ipvIdentityStartPage.continue();
  const selectSmartphonePage = await selectDevicePage.computerOrTablet();
  const passportDocCheckPage = await selectSmartphonePage.noSmartphone();
  const passportDetailsPage = await passportDocCheckPage.continue();
  const addressSearchPage = await passportDetailsPage.enterPassportDetails(TestData);
  const addressSearchResultsPage = await addressSearchPage.searchAddress(TestData.postcode);
  const addressCheckPage = await addressSearchResultsPage.selectAddress(TestData.address);
  await addressCheckPage.inputAddressYearFrom(TestData.addressYearFrom);
  const summaryConfirmPage = await addressCheckPage.continue();
  const checkDetailsPage = await summaryConfirmPage.confirm();
  const preKbvTransitionPage = await checkDetailsPage.continue();

  // Answer KBV questions
  let kbvQuestionPage : KbvQuestionPage | IpvSuccessPage = await preKbvTransitionPage.continue();
  while(kbvQuestionPage instanceof KbvQuestionPage){
    const questionId = await kbvQuestionPage.questionId();
    const options = await kbvQuestionPage.getOptions();
    const option = pickKbvAnswer(TestData.kbvAnswers, questionId, options);
    await kbvQuestionPage.selectOption(option!);
    kbvQuestionPage = await kbvQuestionPage.continue();
  }

  return kbvQuestionPage;
}

async function basicAuthentication(driver: ThenableWebDriver, username: string, password: string) {
  const url = new URL(await driver.getCurrentUrl());
  url.username = username;
  url.password = password;
  await driver.navigate().to(url.toString());
}

function pickKbvAnswer(answers: { [questionId: string]: number | string }, questionId: string, options: string[]) {
  const answer = answers[questionId];
  return options.find(option => {
      // Exact match
      if (option.replace(/^\s*|\s*$|£/gi, "") === answer.toString()) {
        return true;
      };
      // Range
      if (typeof answer === "number") {
        const match = /^(?:OVER £?([\d,]+) )?UP TO £?([\d,]+)$/.exec(option);
        if (match !== null) {
          const min = Number.parseFloat((match[1] || "0").replace(/,/gi, ""));
          const max = Number.parseFloat(match[2].replace(/,/gi, ""));
          if (answer <= max && answer >= min) {
            return true;
          }
        }
      }
      return false;
  });
}

