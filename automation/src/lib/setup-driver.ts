import "chromedriver";
import { Builder, ThenableWebDriver } from "selenium-webdriver";
import { Options as ChromeOptions } from "selenium-webdriver/chrome";

export function setupDriver() {
  const options = new ChromeOptions()
    .excludeSwitches("enable-logging");

  const driver: ThenableWebDriver = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
    
  return driver;
}