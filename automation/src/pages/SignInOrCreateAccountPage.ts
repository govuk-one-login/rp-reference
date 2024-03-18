import { EnterEmailAddressPage } from "./EnterEmailAddressPage";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";

export class SignInOrCreateAccountPage extends GovUkOneLoginPageBase {
  async signIn(): Promise<EnterEmailAddressPage> {
    await this.clickOn("a#sign-in-link");
    return new EnterEmailAddressPage(this.driver);
  }
  async createAccount(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
