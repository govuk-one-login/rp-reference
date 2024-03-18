import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { CheckDetailsPage } from "./CheckDetailsPage";

// /summary/confirm
export class SummaryConfirmPage extends GovUkOneLoginPageBase {
  async confirm(): Promise<CheckDetailsPage> {
    await this.clickOn("button[data-id='next']");
    return new CheckDetailsPage(this.driver);
  }
}
