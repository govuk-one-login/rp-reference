import { SelectSmartphonePage } from "./SelectSmartphonePage";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";

// /dca/oauth2/selectDevice

export class SelectDevicePage extends GovUkOneLoginPageBase {
  async computerOrTablet(): Promise<SelectSmartphonePage> {
    await this.clickOn(
      "input[type='radio'][name='select-device-choice'][value='computerOrTablet']"
    );
    await this.clickOn("button[type='submit']");
    return new SelectSmartphonePage(this.driver);
  }
}
