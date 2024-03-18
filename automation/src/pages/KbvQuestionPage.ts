import { By, WebElement } from "selenium-webdriver";
import { findWebElement } from "../lib/web-elements";
import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { IpvSuccessPage } from "./IpvSuccessPage";

// /kbv/question
export class KbvQuestionPage extends GovUkOneLoginPageBase {

  protected async getFieldset(){
    return await this.driver.findElement(
      By.css("form[action='/kbv/question'] fieldset.govuk-fieldset")
    );
  }

  protected async getRadios(){
    const fieldset = await this.getFieldset();
    return await fieldset.findElements(By.css("input[type='radio']"));
  }

  async questionId(): Promise<string> {
    const fieldset = await this.getFieldset();
    const fieldsetId = await fieldset.getAttribute("id");
    const questionId = fieldsetId.replace(/\-.+$/, "");
    return questionId;
  }

  async getOptions(): Promise<Array<string>>{
    const radios = await this.getRadios();
    return await Promise.all(radios.map(radio => radio.getAttribute("value")));
  }

  async selectOption(optionValue: string){
    const radios = await this.getRadios();
    let answerRadio = await findWebElement(radios, async (radio: WebElement) => optionValue == await radio.getAttribute("value"));
    if (answerRadio instanceof WebElement) {
      await answerRadio.click();
      return;
    }
  }

  async continue() : Promise<this | IpvSuccessPage> {
    await this.clickOn("button[name='continue']");
    if((await this.getUrl()).endsWith("/kbv/question")){
      return this;
    }
    return new IpvSuccessPage(this.driver);
  }
}
