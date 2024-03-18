import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { IpvCallbackPage } from "./IpvCallbackPage";

// /ipv/page/page-ipv-success
export class IpvSuccessPage extends GovUkOneLoginPageBase {
  async continue(): Promise<IpvCallbackPage> {
    await this.clickOn("button[name='submitButton']");
    return new IpvCallbackPage(this.driver);
  } 
}
