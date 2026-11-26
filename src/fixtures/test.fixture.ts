import { test as baseTest, expect, type Page } from '@playwright/test';
import * as fs from 'fs';

import { createHttpClient, type HttpClient } from '../api';
import {
  authStorageStatePath,
  restoreSessionStorage,
} from '../auth/sessionStorage';
import { isCognitoMode } from '../data/constants';
import { ExamplePage } from '../pages/ExamplePage';
import { PlaywrightHomePage } from '../pages/playwright-home.page';
import { DocsPage } from '../pages/docs.page';
import { TodoPage } from '../pages/todo.page';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { DataTablePage } from '../pages/datatable.page';
import { TaskLoginPage } from '../pages/task-login.page';
import { InboxPage } from '../pages/inbox.page';
import { TaskEditorPage } from '../pages/task-editor.page';

/**
 * Custom Fixtures Type Definition
 * Candidates should register their candidate-authored Page Object Models here.
 *
 * Example:
 * export type CustomFixtures = {
 *   loginPage: LoginPage;
 *   dashboardPage: DashboardPage;
 * };
 */
export type CustomFixtures = {
  /** Generic HTTP client for API specs. */
  httpApi: HttpClient;
  /** App page: Cognito session when enabled, else plain `{ page }`. */
  appPage: Page;
  authenticatedPage: Page;
  freshAuthPage: Page;
  /** Example POM for the default playwright.dev smoke target. */
  examplePage: ExamplePage;
  /** Page Object for Playwright documentation home page */
  homePage: PlaywrightHomePage;
  /** Page Object for Playwright documentation pages */
  docsPage: DocsPage;
  /** Page Object for TodoMVC demo application */
  todoPage: TodoPage;
  /** Page Object for SauceDemo / Swag Labs Authentication */
  loginPage: LoginPage;
  /** Page Object for SauceDemo / Swag Labs Inventory Catalog */
  inventoryPage: InventoryPage;
  /** Page Object for SauceDemo / Swag Labs Shopping Cart */
  cartPage: CartPage;
  /** Page Object for SauceDemo / Swag Labs Checkout Process */
  checkoutPage: CheckoutPage;
  /** Page Object for DataTables Server-Side Processing Grid */
  datatablePage: DataTablePage;
  /** Page Object for Task App Authentication View */
  taskLoginPage: TaskLoginPage;
  /** Page Object for Task App Inbox & Primary Grid */
  inboxPage: InboxPage;
  /** Page Object for Task App Details & Editor Modal */
  taskEditorPage: TaskEditorPage;
};

/**
 * Extended Playwright Test Instance
 * Use this extended test fixture across all spec files (*.spec.ts).
 * Never instantiate Page Objects directly using `new MyPage(page)` inside specs.
 */
export const test = baseTest.extend<CustomFixtures>({
  httpApi: async ({ request }, use) => {
    await use(createHttpClient(request));
  },

  appPage: async ({ page, browser, baseURL }, use) => {
    if (!isCognitoMode()) {
      await use(page);
      return;
    }

    const sessionPath = authStorageStatePath();
    if (!fs.existsSync(sessionPath)) {
      throw new Error(
        `Cognito mode requires ${sessionPath}. Ensure globalSetup ran successfully.`,
      );
    }

    const context = await browser.newContext({
      storageState: sessionPath,
      baseURL,
    });
    await restoreSessionStorage(context);
    const authPage = await context.newPage();
    await use(authPage);
    await context.close();
  },

  authenticatedPage: async ({ browser, baseURL }, use) => {
    if (!isCognitoMode()) {
      throw new Error(
        '{ authenticatedPage } requires Cognito mode. See docs/recipes/cognito-hosted-ui.md',
      );
    }

    const sessionPath = authStorageStatePath();
    if (!fs.existsSync(sessionPath)) {
      throw new Error(`Missing ${sessionPath}. Run globalSetup in Cognito mode.`);
    }

    const context = await browser.newContext({
      storageState: sessionPath,
      baseURL,
    });
    await restoreSessionStorage(context);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  freshAuthPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  examplePage: async ({ appPage }, use) => {
    await use(new ExamplePage(appPage));
  },

  homePage: async ({ appPage }, use) => {
    await use(new PlaywrightHomePage(appPage));
  },

  docsPage: async ({ appPage }, use) => {
    await use(new DocsPage(appPage));
  },

  todoPage: async ({ appPage }, use) => {
    await use(new TodoPage(appPage));
  },

  loginPage: async ({ appPage }, use) => {
    await use(new LoginPage(appPage));
  },

  inventoryPage: async ({ appPage }, use) => {
    await use(new InventoryPage(appPage));
  },

  cartPage: async ({ appPage }, use) => {
    await use(new CartPage(appPage));
  },

  checkoutPage: async ({ appPage }, use) => {
    await use(new CheckoutPage(appPage));
  },

  datatablePage: async ({ appPage }, use) => {
    await use(new DataTablePage(appPage));
  },

  taskLoginPage: async ({ appPage }, use) => {
    await use(new TaskLoginPage(appPage));
  },

  inboxPage: async ({ appPage }, use) => {
    await use(new InboxPage(appPage));
  },

  taskEditorPage: async ({ appPage }, use) => {
    await use(new TaskEditorPage(appPage));
  },
});

export { expect };
