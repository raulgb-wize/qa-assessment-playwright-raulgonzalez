import { test, expect } from '@fixtures';

/**
 * Challenge 1.1: Playwright Documentation Explorer
 *
 * Verifies end-to-end documentation discovery, dynamic search,
 * language snippet reactivity, and theme switching.
 */
test.describe('Playwright Documentation Explorer @smoke @foundational', () => {
  test('should complete full documentation explorer workflow from search to theme toggling', async ({
    homePage,
    docsPage,
  }) => {
    // 1. Navigate to homepage
    await homePage.open();

    // 2. Open search modal and search for "Locators"
    await homePage.openSearchModal();
    await homePage.searchFor('Locators');

    // 3. Verify dynamic search results and navigate to Locators documentation
    await homePage.assertSearchResultsVisible();
    await homePage.selectSearchResult('Locators');
    await docsPage.verifyHeading('Locators');

    // 4. Verify initial Node.js snippet, switch to Python, and verify snippet updates
    await docsPage.assertCodeSnippetContains("await page.getByLabel('User Name').fill('John');");
    await docsPage.switchLanguage('Python');
    await docsPage.assertCodeSnippetContains('page.get_by_label("User Name").fill("John")');
    await docsPage.assertCodeSnippetDoesNotContain("await page.getByLabel");

    // 5. Toggle Dark/Light mode theme and verify html root theme attribute
    const initialTheme = await docsPage.getCurrentTheme();
    await docsPage.toggleTheme();
    const updatedTheme = await docsPage.getCurrentTheme();
    expect(updatedTheme).not.toBe(initialTheme);
  });

  test('should search for "Locators" via search modal and navigate to documentation page', async ({
    homePage,
    docsPage,
  }) => {
    await homePage.open();
    await homePage.openSearchModal();
    await homePage.searchFor('Locators');
    await homePage.assertSearchResultsVisible();
    await homePage.selectSearchResult('Locators');
    await docsPage.verifyHeading('Locators');
  });

  test('should switch code snippet language from Node.js to Python and verify updated syntax', async ({
    docsPage,
  }) => {
    await docsPage.openLocators();
    await docsPage.switchLanguage('Node.js');
    await docsPage.assertCodeSnippetContains("await page.getByLabel('User Name').fill('John');");

    await docsPage.switchLanguage('Python');
    await docsPage.assertCodeSnippetContains('page.get_by_label("User Name").fill("John")');
  });

  test('should toggle theme and update root html data-theme attribute', async ({
    docsPage,
  }) => {
    await docsPage.openLocators();

    const initialTheme = await docsPage.getCurrentTheme();
    await docsPage.toggleTheme();

    const newTheme = await docsPage.getCurrentTheme();
    expect(newTheme).not.toBe(initialTheme);

    // Verify assertion on html element
    await docsPage.assertTheme(newTheme as 'dark' | 'light');
  });
});
