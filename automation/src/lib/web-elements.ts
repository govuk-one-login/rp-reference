import { WebElement } from "selenium-webdriver";

export async function findWebElement(
  array: Array<WebElement>,
  predicate: (
    value: WebElement,
    index: number,
    obj: Array<WebElement>
  ) => Promise<unknown>,
  thisArg?: any
): Promise<WebElement | undefined> {
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    if (await predicate.call(thisArg, element, index, array)) {
      return element;
    }
  }
}

export async function everyWebElement(
  array: Array<WebElement>,
  predicate: (
    value: WebElement,
    index: number,
    obj: Array<WebElement>
  ) => Promise<unknown>,
  thisArg?: any
): Promise<boolean> {
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    if (await predicate.call(thisArg, element, index, array) === false) {
      return false;
    }
  }
  return true;
}
