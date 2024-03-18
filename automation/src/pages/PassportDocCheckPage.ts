import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { PassportDetailsPage } from "./PassportDetailsPage";

// /ipv/page/page-ipv-identity-start
export class PassportDocCheckPage extends GovUkOneLoginPageBase {
  async continue(): Promise<PassportDetailsPage> {
    await this.clickOn("input[type='radio'][name='journey'][value='next']");
    await this.clickOn("button[name='submitButton']");
    return new PassportDetailsPage(this.driver);
  }
}
