import { PassportDocCheckPage } from "./PassportDocCheckPage";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";

// /dca/oauth2/selectSmartphone
export class SelectSmartphonePage extends GovUkOneLoginPageBase {
  //iPhone(): Promise<>;
  //android(): Promise<>;
  async noSmartphone(): Promise<PassportDocCheckPage> {
    await this.clickOn(
      "input[type='radio'][name='smartphone-choice'][value='other']"
    );
    await this.clickOn("button[type='submit']");
    return new PassportDocCheckPage(this.driver);
  }
}
