import { EnterSecurityCodePage } from "./EnterSecurityCodePage";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";

export class EnterPasswordPage extends GovUkOneLoginPageBase {
  async enterPassword(password: string): Promise<EnterSecurityCodePage> {
    await this.inputText("input[name='password']", password);
    await this.clickOn("button[type='Submit']");
    return new EnterSecurityCodePage(this.driver);
  }
}
