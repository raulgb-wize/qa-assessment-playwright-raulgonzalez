import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export type SupportedLanguage = 'Node.js' | 'Python' | 'Java' | '.NET';

/**
 * Page Object Model for Playwright Documentation Pages (e.g. https://playwright.dev/docs/locators).
 * Encapsulates language tab/dropdown switching, code snippet verification, and theme toggling.
 */
export class DocsPage extends BasePage {
  private readonly pageHeading: Locator;
  private readonly languageDropdownButton: Locator;
  private readonly languageDropdownMenu: Locator;
  private readonly codeSnippets: Locator;
  private readonly firstCodeSnippet: Locator;
  private readonly themeToggleButton: Locator;
  private readonly htmlRoot: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { level: 1 });
    this.languageDropdownButton = page.locator('.navbar__item.dropdown > a[role="button"]');
    this.languageDropdownMenu = page.locator('.navbar__item.dropdown .dropdown__menu');
    this.codeSnippets = page.locator('pre code');
    this.firstCodeSnippet = this.codeSnippets.first();
    this.themeToggleButton = page.getByRole('button', {
      name: /switch between dark and light mode/i,
    });
    this.htmlRoot = page.locator('html');
  }

  /**
   * Directly navigates to the Locators documentation page.
   */
  async openLocators(): Promise<void> {
    await this.navigate('https://playwright.dev/docs/locators');
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Verifies the primary H1 heading text of the documentation page.
   * @param expectedText Expected heading text.
   */
  async verifyHeading(expectedText: string): Promise<void> {
    await expect(this.pageHeading).toHaveText(expectedText);
  }

  /**
   * Switches the programming language via the documentation language selector.
   * @param targetLanguage Desired language ('Node.js' | 'Python' | 'Java' | '.NET').
   */
  async switchLanguage(targetLanguage: SupportedLanguage): Promise<void> {
    const currentLang = (await this.languageDropdownButton.innerText()).trim();
    if (currentLang === targetLanguage) {
      return;
    }

    await this.languageDropdownButton.click();
    await expect(this.languageDropdownMenu).toBeVisible();

    const targetOption = this.languageDropdownMenu
      .locator('.dropdown__link')
      .filter({ hasText: targetLanguage });

    await expect(targetOption).toBeVisible();
    await targetOption.click();
    await this.waitForPageLoad();
    await expect(this.languageDropdownButton).toHaveText(targetLanguage);
  }

  /**
   * Verifies that the first code snippet on the page contains the expected syntax text.
   * @param expectedSnippetText Text expected to be present in the code snippet.
   */
  async assertCodeSnippetContains(expectedSnippetText: string): Promise<void> {
    await expect(this.firstCodeSnippet).toContainText(expectedSnippetText);
  }

  /**
   * Verifies that the first code snippet does NOT contain a specified syntax text.
   * @param unexpectedSnippetText Text that should not appear in the code snippet.
   */
  async assertCodeSnippetDoesNotContain(unexpectedSnippetText: string): Promise<void> {
    await expect(this.firstCodeSnippet).not.toContainText(unexpectedSnippetText);
  }

  /**
   * Reads the current theme value from the root html data-theme attribute.
   */
  async getCurrentTheme(): Promise<string> {
    return (await this.htmlRoot.getAttribute('data-theme')) || '';
  }

  /**
   * Toggles the UI theme between dark and light mode.
   * Handles Docusaurus's three-state cycle (system -> explicit light/dark -> alternate).
   */
  async toggleTheme(): Promise<void> {
    const initialTheme = await this.getCurrentTheme();
    await this.themeToggleButton.click();
    const currentTheme = await this.getCurrentTheme();

    // If theme attribute didn't flip (e.g. system mode defaulted to light and first click confirmed light),
    // click once more to transition to the opposite mode.
    if (currentTheme === initialTheme) {
      await this.themeToggleButton.click();
    }
  }

  /**
   * Verifies that the html root element has the expected data-theme attribute.
   * @param expectedTheme 'dark' or 'light'
   */
  async assertTheme(expectedTheme: 'dark' | 'light'): Promise<void> {
    await expect(this.htmlRoot).toHaveAttribute('data-theme', expectedTheme);
  }
}
