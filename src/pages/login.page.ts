import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object Model for SauceDemo / Swag Labs Authentication View.
 * Encapsulates credentials entry, role-based login execution, and validation error assertion.
 */
export class LoginPage extends BasePage {
  public static readonly LOGIN_URL = 'https://www.saucedemo.com';

  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;
  private readonly loginLogo: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.loginLogo = page.locator('.login_logo');
  }

  /**
   * Navigates to the Swag Labs login page and waits for DOM readiness.
   */
  async open(url: string = LoginPage.LOGIN_URL): Promise<void> {
    await this.page.goto(url);
    await this.waitForPageLoad();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Performs credential entry and submission.
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Quick-login helper using standard assessment credentials.
   */
  async loginWithStandardUser(): Promise<void> {
    await this.login('standard_user', 'secret_sauce');
  }

  /**
   * Asserts that the login page elements are currently visible.
   */
  async assertOnLoginPage(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Asserts that an authentication error banner contains the expected text.
   */
  async assertErrorMessage(expectedMessage: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedMessage);
  }
}
