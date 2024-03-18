import { By, ThenableWebDriver, WebElement } from "selenium-webdriver";
import { PageBase } from "./PageBase";

export abstract class GovUkOneLoginPageBase extends PageBase {
  constructor(driver: ThenableWebDriver) {
    super(driver);
  }

  public async rejectCookies() {
    const cookiesRejectButtonSelector = "button[name='cookiesReject']";
    if (await this.isVisible(cookiesRejectButtonSelector)) {
      await this.clickOn(cookiesRejectButtonSelector);
      await this.clickOn("#cookies-rejected a.cookie-hide-button");
    }
  }
}
