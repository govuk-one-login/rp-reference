import { AddressSearchPage } from "./AddressSearchPage";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { SummaryConfirmPage } from "./SummaryConfirmPage";

export class AddressCheckPage extends GovUkOneLoginPageBase {
  async inputAddressYearFrom(yearFrom: string): Promise<this> {
    await this.inputText("input[name='addressYearFrom']", yearFrom);
    return this;
  }
  async change(): Promise<AddressSearchPage> {
    return new AddressSearchPage(this.driver);
  }
  async continue(): Promise<SummaryConfirmPage> {
    await this.clickOn("button[name='continue']");
    return new SummaryConfirmPage(this.driver);
  }
}
