import { By, ThenableWebDriver, WebElement } from "selenium-webdriver"
import { everyWebElement, findWebElement } from "../lib/web-elements";

export abstract class PageBase {
  protected constructor(
    protected driver: ThenableWebDriver
  ) {
  }

  protected async isVisible(selector: string) {
    const elements = await this.driver.findElements(By.css(selector));
    return await everyWebElement(elements, async (element) => element.isDisplayed());
  }

  protected async setSize(width: number, height: number): Promise<void> {
    await this.driver.manage().window().setRect({x: 0, y: 0, width: width, height: height});
  }

  protected async navigateTo(url: string): Promise<void>{
    await this.driver.navigate().to(url);
  }

  protected findRadioButton(name: string, value: string){
    return this.driver.findElement(By.css(`input[type='radio'][name='${name}'][value='${value}']`));
  }

  protected findInput(name: string){
    return this.driver.findElement(By.css(`input[name='${name}']`));
  }

  protected async basicAuthentication(username: string, password: string) {
    const url = new URL(await this.driver.getCurrentUrl());
    url.username = username;
    url.password = password;
    await this.driver.navigate().to(url.toString());
    return this;
  }

  protected async getUrl(): Promise<string> {
    return await this.driver.getCurrentUrl();
  }

  protected async clickOn(selector: string) {
    const element = await this.driver.findElement(By.css(selector));
    await element.click();
  }

  protected async inputText(selector: string, value: string) {
    const element = await this.driver.findElement(By.css(selector));
    await element.click();
    await element.sendKeys(value);
  }

  protected async selectOption(selector: string, value: string) {
    const selectElement = await this.driver.findElement(By.css(selector));
    const options = await selectElement.findElements(By.css("option"));
    const option = await findWebElement(options, async (option) => {
      const optionValue = await option.getAttribute("value");
      return optionValue === value;
    });

    if (option instanceof WebElement) {
      await option.click();
    }
  }
}