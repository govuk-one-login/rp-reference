import { IpvIdentityStartPage } from "./IpvIdentityStartPage";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";


export class EnterSecurityCodePage extends GovUkOneLoginPageBase {
  async enterSecurityCode(code: string): Promise<IpvIdentityStartPage> {
    await this.inputText("input[name='code']", code);
    await this.clickOn("button[type='Submit']");
    return new IpvIdentityStartPage(this.driver);
  }
}
