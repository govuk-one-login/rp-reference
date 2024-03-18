import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { EnterPasswordPage } from "./EnterPasswordPage";

export class EnterEmailAddressPage extends GovUkOneLoginPageBase {
  async enterEmailAddress(username: string): Promise<EnterPasswordPage> {
    await this.inputText("input[name='email']", username);
    await this.clickOn("button[type='Submit']");
    return new EnterPasswordPage(this.driver);
  }
}
