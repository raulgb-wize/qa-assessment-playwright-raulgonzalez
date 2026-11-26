import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export type TodoFilter = 'All' | 'Active' | 'Completed';

/**
 * Page Object Model for TodoMVC application (https://demo.playwright.dev/todomvc).
 * Encapsulates todo creation, completion toggles, filtering, and cleanup.
 */
export class TodoPage extends BasePage {
  private static readonly TODO_MVC_URL = 'https://demo.playwright.dev/todomvc';

  private readonly newTodoInput: Locator;
  private readonly todoList: Locator;
  private readonly todoItems: Locator;
  private readonly allFilterLink: Locator;
  private readonly activeFilterLink: Locator;
  private readonly completedFilterLink: Locator;
  private readonly clearCompletedButton: Locator;
  private readonly todoCount: Locator;

  constructor(page: Page) {
    super(page);
    this.newTodoInput = page.getByPlaceholder('What needs to be done?');
    this.todoList = page.locator('.todo-list');
    this.todoItems = page.locator('.todo-list li');
    this.allFilterLink = page.getByRole('link', { name: 'All' });
    this.activeFilterLink = page.getByRole('link', { name: 'Active' });
    this.completedFilterLink = page.getByRole('link', { name: 'Completed' });
    this.clearCompletedButton = page.getByRole('button', { name: 'Clear completed' });
    this.todoCount = page.locator('.todo-count');
  }

  /**
   * Navigates to the TodoMVC demo page and waits for input readiness.
   */
  async open(): Promise<void> {
    await this.page.goto(TodoPage.TODO_MVC_URL);
    await this.waitForPageLoad();
    await expect(this.newTodoInput).toBeVisible();
  }

  /**
   * Adds a single todo item.
   * @param title Title of the todo item.
   */
  async addTodo(title: string): Promise<void> {
    await this.newTodoInput.fill(title);
    await this.newTodoInput.press('Enter');
  }

  /**
   * Adds multiple todo items in sequence.
   * @param titles Array of todo item titles.
   */
  async addTodos(titles: string[]): Promise<void> {
    for (const title of titles) {
      await this.addTodo(title);
    }
  }

  /**
   * Returns locator for a specific todo item by text.
   * @param title Title of the todo item.
   */
  private getTodoItem(title: string): Locator {
    return this.todoItems.filter({ hasText: title });
  }

  /**
   * Marks a specific todo as completed by clicking its checkbox.
   * @param title Title of the todo item to mark complete.
   */
  async markAsCompleted(title: string): Promise<void> {
    const item = this.getTodoItem(title);
    const checkbox = item.getByRole('checkbox', { name: /toggle todo/i });
    await checkbox.check();
    await expect(item).toHaveClass(/completed/);
  }

  /**
   * Marks a completed todo back to active.
   * @param title Title of the todo item to uncheck.
   */
  async markAsActive(title: string): Promise<void> {
    const item = this.getTodoItem(title);
    const checkbox = item.getByRole('checkbox', { name: /toggle todo/i });
    await checkbox.uncheck();
    await expect(item).not.toHaveClass(/completed/);
  }

  /**
   * Applies a filter ('All', 'Active', or 'Completed').
   * @param filter Filter category to apply.
   */
  async filterBy(filter: TodoFilter): Promise<void> {
    switch (filter) {
      case 'All':
        await this.allFilterLink.click();
        await expect(this.page).toHaveURL(/.*#\/$/);
        break;
      case 'Active':
        await this.activeFilterLink.click();
        await expect(this.page).toHaveURL(/.*#\/active$/);
        break;
      case 'Completed':
        await this.completedFilterLink.click();
        await expect(this.page).toHaveURL(/.*#\/completed$/);
        break;
    }
  }

  /**
   * Clicks the "Clear completed" button to remove finished tasks.
   */
  async clearCompleted(): Promise<void> {
    await expect(this.clearCompletedButton).toBeVisible();
    await this.clearCompletedButton.click();
  }

  /**
   * Asserts the number of currently visible todo items.
   * @param expectedCount Expected number of items.
   */
  async assertVisibleTodosCount(expectedCount: number): Promise<void> {
    await expect(this.todoItems).toHaveCount(expectedCount);
  }

  /**
   * Asserts the exact titles of currently visible todo items in order.
   * @param expectedTitles Array of expected titles.
   */
  async assertVisibleTodosText(expectedTitles: string[]): Promise<void> {
    await expect(this.todoItems).toHaveText(expectedTitles);
  }

  /**
   * Asserts that a todo item has the completed style/state.
   * @param title Title of the todo item.
   */
  async assertTodoCompleted(title: string): Promise<void> {
    await expect(this.getTodoItem(title)).toHaveClass(/completed/);
  }

  /**
   * Asserts the count displayed in the footer "X items left".
   * @param count Number of remaining active items.
   */
  async assertItemsLeft(count: number): Promise<void> {
    const expectedRegex = new RegExp(`^${count}\\s+items?\\s+left$`);
    await expect(this.todoCount).toHaveText(expectedRegex);
  }
}
