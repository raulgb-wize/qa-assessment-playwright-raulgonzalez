import { test, expect } from '@fixtures';
import {
  calculatePricing,
  STANDARD_INVENTORY,
} from '../../src/mcp/inventory-tool';

/**
 * Challenge 2.1: Dynamic E-Commerce Flow with Custom MCP Tool & API Mocking
 *
 * Automated regression test suite for Swag Labs (SauceDemo):
 * - End-to-end purchasing workflow with external MCP pricing engine validation
 * - Dynamic catalog sorting across name and price dimensions
 * - Network route interception with simulated latency (zero arbitrary timeouts)
 * - API route mocking for price surges and out-of-stock item handling
 * - Form validation and boundary error conditions
 */
test.describe('E-Commerce Dynamic Checkout Flow @regression @advanced', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.loginWithStandardUser();
  });

  test('should complete end-to-end checkout with dynamic tax and total calculations from MCP tool @regression @advanced', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.assertOnInventoryPage();

    const selectedProducts = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

    // 1. Query the custom MCP inventory tool for expected accounting values
    const expectedPricing = calculatePricing({
      productNames: selectedProducts,
      taxRate: 0.08,
    });

    expect(expectedPricing.itemCount).toBe(2);
    expect(expectedPricing.subtotal).toBe(39.98);
    expect(expectedPricing.tax).toBe(3.2);
    expect(expectedPricing.total).toBe(43.18);

    // 2. Add products to cart and verify badge counter synchronization
    await inventoryPage.addMultipleItemsToCart(selectedProducts);
    await inventoryPage.assertCartBadgeCount(2);

    // 3. Inspect items in Cart view
    await inventoryPage.goToCart();
    await cartPage.assertOnCartPage();
    await cartPage.assertCartItemsCount(2);
    await cartPage.assertItemInCart('Sauce Labs Backpack');
    await cartPage.assertItemInCart('Sauce Labs Bike Light');

    // 4. Progress through Checkout Step One (Shipping Information)
    await cartPage.proceedToCheckout();
    await checkoutPage.assertOnStepOne();
    await checkoutPage.fillShippingInformation('Jane', 'Tester', '94107');

    // 5. Verify Checkout Step Two (Overview) with dynamic assertions against MCP tool outputs
    await checkoutPage.assertOnOverviewPage();
    await checkoutPage.assertSubtotal(expectedPricing.formattedSubtotal);
    await checkoutPage.assertTax(expectedPricing.formattedTax);
    await checkoutPage.assertTotal(expectedPricing.formattedTotal);
    await checkoutPage.assertCalculationsMatch({
      subtotal: expectedPricing.subtotal,
      tax: expectedPricing.tax,
      total: expectedPricing.total,
    });

    // 6. Finalize order and confirm completion
    await checkoutPage.finishCheckout();
    await checkoutPage.assertOrderComplete();
  });

  test('should sort inventory catalog accurately across price and name dimensions @regression @advanced', async ({
    inventoryPage,
  }) => {
    await inventoryPage.assertOnInventoryPage();

    // Sort by Price (Low to High)
    await inventoryPage.sortBy('lohi');
    await inventoryPage.assertSortedByPrice('asc');

    // Sort by Price (High to Low)
    await inventoryPage.sortBy('hilo');
    await inventoryPage.assertSortedByPrice('desc');

    // Sort by Name (Z to A)
    await inventoryPage.sortBy('za');
    await inventoryPage.assertSortedByName('desc');

    // Sort by Name (A to Z)
    await inventoryPage.sortBy('az');
    await inventoryPage.assertSortedByName('asc');
  });

  test('should handle network latency gracefully using web-first auto-waiting fallbacks @regression @advanced', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.assertOnInventoryPage();

    // Simulate 500ms network round-trip latency on static assets/resources
    await inventoryPage.setupNetworkLatencyRoute(/.*\.(png|svg|jpg)/, 500);

    // Perform sorting and cart operations under latency
    await inventoryPage.sortBy('lohi');
    await inventoryPage.addItemToCart('Sauce Labs Onesie');
    await inventoryPage.assertCartBadgeCount(1);

    // Navigate to cart - verify web-first assertions await resolution without flakiness
    await inventoryPage.goToCart();
    await cartPage.assertOnCartPage();
    await cartPage.assertCartItemsCount(1);
    await cartPage.assertItemInCart('Sauce Labs Onesie');
  });

  test('should validate dynamic pricing recalculation with MCP tool under price surge simulation @regression @advanced', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.assertOnInventoryPage();

    const selectedProducts = ['Sauce Labs Fleece Jacket', 'Sauce Labs Onesie'];

    // Baseline calculation from default catalog
    const basePricing = calculatePricing({ productNames: selectedProducts });
    expect(basePricing.subtotal).toBe(57.98); // 49.99 + 7.99
    expect(basePricing.tax).toBe(4.64);
    expect(basePricing.total).toBe(62.62);

    // Simulate surge pricing scenario via MCP tool
    const surgeOverrides = {
      'Sauce Labs Fleece Jacket': 59.99,
      'Sauce Labs Onesie': 9.99,
    };
    const surgePricing = calculatePricing({
      productNames: selectedProducts,
      priceOverrides: surgeOverrides,
    });

    expect(surgePricing.isSurgePricingApplied).toBe(true);
    expect(surgePricing.subtotal).toBe(69.98); // 59.99 + 9.99
    expect(surgePricing.tax).toBe(5.6);
    expect(surgePricing.total).toBe(75.58);

    // Add baseline items to cart and assert nominal checkout calculations match basePricing
    await inventoryPage.addMultipleItemsToCart(selectedProducts);
    await inventoryPage.goToCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillShippingInformation('Alex', 'Surge', '10001');

    await checkoutPage.assertOnOverviewPage();
    await checkoutPage.assertCalculationsMatch({
      subtotal: basePricing.subtotal,
      tax: basePricing.tax,
      total: basePricing.total,
    });
  });

  test('should intercept mock inventory API to simulate out-of-stock items @regression @advanced', async ({
    inventoryPage,
  }) => {
    await inventoryPage.assertOnInventoryPage();

    // Mock API response indicating an out-of-stock product
    const mockedInventoryPayload = {
      timestamp: Date.now(),
      status: 'success',
      catalog: STANDARD_INVENTORY.map((item) => ({
        ...item,
        inStock: item.name !== 'Sauce Labs Backpack',
      })),
    };

    // Mount route interceptor on simulated inventory endpoint
    await inventoryPage.setupMockInventoryRoute(
      '**/api/inventory/**',
      mockedInventoryPayload,
      200,
    );

    // Evaluate candidate shopping cart using MCP Tool with out-of-stock exclusion
    const candidateBundle = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];
    const toolResult = calculatePricing({
      productNames: candidateBundle,
      outOfStockProducts: ['Sauce Labs Backpack'],
      excludeOutOfStock: true,
    });

    // The out-of-stock Backpack is excluded; only the Bike Light is calculated
    expect(toolResult.itemCount).toBe(1);
    expect(toolResult.selectedItems[0].name).toBe('Sauce Labs Bike Light');
    expect(toolResult.subtotal).toBe(9.99);
    expect(toolResult.tax).toBe(0.8);
    expect(toolResult.total).toBe(10.79);
    expect(toolResult.outOfStockItemsExcluded).toContain('Sauce Labs Backpack');
  });

  test('should display descriptive validation errors for missing shipping fields @regression @advanced', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.assertOnInventoryPage();
    await inventoryPage.addItemToCart('Sauce Labs Bolt T-Shirt');
    await inventoryPage.goToCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.assertOnStepOne();

    // 1. Submit completely empty form
    await checkoutPage.fillShippingInformation('', '', '');
    await checkoutPage.assertStepOneError('Error: First Name is required');

    // 2. Submit with First Name only
    await checkoutPage.fillShippingInformation('Alice', '', '');
    await checkoutPage.assertStepOneError('Error: Last Name is required');

    // 3. Submit with First Name and Last Name but missing Postal Code
    await checkoutPage.fillShippingInformation('Alice', 'Smith', '');
    await checkoutPage.assertStepOneError('Error: Postal Code is required');
  });

  test('should synchronize cart badge when items are added and removed @regression @advanced', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.assertOnInventoryPage();
    await inventoryPage.assertCartBadgeHidden();

    // Add first item
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.assertCartBadgeCount(1);

    // Add second item
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');
    await inventoryPage.assertCartBadgeCount(2);

    // Remove first item while still on inventory catalog
    await inventoryPage.removeItemFromCart('Sauce Labs Backpack');
    await inventoryPage.assertCartBadgeCount(1);

    // Navigate to cart and remove the second item
    await inventoryPage.goToCart();
    await cartPage.assertCartItemsCount(1);
    await cartPage.removeItem('Sauce Labs Bike Light');
    await cartPage.assertCartItemsCount(0);

    // Verify badge is hidden after cart is emptied
    await cartPage.continueShopping();
    await inventoryPage.assertOnInventoryPage();
    await inventoryPage.assertCartBadgeHidden();
  });
});
