# Feature Test Contract Specification: Dynamic E-Commerce Flow

## Feature Name: Dynamic E-Commerce Flow with Custom MCP Tool & API Mocking
- **Target Tier**: Tier 2 (Advanced)
- **Challenge ID**: Challenge 2.1
- **Author**: Lead QA & Agentic Automation Engineer
- **Date**: 2026-10-05
- **Target URL**: `https://www.saucedemo.com`

---

## 1. Feature Description & Scope

The Dynamic E-Commerce Checkout Flow encompasses the full retail user journey across the Swag Labs application (`https://www.saucedemo.com`):
1. **Authentication**: Secure login using role-based test credentials (`standard_user`), handling both positive authentication and negative validation states.
2. **Catalog Exploration & Sorting**: Dynamic multi-criteria sorting of inventory products by Price (Ascending/Descending) and Name (Alphabetical A-to-Z / Z-to-A).
3. **Cart Orchestration**: Adding, inspecting, and removing items, maintaining synchronized cart badge counter indicators.
4. **Checkout Processing**: Multi-step checkout pipeline comprising customer shipping data capture, tax calculation validation, order subtotal verification, and final order placement.
5. **Agentic MCP Integration**: A custom Model Context Protocol (MCP) tool (`inventory_pricing_calculator`) that serves as an external source-of-truth engine to compute dynamic subtotals, an 8% sales tax calculation, and grand totals for any arbitrary product bundle or price-surge condition.
6. **Network Interception & Latency Resilience**: Browser-level route mocking via Playwright `page.route()` to simulate real-world backend microservice events: price surge updates, out-of-stock catalog items, and degraded network conditions, validated entirely through web-first auto-waiting with zero arbitrary sleep intervals.

---

## 2. Preconditions & Test Data Requirements

### 2.1 Authentication State & Credentials
- **Standard User**: `standard_user` / `secret_sauce` (nominal access).
- **Negative Scenarios**: Missing credentials, invalid password, or missing required checkout customer profile fields.

### 2.2 Baseline Product Catalog
| Item ID | Product Name | Unit Price | Default Status |
|---------|--------------|------------|----------------|
| `sauce-labs-backpack` | Sauce Labs Backpack | $29.99 | In Stock |
| `sauce-labs-bike-light` | Sauce Labs Bike Light | $9.99 | In Stock |
| `sauce-labs-bolt-t-shirt` | Sauce Labs Bolt T-Shirt | $15.99 | In Stock |
| `sauce-labs-fleece-jacket` | Sauce Labs Fleece Jacket | $49.99 | In Stock |
| `sauce-labs-onesie` | Sauce Labs Onesie | $7.99 | In Stock |
| `test.allthethings()-t-shirt-(red)` | Test.allTheThings() T-Shirt (Red) | $15.99 | In Stock |

### 2.3 Tax Calculation Contract
- **Sales Tax Formula**: 
  $$\text{Tax} = \text{round}\left(\text{Subtotal} \times 0.08, 2\right)$$
- **Total Formula**: 
  $$\text{Grand Total} = \text{Subtotal} + \text{Tax}$$
- Values displayed in the UI adhere strictly to the format: `Item total: $XX.YY`, `Tax: $X.YY`, and `Total: $XX.YY`.
- **Known Edge Case Note (IEEE 754 Floating-Point Quirk)**: In SauceDemo client-side rendering, certain item combinations (e.g. $49.99 + $7.99) can output unrounded raw binary float strings such as `Item total: $57.980000000000004`. The Page Object assertion logic (`CheckoutPage.assertSubtotal`) handles this with precision regex pattern matching to ensure zero test flakiness while asserting numerical accuracy.

### 2.4 Mocked & Intercepted Endpoints (`page.route()`)
- `**/api/inventory/**` / `**/api/products/**`: Intercepted to simulate dynamic surge pricing updates and out-of-stock item indicators.
- `**/api/checkout/**`: Intercepted to simulate delayed server responses and payment processing latency.
- Asset & API route delay injection: Intercepted via `route.continue()` with artificial delays to validate zero-timeout waiting resilience.

---

## 3. Behavioral Scenarios & State Matrix

