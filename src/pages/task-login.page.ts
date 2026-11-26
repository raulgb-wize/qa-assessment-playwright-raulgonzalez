import { type Page, type Locator, expect } from '@playwright/test';
import { TASK_APP_CONFIG, TEST_CREDENTIALS } from '../data/constants';
import { BasePage } from './base.page';

/**
 * Page Object Model for Task Management Application Authentication View.
 * Encapsulates credentials submission, environment-driven login, and session assertion.
 */
export class TaskLoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly closeBannerButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.getByRole('button', { name: /login/i });
    this.closeBannerButtons = page.getByRole('button', { name: /banner schließen|close banner/i });
  }

  /**
   * Navigates to the task application login page and dismisses any overlay banners.
   */
  async open(): Promise<void> {
    await this.navigate(`${TASK_APP_CONFIG.baseUrl}/login`);
    await this.dismissBannersIfPresent();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Dismisses any visible alert or cookie/MOTD banners that may intercept clicks.
   */
  async dismissBannersIfPresent(): Promise<void> {
    const bannerCount = await this.closeBannerButtons.count();
    for (let i = 0; i < bannerCount; i++) {
      const banner = this.closeBannerButtons.nth(i);
      if (await banner.isVisible()) {
        await banner.click().catch(() => {});
      }
    }
  }

  /**
   * Executes login using provided credentials or falls back to environment variables.
   */
  async login(
    username: string = TEST_CREDENTIALS.user || 'demo',
    password: string = TEST_CREDENTIALS.password || 'demo',
  ): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL((url) => !url.pathname.includes('/login'));
  }

  /**
   * Asserts that authentication was successful and user is navigated past the login gate.
   */
  async assertLoggedIn(): Promise<void> {
    await expect(this.page).not.toHaveURL(/.*\/login$/);
  }
}
