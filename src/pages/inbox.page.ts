import { type Page, type Locator, expect } from '@playwright/test';
import { TASK_APP_CONFIG } from '../data/constants';
import { BasePage } from './base.page';

/**
 * Page Object Model for the Primary Task Inbox / Project View.
 * Encapsulates inline task creation, task completion toggling, and task list assertions.
 */
export class InboxPage extends BasePage {
  private readonly taskTextarea: Locator;
  private readonly addTaskButton: Locator;
  private readonly quickActionsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.taskTextarea = page
      .locator('.add-task-textarea')
      .or(page.getByPlaceholder(/aufgabe hinzufügen|add a task/i));
    this.addTaskButton = page
      .getByRole('button', { name: /^(hinzufügen|add)$/i })
      .or(page.locator('.add-task-button'));
    this.quickActionsButton = page.getByTitle(/such|search|quick action/i);
  }

  /**
   * Navigates to the main task inbox view and verifies the task input is ready.
   */
  async openInbox(): Promise<void> {
    await this.navigate(`${TASK_APP_CONFIG.baseUrl}/`);
    await this.waitForPageLoad();
    await expect(this.taskTextarea).toBeVisible();
  }

  /**
   * Creates a new task with the given title via the quick-add textarea and waits for it to render.
   */
  async createTask(taskTitle: string): Promise<void> {
    await expect(this.taskTextarea).toBeVisible();
    await this.taskTextarea.fill(taskTitle);
    await expect(this.addTaskButton).toBeVisible();
    await this.addTaskButton.click();
    await this.assertTaskVisible(taskTitle);
  }

  /**
   * Asserts that a task with the given title exists and is visible in the view.
   */
  async assertTaskVisible(taskTitle: string): Promise<void> {
    const taskElement = this.page.getByText(taskTitle).first();
    await expect(taskElement).toBeVisible();
  }

  /**
   * Toggles the completion checkbox for a specific task using the visual custom checkbox.
   */
  async completeTask(taskTitle: string): Promise<void> {
    const taskItem = this.page
      .locator('li')
      .filter({ hasText: taskTitle })
      .first();

    const checkboxVisual = taskItem
      .getByRole('img', { name: 'Checkbox' })
      .or(taskItem.locator('img, .checkbox'))
      .first();

    if (await checkboxVisual.isVisible()) {
      await checkboxVisual.click();
    } else {
      const labeledCheckbox = this.page
        .getByRole('checkbox', { name: new RegExp(taskTitle) })
        .first();
      await labeledCheckbox.setChecked(true, { force: true });
    }
  }

  /**
   * Asserts that a given task is marked as completed (checked or transitioned out of active list).
   */
  async assertTaskCompleted(taskTitle: string): Promise<void> {
    const checkbox = this.page
      .getByRole('checkbox', { name: new RegExp(taskTitle) })
      .first();

    try {
      await expect(checkbox).toBeChecked({ timeout: 4000 });
    } catch {
      // Completed tasks in filtered views transition to completed state or are cleared from active view
      const taskItem = this.page.locator('li').filter({ hasText: taskTitle });
      await expect(taskItem).toHaveCount(0);
    }
  }

  /**
   * Clicks on a task title to open its detail editor modal/panel.
   */
  async selectTask(taskTitle: string): Promise<void> {
    const taskTitleLink = this.page
      .getByRole('link', { name: taskTitle, exact: true })
      .or(this.page.getByText(taskTitle, { exact: true }))
      .first();

    await expect(taskTitleLink).toBeVisible();
    await taskTitleLink.click();
  }

  /**
   * Dismisses any active modal/drawer via keyboard Escape key.
   */
  async dismissActiveModal(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Asserts that the global search/quick-actions trigger is present.
   */
  async assertQuickActionsVisible(): Promise<void> {
    await expect(this.quickActionsButton).toBeVisible();
  }
}
