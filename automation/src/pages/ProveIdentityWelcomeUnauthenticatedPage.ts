import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { PhotoIdPage } from "./PhotoIdPage";

export class ProveIdentityWelcomeUnauthenticatedPage extends GovUkOneLoginPageBase {
  async continueToSignInOrCreateAccount(): Promise<PhotoIdPage> {
    await this.clickOn("button[type='Submit']");
    return new PhotoIdPage(this.driver);
  }
  async proveIdentityAnotherWay(): Promise<void> {
    await this.clickOn("input[name='chooseWayPyi'][value='redirect']");
    await this.clickOn("button[type='Submit']");
  }
}
