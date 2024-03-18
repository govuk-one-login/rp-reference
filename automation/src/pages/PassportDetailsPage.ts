import { GovUkOneLoginPageBase } from "./GovUkOneLoginPageBase";
import { AddressSearchPage } from "./AddressSearchPage";

export type PassportDetails = {
  passportNumber: string;
  surname: string;
  firstName: string;
  dateOfBirthDay: string;
  dateOfBirthMonth: string;
  dateOfBirthYear: string;
  passportExpiryDay: string;
  passportExpiryMonth: string;
  passportExpiryYear: string;
};

// /passport/details
export class PassportDetailsPage extends GovUkOneLoginPageBase {
  async enterPassportDetails({
    passportNumber, surname, firstName, dateOfBirthDay, dateOfBirthMonth, dateOfBirthYear, passportExpiryDay, passportExpiryMonth, passportExpiryYear,
  }: PassportDetails): Promise<AddressSearchPage> {
    await this.inputText("input[name='passportNumber']", passportNumber);
    await this.inputText("input[name='surname']", surname);
    await this.inputText("input[name='firstName']", firstName);

    await this.inputText("input[name='dateOfBirth-day']", dateOfBirthDay);
    await this.inputText("input[name='dateOfBirth-month']", dateOfBirthMonth);
    await this.inputText("input[name='dateOfBirth-year']", dateOfBirthYear);

    await this.inputText("input[name='expiryDate-day']", passportExpiryDay);
    await this.inputText("input[name='expiryDate-month']", passportExpiryMonth);
    await this.inputText("input[name='expiryDate-year']", passportExpiryYear);

    await this.clickOn("button[name='submitButton']");

    return new AddressSearchPage(this.driver);
  }
}
