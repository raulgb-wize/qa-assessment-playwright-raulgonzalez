import { test, expect } from '@fixtures';

test.describe('Real Task App — Core Workflows @smoke @advanced', () => {
  test.beforeEach(async ({ taskLoginPage, inboxPage }) => {
    await taskLoginPage.open();
    await taskLoginPage.login();
    await taskLoginPage.assertLoggedIn();
    await inboxPage.openInbox();
  });

  test('should create a new task in the inbox @smoke @advanced', async ({
    inboxPage,
  }) => {
    const taskTitle = `QA Smoke Task ${Date.now()}`;

    await inboxPage.createTask(taskTitle);
    await inboxPage.assertTaskVisible(taskTitle);
    await inboxPage.dismissActiveModal();
  });

  test('should open task detail editor and verify metadata @smoke @advanced', async ({
    inboxPage,
    taskEditorPage,
  }) => {
    const taskTitle = `QA Detail Task ${Date.now()}`;

    await inboxPage.createTask(taskTitle);
    await inboxPage.selectTask(taskTitle);
    await taskEditorPage.assertEditorOpen(taskTitle);
    await taskEditorPage.closeEditor(taskTitle);
    await taskEditorPage.assertEditorClosed(taskTitle);
  });

  test('should mark a task as completed and verify status transition @smoke @advanced', async ({
    inboxPage,
  }) => {
    const taskTitle = `QA Complete Task ${Date.now()}`;

    await inboxPage.createTask(taskTitle);
    await inboxPage.dismissActiveModal();
    await inboxPage.completeTask(taskTitle);
    await inboxPage.assertTaskCompleted(taskTitle);
  });
});
