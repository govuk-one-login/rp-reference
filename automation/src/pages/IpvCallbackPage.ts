import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { RpRedirectUriPage } from "./RpRedirectUriPage";

// /ipv-callback
export class IpvCallbackPage extends GovUkOneLoginPageBase {
  async waitForRedirectToRp(): Promise<RpRedirectUriPage> {
    await this.driver.wait(async (driver) => {
      var url = await driver.getCurrentUrl();
      return url.endsWith("/ipv-callback") === false;
    });
    return new RpRedirectUriPage();
  }
}
