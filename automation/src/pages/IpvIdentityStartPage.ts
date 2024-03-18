import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { SelectDevicePage } from "./SelectDevicePage";

// /ipv/page/page-ipv-identity-start
export class IpvIdentityStartPage extends GovUkOneLoginPageBase {
  async continue(): Promise<SelectDevicePage> {
    await this.clickOn("button[name='submitButton']");
    return new SelectDevicePage(this.driver);
  }
}
