import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export type InventorySortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * Page Object Model for SauceDemo / Swag Labs Inventory Catalog.
 * Encapsulates catalog inspection, sorting, cart additions, badge counters,
 * and API route mocking orchestration.
 */
export class InventoryPage extends BasePage {
  public static readonly INVENTORY_URL = 'https://www.saucedemo.com/inventory.html';

  private readonly pageTitle: Locator;
  private readonly inventoryContainer: Locator;
  private readonly inventoryItems: Locator;
  private readonly itemNames: Locator;
  private readonly itemPrices: Locator;
  private readonly sortDropdown: Locator;
  private readonly cartLink: Locator;
  private readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('[data-test="title"]');
    this.inventoryContainer = page.locator('[data-test="inventory-container"]');
    this.inventoryItems = page.locator('[data-test="inventory-item"]');
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.itemPrices = page.locator('[data-test="inventory-item-price"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
  }

  /**
   * Asserts that the inventory view is successfully mounted.
   */
  async assertOnInventoryPage(): Promise<void> {
    await expect(this.page).toHaveURL(/.*inventory\.html/);
    await expect(this.pageTitle).toHaveText('Products');
    await expect(this.inventoryContainer).toBeVisible();
  }

  /**
   * Returns a specific inventory item container by name.
   */
  private getItemContainer(productName: string): Locator {
    return this.inventoryItems.filter({
      has: this.page.locator('[data-test="inventory-item-name"]', { hasText: productName }),
    });
  }

  /**
   * Returns all visible product item names in current DOM sequence.
   */
  async getItemNames(): Promise<string[]> {
    await expect(this.itemNames.first()).toBeVisible();
    return await this.itemNames.allTextContents();
  }

  /**
   * Returns all visible product item prices as numeric values.
   */
  async getItemPrices(): Promise<number[]> {
    await expect(this.itemPrices.first()).toBeVisible();
    const rawPrices = await this.itemPrices.allTextContents();
    return rawPrices.map((p) => parseFloat(p.replace(/[^0-9.]/g, '')));
  }

  /**
   * Selects an inventory sort mode from the dropdown.
   */
  async sortBy(option: InventorySortOption): Promise<void> {
    await expect(this.sortDropdown).toBeVisible();
    await this.sortDropdown.selectOption(option);
  }

  /**
   * Asserts that catalog items are sorted by name in ascending or descending order.
   */
  async assertSortedByName(direction: 'asc' | 'desc'): Promise<void> {
    const names = await this.getItemNames();
    const expected = [...names].sort((a, b) =>
      direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a),
    );
    expect(names).toEqual(expected);
  }

  /**
   * Asserts that catalog items are sorted by price in ascending or descending order.
   */
  async assertSortedByPrice(direction: 'asc' | 'desc'): Promise<void> {
    const prices = await this.getItemPrices();
    const expected = [...prices].sort((a, b) =>
      direction === 'asc' ? a - b : b - a,
    );
    expect(prices).toEqual(expected);
  }

  /**
   * Adds a single product to cart by product name.
   */
  async addItemToCart(productName: string): Promise<void> {
    const item = this.getItemContainer(productName);
    await expect(item).toBeVisible();
    const addButton = item.getByRole('button', { name: /add to cart/i });
    await expect(addButton).toBeVisible();
    await addButton.click();
    // Verify toggle to Remove
    const removeButton = item.getByRole('button', { name: /remove/i });
    await expect(removeButton).toBeVisible();
  }

  /**
   * Adds multiple products to cart in sequence.
   */
  async addMultipleItemsToCart(productNames: string[]): Promise<void> {
    for (const name of productNames) {
      await this.addItemToCart(name);
    }
  }

  /**
   * Removes a product from the cart while on the inventory page.
   */
  async removeItemFromCart(productName: string): Promise<void> {
    const item = this.getItemContainer(productName);
    const removeButton = item.getByRole('button', { name: /remove/i });
    await expect(removeButton).toBeVisible();
    await removeButton.click();
    const addButton = item.getByRole('button', { name: /add to cart/i });
    await expect(addButton).toBeVisible();
  }

  /**
   * Asserts that the shopping cart badge matches the expected count.
   */
  async assertCartBadgeCount(expectedCount: number): Promise<void> {
    if (expectedCount === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toBeVisible();
      await expect(this.cartBadge).toHaveText(String(expectedCount));
    }
  }

  /**
   * Asserts that the shopping cart badge is not displayed.
   */
  async assertCartBadgeHidden(): Promise<void> {
    await expect(this.cartBadge).toBeHidden();
  }

  /**
   * Asserts the displayed price for a given product.
   */
  async assertItemPrice(productName: string, expectedPriceText: string): Promise<void> {
    const item = this.getItemContainer(productName);
    const priceLocator = item.locator('[data-test="inventory-item-price"]');
    await expect(priceLocator).toHaveText(expectedPriceText);
  }

  /**
   * Navigates to the Cart page via header shopping cart link.
   */
  async goToCart(): Promise<void> {
    await expect(this.cartLink).toBeVisible();
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/.*cart\.html/);
  }

  /**
   * Intercepts network routes using page.route() to inject latency for network resilience testing.
   * Demonstrates zero-timeout auto-waiting.
   */
  async setupNetworkLatencyRoute(urlPattern: string | RegExp, delayMs: number): Promise<void> {
    await this.page.route(urlPattern, async (route) => {
      // Simulate slow network round-trip using promise timer without arbitrary page sleeps
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  /**
   * Intercepts API routes using page.route() to return mock inventory or pricing data.
   */
  async setupMockInventoryRoute(
    urlPattern: string | RegExp,
    mockResponse: unknown,
    status: number = 200,
  ): Promise<void> {
    await this.page.route(urlPattern, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });
  }
}
