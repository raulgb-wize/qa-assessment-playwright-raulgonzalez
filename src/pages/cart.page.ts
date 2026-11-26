import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object Model for SauceDemo / Swag Labs Shopping Cart View.
 * Encapsulates cart item inspection, item removal, shopping continuation,
 * and progression into the checkout pipeline.
 */
export class CartPage extends BasePage {
  public static readonly CART_URL = 'https://www.saucedemo.com/cart.html';

  private readonly pageTitle: Locator;
  private readonly cartList: Locator;
  private readonly cartItems: Locator;
  private readonly itemNames: Locator;
  private readonly itemPrices: Locator;
  private readonly continueShoppingButton: Locator;
  private readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('[data-test="title"]');
    this.cartList = page.locator('[data-test="cart-list"]');
    this.cartItems = page.locator('[data-test="inventory-item"]');
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.itemPrices = page.locator('[data-test="inventory-item-price"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  /**
   * Asserts that the cart view is currently active.
   */
  async assertOnCartPage(): Promise<void> {
    await expect(this.page).toHaveURL(/.*cart\.html/);
    await expect(this.pageTitle).toHaveText('Your Cart');
    await expect(this.cartList).toBeVisible();
  }

  /**
   * Returns a specific cart item container by product name.
   */
  private getCartItem(productName: string): Locator {
    return this.cartItems.filter({
      has: this.page.locator('[data-test="inventory-item-name"]', { hasText: productName }),
    });
  }

  /**
   * Asserts the total number of items currently present in the cart.
   */
  async assertCartItemsCount(expectedCount: number): Promise<void> {
    await expect(this.cartItems).toHaveCount(expectedCount);
  }

  /**
   * Asserts that a specific product is present in the cart list.
   */
  async assertItemInCart(productName: string): Promise<void> {
    const item = this.getCartItem(productName);
    await expect(item).toBeVisible();
  }

  /**
   * Returns all item names currently in the cart.
   */
  async getItemNames(): Promise<string[]> {
    return await this.itemNames.allTextContents();
  }

  /**
   * Returns all item prices currently in the cart.
   */
  async getItemPrices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((t) => parseFloat(t.replace(/[^0-9.]/g, '')));
  }

  /**
   * Removes a specific item from the cart.
   */
  async removeItem(productName: string): Promise<void> {
    const item = this.getCartItem(productName);
    const removeBtn = item.getByRole('button', { name: /remove/i });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();
    await expect(item).toHaveCount(0);
  }

  /**
   * Navigates back to the inventory catalog via "Continue Shopping".
   */
  async continueShopping(): Promise<void> {
    await expect(this.continueShoppingButton).toBeVisible();
    await this.continueShoppingButton.click();
    await expect(this.page).toHaveURL(/.*inventory\.html/);
  }

  /**
   * Advances the checkout pipeline to Step One (Customer Information).
   */
  async proceedToCheckout(): Promise<void> {
    await expect(this.checkoutButton).toBeVisible();
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/.*checkout-step-one\.html/);
  }
}
