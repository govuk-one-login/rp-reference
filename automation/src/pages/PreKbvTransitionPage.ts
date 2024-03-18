import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { KbvQuestionPage } from "./KbvQuestionPage";

// /ipv/page/page-pre-kbv-transition
export class PreKbvTransitionPage extends GovUkOneLoginPageBase {
  async continue(): Promise<KbvQuestionPage> {
    await this.clickOn("button[name='submitButton']");
    return new KbvQuestionPage(this.driver);
  }
}