### Scenario 1: End-to-End Nominal Checkout with Dynamic MCP Calculation Assertion
- **Given**: The user is authenticated as `standard_user` on the inventory catalog.
- **When**: The user selects items (e.g., "Sauce Labs Backpack" and "Sauce Labs Bike Light") and proceeds through cart to checkout step two.
- **Then**: 
  - The cart badge updates in lockstep with additions.
  - The order overview subtotal, 8% tax, and total match the exact outputs returned by the custom MCP tool `inventory_pricing_calculator`.
  - Clicking "Finish" redirects to `/checkout-complete.html` displaying "Thank you for your order!".
- **Verification Criteria**:
  - Web-first assertion: `await expect(subtotalLabel).toHaveText("Item total: $39.98")`.
  - Web-first assertion: `await expect(taxLabel).toHaveText("Tax: $3.20")`.
  - Web-first assertion: `await expect(totalLabel).toHaveText("Total: $43.18")`.
  - Order completion confirmation header is visible.

### Scenario 2: Dynamic Inventory Sorting (Price & Alphabetical Order)
- **Given**: The user is on the inventory page with default sorting (Name A to Z).
- **When**: The user selects each sort dropdown option in succession:
  1. `lohi`: Price (low to high)
  2. `hilo`: Price (high to low)
  3. `za`: Name (Z to A)
  4. `az`: Name (A to Z)
- **Then**: 
  - For `lohi`, prices strictly satisfy $P_i \le P_{i+1}$ for all items.
  - For `hilo`, prices strictly satisfy $P_i \ge P_{i+1}$ for all items.
  - For `za` and `az`, names strictly satisfy lexical reverse and forward order respectively.
- **Verification Criteria**:
  - Extracted item lists are validated against dynamically sorted arrays.
  - No DOM detach or racing conditions occur during re-render.

### Scenario 3: API Interception — Price Surge Simulation & Dynamic Tool Sync
- **Given**: An API route interceptor is mounted on inventory price endpoints via `page.route()`.
- **When**: A price surge event is injected (e.g., Backpack increases from $29.99 to $39.99), and the user adds the product to cart.
- **Then**: 
  - The custom MCP tool calculates expected pricing with `priceOverrides`.
  - Checkout calculations dynamically reflect the overridden price and updated tax calculation.
- **Verification Criteria**:
  - Web-first assertion: Overview pricing validates against `calculatePricing({ productNames, priceOverrides })`.

### Scenario 4: API Interception — Out-of-Stock Simulation
- **Given**: An API route mock intercepts the catalog request, returning a specific item with `inStock: false`.
- **When**: The custom MCP tool evaluates the candidate cart bundle with `excludeOutOfStock: true`.
- **Then**: 
  - Unavailable items are excluded from total pricing calculations.
  - The calculated subtotal and tax reflect only active, in-stock selections.
- **Verification Criteria**:
  - MCP tool output excludes out-of-stock items from `selectedItems` and adjusts subtotal accordingly.

### Scenario 5: High Network Latency Simulation & Fallback Resilience
- **Given**: Network routes are throttled or delayed by up to 1500ms via `page.route()`.
- **When**: The user triggers navigation, cart additions, and checkout submissions.
- **Then**: 
  - Actions and assertions succeed without timing out.
  - ZERO arbitrary sleep delays (`page.waitForTimeout`) are used.
  - Auto-waiting web-first assertions guarantee test determinism.

### Scenario 6: Checkout Information Validation (Negative Boundaries)
- **Given**: The user has items in the cart and arrives at `/checkout-step-one.html`.
- **When**: The user attempts to continue with missing inputs:
  1. Empty First Name -> Error "Error: First Name is required"
  2. First Name provided, empty Last Name -> Error "Error: Last Name is required"
  3. First & Last Name provided, empty Postal Code -> Error "Error: Postal Code is required"
- **Then**: The error alert container displays the specific missing field message and blocks checkout progression.
- **Verification Criteria**:
  - Web-first assertion: `await expect(errorMessage).toContainText(expectedError)`.

---

## 4. MCP Inspection Plan & Locator Strategy

Following Rule 3 (Accessibility-First Priority Hierarchy) and strict encapsulation:

