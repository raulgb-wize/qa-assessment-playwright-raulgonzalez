import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object Model for Playwright Homepage (https://playwright.dev).
 * Encapsulates header navigation, hero elements, and global search modal actions.
 */
export class PlaywrightHomePage extends BasePage {
  private readonly searchButton: Locator;
  private readonly searchModal: Locator;
  private readonly searchInput: Locator;
  private readonly searchResults: Locator;
  private readonly docsNavLink: Locator;

  constructor(page: Page) {
    super(page);
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.searchModal = page.locator('.DocSearch-Modal');
    this.searchInput = page.getByPlaceholder('Search docs');
    this.searchResults = page.locator('.DocSearch-Hit');
    this.docsNavLink = page.getByRole('navigation').getByRole('link', { name: 'Docs' });
  }

  /**
   * Navigates to the homepage and verifies the search trigger is available.
   */
  async open(): Promise<void> {
    await this.navigate('https://playwright.dev/');
    await expect(this.searchButton).toBeVisible();
  }

  /**
   * Opens the Algolia search modal via the search button.
   */
  async openSearchModal(): Promise<void> {
    await this.searchButton.click();
    await expect(this.searchModal).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  /**
   * Enters a search query into the search input and waits for dynamic results.
   * @param query The search query term.
   */
  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await expect(this.searchResults.first()).toBeVisible();
  }

  /**
   * Selects a specific search result by exact text link and waits for navigation.
   * @param resultTitle The title or text of the search result link.
   */
  async selectSearchResult(resultTitle: string): Promise<void> {
    const resultItem = this.searchModal
      .getByRole('link', { name: resultTitle, exact: true })
      .first();
    await expect(resultItem).toBeVisible();
    await resultItem.click();
    await this.waitForPageLoad();
  }

  /**
   * High-level action to execute search and select a specific result.
   * @param query Search query term.
   * @param resultTitle Result title to click.
   */
  async performSearchAndNavigate(query: string, resultTitle: string): Promise<void> {
    await this.openSearchModal();
    await this.searchFor(query);
    await this.selectSearchResult(resultTitle);
  }

  /**
   * Verifies that the search modal is currently displayed.
   */
  async assertSearchModalVisible(): Promise<void> {
    await expect(this.searchModal).toBeVisible();
  }

  /**
   * Verifies that search results are visible dynamically.
   */
  async assertSearchResultsVisible(): Promise<void> {
    await expect(this.searchResults.first()).toBeVisible();
  }

  /**
   * Navigates to the Docs section via top navigation.
   */
  async navigateToDocs(): Promise<void> {
    await this.docsNavLink.click();
    await this.waitForPageLoad();
  }
}
