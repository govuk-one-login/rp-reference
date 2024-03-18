import { AddressSearchResultsPage } from "./AddressSearchResultsPage";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";

// /search
export class AddressSearchPage extends GovUkOneLoginPageBase {
  async searchAddress(postcode: string): Promise<AddressSearchResultsPage> {
    await this.inputText("input[name='addressSearch']", postcode);
    await this.clickOn("button[name='continue']");
    return new AddressSearchResultsPage(this.driver);
  }
}
