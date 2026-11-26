import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object Model for the Task Detail & Editor View.
 * Encapsulates editor view assertions, task title heading verification, and editor dismissal.
 */
export class TaskEditorPage extends BasePage {
  private readonly backToProjectButton: Locator;

  constructor(page: Page) {
    super(page);
    this.backToProjectButton = page.getByRole('button', {
      name: /zurück zum projekt|back to project/i,
    });
  }

  /**
   * Asserts that the task editor view is currently open with the expected task title heading.
   */
  async assertEditorOpen(taskTitle: string): Promise<void> {
    const heading = this.page.getByRole('heading').filter({ hasText: taskTitle });
    await expect(heading).toBeVisible();
  }

  /**
   * Closes the active task editor view using the back navigation button or Escape key.
   */
  async closeEditor(taskTitle?: string): Promise<void> {
    if (await this.backToProjectButton.isVisible()) {
      await this.backToProjectButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }

    if (taskTitle) {
      await this.assertEditorClosed(taskTitle);
    }
  }

  /**
   * Asserts that the task editor view is closed and not displayed.
   */
  async assertEditorClosed(taskTitle: string): Promise<void> {
    const heading = this.page.getByRole('heading').filter({ hasText: taskTitle });
    await expect(heading).not.toBeVisible();
  }
}
