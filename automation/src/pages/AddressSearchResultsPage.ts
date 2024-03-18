import { AddressCheckPage } from "./AddressCheckPage";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";

// /results
export class AddressSearchResultsPage extends GovUkOneLoginPageBase {
  async selectAddress(address: string): Promise<AddressCheckPage> {
    await this.selectOption("select[name='addressResults']", address);
    await this.clickOn("button[name='continue']");
    return new AddressCheckPage(this.driver);
  }
}
