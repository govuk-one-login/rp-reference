import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ThenableWebDriver } from "selenium-webdriver";

export function screenshots(driver:ThenableWebDriver, directory: string){
  let index = 0;
  const outputDir = path.join(directory, Date.now().toString());
  return async () => {
    index+=1;
    const png = await driver.takeScreenshot();
    const buffer = Buffer.from(png, "base64");
    const title = await driver.getTitle();
    const fileName = `${index}-${title}.png`.replace(/[^\w\.]+/ig, "-");
    await mkdir(outputDir, {recursive:true});
    await writeFile(path.join(outputDir, fileName), buffer);
  }
}