import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object Model for SauceDemo / Swag Labs Checkout Flow.
 * Encapsulates Step 1 (Customer Shipping Info), Step 2 (Order Overview & Tax Calculations),
 * and Step 3 (Order Confirmation & Dispatch).
 */
export class CheckoutPage extends BasePage {
  // Step 1: Customer Information
  private readonly pageTitle: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly postalCodeInput: Locator;
  private readonly continueButton: Locator;
  private readonly cancelButton: Locator;
  private readonly errorMessage: Locator;

  // Step 2: Overview & Pricing
  private readonly overviewItems: Locator;
  private readonly subtotalLabel: Locator;
  private readonly taxLabel: Locator;
  private readonly totalLabel: Locator;
  private readonly finishButton: Locator;

  // Step 3: Complete
  private readonly completeHeader: Locator;
  private readonly completeText: Locator;
  private readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('[data-test="title"]');
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');

    this.overviewItems = page.locator('[data-test="inventory-item"]');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.finishButton = page.locator('[data-test="finish"]');

    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.completeText = page.locator('[data-test="complete-text"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  // --- Step 1: Information ---

  /**
   * Asserts that Step One (Information form) is currently displayed.
   */
  async assertOnStepOne(): Promise<void> {
    await expect(this.page).toHaveURL(/.*checkout-step-one\.html/);
    await expect(this.pageTitle).toHaveText('Checkout: Your Information');
    await expect(this.firstNameInput).toBeVisible();
  }

  /**
   * Enters customer shipping information and submits the form.
   */
  async fillShippingInformation(
    firstName: string,
    lastName: string,
    postalCode: string,
  ): Promise<void> {
    if (firstName) await this.firstNameInput.fill(firstName);
    if (lastName) await this.lastNameInput.fill(lastName);
    if (postalCode) await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
  }

  /**
   * Asserts that a validation error banner on Step One displays the expected error message.
   */
  async assertStepOneError(expectedMessage: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedMessage);
  }

  // --- Step 2: Overview & Calculations ---

  /**
   * Asserts that Step Two (Order Overview) is currently displayed.
   */
  async assertOnOverviewPage(): Promise<void> {
    await expect(this.page).toHaveURL(/.*checkout-step-two\.html/);
    await expect(this.pageTitle).toHaveText('Checkout: Overview');
    await expect(this.subtotalLabel).toBeVisible();
  }

  /**
   * Returns the numeric subtotal extracted from UI ('Item total: $XX.YY').
   */
  async getSubtotal(): Promise<number> {
    await expect(this.subtotalLabel).toBeVisible();
    const text = await this.subtotalLabel.innerText();
    const match = text.match(/\$([0-9.]+)/);
    if (!match) throw new Error(`Could not parse subtotal from '${text}'`);
    return Math.round((parseFloat(match[1]) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Returns the numeric tax extracted from UI ('Tax: $X.YY').
   */
  async getTax(): Promise<number> {
    await expect(this.taxLabel).toBeVisible();
    const text = await this.taxLabel.innerText();
    const match = text.match(/\$([0-9.]+)/);
    if (!match) throw new Error(`Could not parse tax from '${text}'`);
    return Math.round((parseFloat(match[1]) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Returns the numeric grand total extracted from UI ('Total: $XX.YY').
   */
  async getTotal(): Promise<number> {
    await expect(this.totalLabel).toBeVisible();
    const text = await this.totalLabel.innerText();
    const match = text.match(/\$([0-9.]+)/);
    if (!match) throw new Error(`Could not parse total from '${text}'`);
    return Math.round((parseFloat(match[1]) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Asserts subtotal matches expected number or formatted string.
   * Handles known SauceDemo floating-point string representation (e.g., $57.980000000000004).
   */
  async assertSubtotal(expected: number | string): Promise<void> {
    const expectedStr = typeof expected === 'number' ? expected.toFixed(2) : expected;
    const match = expectedStr.match(/([0-9]+\.[0-9]{2})/);
    const amount = match ? match[1] : expectedStr;
    const regex = new RegExp(`^Item total: \\$${amount}`);
    await expect(this.subtotalLabel).toHaveText(regex);
  }

  /**
   * Asserts tax matches expected number or formatted string.
   */
  async assertTax(expected: number | string): Promise<void> {
    const expectedStr = typeof expected === 'number' ? expected.toFixed(2) : expected;
    const match = expectedStr.match(/([0-9]+\.[0-9]{2})/);
    const amount = match ? match[1] : expectedStr;
    const regex = new RegExp(`^Tax: \\$${amount}`);
    await expect(this.taxLabel).toHaveText(regex);
  }

  /**
   * Asserts total matches expected number or formatted string.
   */
  async assertTotal(expected: number | string): Promise<void> {
    const expectedStr = typeof expected === 'number' ? expected.toFixed(2) : expected;
    const match = expectedStr.match(/([0-9]+\.[0-9]{2})/);
    const amount = match ? match[1] : expectedStr;
    const regex = new RegExp(`^Total: \\$${amount}`);
    await expect(this.totalLabel).toHaveText(regex);
  }

  /**
   * Validates that subtotal, tax, and grand total match calculated values.
   */
  async assertCalculationsMatch(expected: {
    subtotal: number;
    tax: number;
    total: number;
  }): Promise<void> {
    await this.assertSubtotal(expected.subtotal);
    await this.assertTax(expected.tax);
    await this.assertTotal(expected.total);
  }

  /**
   * Clicks "Finish" button to finalize order.
   */
  async finishCheckout(): Promise<void> {
    await expect(this.finishButton).toBeVisible();
    await this.finishButton.click();
    await expect(this.page).toHaveURL(/.*checkout-complete\.html/);
  }

  // --- Step 3: Complete ---

  /**
   * Asserts that order complete confirmation is visible.
   */
  async assertOrderComplete(): Promise<void> {
    await expect(this.page).toHaveURL(/.*checkout-complete\.html/);
    await expect(this.completeHeader).toBeVisible();
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
    await expect(this.completeText).toBeVisible();
  }

  /**
   * Clicks back home button to return to catalog.
   */
  async backToHome(): Promise<void> {
    await expect(this.backHomeButton).toBeVisible();
    await this.backHomeButton.click();
    await expect(this.page).toHaveURL(/.*inventory\.html/);
  }
}