| Component | Semantic Role / Accessibility Name | Primary Locator Strategy | Fallback / Data Attribute Strategy |
|-----------|-------------------------------------|--------------------------|-------------------------------------|
| Username Input | `role: 'textbox', name: 'Username'` | `page.getByPlaceholder('Username')` | `page.locator('[data-test="username"]')` |
| Password Input | `role: 'textbox', name: 'Password'` | `page.getByPlaceholder('Password')` | `page.locator('[data-test="password"]')` |
| Login Button | `role: 'button', name: 'Login'` | `page.getByRole('button', { name: 'Login' })` | `page.locator('[data-test="login-button"]')` |
| Sort Container | `role: 'combobox'` | `page.locator('[data-test="product-sort-container"]')` | `page.getByRole('combobox')` |
| Inventory Item | `role: 'group'` | `page.locator('[data-test="inventory-item"]')` | `.inventory_item` |
| Item Name | Text link | `page.locator('[data-test="inventory-item-name"]')` | `item.getByRole('link')` |
| Item Price | Text label | `page.locator('[data-test="inventory-item-price"]')` | `.inventory_item_price` |
| Add to Cart Button | `role: 'button', name: /add to cart/i` | `item.getByRole('button', { name: /add to cart/i })` | `page.locator('[data-test^="add-to-cart"]')` |
| Remove Button | `role: 'button', name: /remove/i` | `item.getByRole('button', { name: /remove/i })` | `page.locator('[data-test^="remove"]')` |
| Shopping Cart Link | `role: 'link'` | `page.locator('[data-test="shopping-cart-link"]')` | `a.shopping_cart_link` |
| Cart Counter Badge | Status badge | `page.locator('[data-test="shopping-cart-badge"]')` | `span.shopping_cart_badge` |
| Cart Item Row | Row | `page.locator('[data-test="inventory-item"]')` | `.cart_item` |
| Checkout Button | `role: 'button', name: 'Checkout'` | `page.locator('[data-test="checkout"]')` | `page.getByRole('button', { name: 'Checkout' })` |
| First Name Input | `role: 'textbox', name: 'First Name'` | `page.getByPlaceholder('First Name')` | `page.locator('[data-test="firstName"]')` |
| Last Name Input | `role: 'textbox', name: 'Last Name'` | `page.getByPlaceholder('Last Name')` | `page.locator('[data-test="lastName"]')` |
| Postal Code Input | `role: 'textbox', name: 'Zip/Postal Code'` | `page.getByPlaceholder('Zip/Postal Code')` | `page.locator('[data-test="postalCode"]')` |
| Continue Button | `role: 'button', name: 'Continue'` | `page.locator('[data-test="continue"]')` | `page.getByRole('button', { name: 'Continue' })` |
| Subtotal Label | Summary text | `page.locator('[data-test="subtotal-label"]')` | `.summary_subtotal_label` |
| Tax Label | Summary text | `page.locator('[data-test="tax-label"]')` | `.summary_tax_label` |
| Total Label | Summary text | `page.locator('[data-test="total-label"]')` | `.summary_total_label` |
| Finish Button | `role: 'button', name: 'Finish'` | `page.locator('[data-test="finish"]')` | `page.getByRole('button', { name: 'Finish' })` |
| Complete Header | Heading level 2 | `page.locator('[data-test="complete-header"]')` | `page.getByRole('heading', { level: 2 })` |

---

## 5. Non-Functional Criteria & Quality Gates

1. **Zero Arbitrary Sleep**: `page.waitForTimeout()` is strictly prohibited across all Page Objects, helpers, and spec files (AGENTS.md Rule 5).
2. **Deterministic Auto-Waiting**: All state transitions rely on Playwright's actionability checks, network idle states, and web-first assertions (`await expect(locator)...`).
3. **Strict POM Encapsulation**: Zero `page.locator()` queries exist in spec files (AGENTS.md Rule 1). All spec interactions consume registered fixtures (AGENTS.md Rule 2).
4. **Type Safety**: 100% TypeScript compile-time safety without `any` casts or unresolved types (`npm run typecheck` passes with zero errors).
5. **Execution Health**: All regression tests execute green locally and in CI headless mode.
