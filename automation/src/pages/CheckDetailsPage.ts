import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { PreKbvTransitionPage } from "./PreKbvTransitionPage";

// /check
export class CheckDetailsPage extends GovUkOneLoginPageBase {
  async continue(): Promise<PreKbvTransitionPage>{
    await this.clickOn("button[name='continue']");
    return new PreKbvTransitionPage(this.driver);
  } 
}
