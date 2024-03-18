import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { SignInOrCreateAccountPage } from "./SignInOrCreateAccountPage";

export class PhotoIdPage extends GovUkOneLoginPageBase {
  async doYouHavePhotoIdYes(): Promise<SignInOrCreateAccountPage> {
    await this.clickOn(
      "input[type='radio'][name='havePhotoId'][value='true']"
    );
    await this.clickOn("button[type='Submit']");
    return new SignInOrCreateAccountPage(this.driver);
  }
  async doYouHavePhotoIdNo(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
