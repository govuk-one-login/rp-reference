import { IpvIdentityStartPage } from "./IpvIdentityStartPage";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";

export class ProveIdentityWelcomeAuthenticatedPage extends GovUkOneLoginPageBase {
  async continueToSignInOrCreateAccount(): Promise<IpvIdentityStartPage> {
    await this.clickOn("button[type='Submit']");
    return new IpvIdentityStartPage(this.driver);
  }
}
