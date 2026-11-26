import { test, expect } from '@fixtures';

/**
 * Challenge 2.2: Dynamic Data Grid with Multi-Agent Orchestration
 *
 * Automated regression test suite targeting DataTables server-side processing:
 * - Multi-column compound sorting (e.g. Office ascending, Salary descending via Shift-clicks)
 * - Pagination navigation across boundaries (Page 1 -> Page 5 -> Last Page -> Page 1)
 * - Accurate entry count indicator validation at every state transition
 * - Asynchronous global search handling debounced server responses with zero arbitrary timeouts
 * - Negative boundary tests for non-matching queries and empty table states
 */
test.describe('Dynamic Data Grid Server-Side Processing @regression @advanced', () => {
  test.beforeEach(async ({ datatablePage }) => {
    await datatablePage.open();
  });

  test('should execute multi-column compound sorting preserving secondary order (Office asc, Salary desc) @regression @advanced', async ({
    datatablePage,
  }) => {
    // 1. Assert initial default table load state
    await datatablePage.assertTableLoaded();
    await datatablePage.assertRowCount(10);
    await datatablePage.assertPaginationRange(1, 10, 57);

    // 2. Perform compound multi-column sort: Office (ASC) as primary, Salary (DESC) as secondary
    await datatablePage.sortMultiColumn([
      { column: 'Office', direction: 'asc' },
      { column: 'Salary', direction: 'desc' },
    ]);

    // 3. Verify primary sort indicator and column header attributes
    await datatablePage.assertColumnSorted('Office', 'asc');

    // 4. Extract visible table rows and verify sorting semantics
    const rows = await datatablePage.getAllRowsData();
    expect(rows.length).toBe(10);

    // Primary sort check: all first page records should belong to Edinburgh (first alphabetically)
    const firstRowOffice = rows[0].office;
    expect(firstRowOffice).toBe('Edinburgh');

    // Secondary sort check: verify that within Edinburgh, salaries are ordered descending
    const edinburghSalaries = rows
      .filter((row) => row.office === 'Edinburgh')
      .map((row) => datatablePage.parseSalaryToNumber(row.salary));

    expect(edinburghSalaries.length).toBeGreaterThan(1);
    for (let i = 0; i < edinburghSalaries.length - 1; i++) {
      expect(edinburghSalaries[i]).toBeGreaterThanOrEqual(edinburghSalaries[i + 1]);
    }
  });

  test('should sort single column ascending and descending with server-side response validation @regression @advanced', async ({
    datatablePage,
  }) => {
    await datatablePage.assertTableLoaded();

    // 1. Sort Salary descending ($1,200,000 CEO at top)
    const descResponse = await datatablePage.sortByColumn('Salary', 'desc');
    expect(descResponse.recordsTotal).toBe(57);
    await datatablePage.assertColumnSorted('Salary', 'desc');

    const descSalaries = await datatablePage.getNumericColumnValues('Salary');
    expect(descSalaries.length).toBe(10);
    // Verify monotonic descending order across all page 1 records
    for (let i = 0; i < descSalaries.length - 1; i++) {
      expect(descSalaries[i]).toBeGreaterThanOrEqual(descSalaries[i + 1]);
    }
    expect(descSalaries[0]).toBe(1200000);

    // 2. Sort Salary ascending (lowest salary at top)
    const ascResponse = await datatablePage.sortByColumn('Salary', 'asc');
    expect(ascResponse.recordsTotal).toBe(57);
    await datatablePage.assertColumnSorted('Salary', 'asc');

    const ascSalaries = await datatablePage.getNumericColumnValues('Salary');
    expect(ascSalaries.length).toBe(10);
    // Verify monotonic ascending order across all page 1 records
    for (let i = 0; i < ascSalaries.length - 1; i++) {
      expect(ascSalaries[i]).toBeLessThanOrEqual(ascSalaries[i + 1]);
    }
    expect(ascSalaries[0]).toBeGreaterThan(0);
  });

  test('should navigate pagination bounds across Page 1 -> Page 5 -> Last Page and validate entry indicator strings @regression @advanced', async ({
    datatablePage,
  }) => {
    await datatablePage.assertTableLoaded();

    // 1. Initial Bound: Page 1
    await datatablePage.assertActivePage(1);
    await datatablePage.assertPaginationRange(1, 10, 57);
    await datatablePage.assertRowCount(10);

    // 2. Intermediate Bound: Page 5
    const page5Response = await datatablePage.goToPage(5);
    expect(page5Response.recordsTotal).toBe(57);
    await datatablePage.assertActivePage(5);
    await datatablePage.assertPaginationRange(41, 50, 57);
    await datatablePage.assertRowCount(10);

    // 3. Terminal Bound: Last Page (Page 6 for 57 items with page size 10)
    const lastPageResponse = await datatablePage.goToLastPage();
    expect(lastPageResponse.recordsTotal).toBe(57);
    await datatablePage.assertActivePage(6);
    await datatablePage.assertPaginationRange(51, 57, 57);
    // Last page contains only remaining 7 items
    await datatablePage.assertRowCount(7);

    // 4. Return to Initial Bound: Page 1 via First Button
    const firstPageResponse = await datatablePage.goToFirstPage();
    expect(firstPageResponse.recordsTotal).toBe(57);
    await datatablePage.assertActivePage(1);
    await datatablePage.assertPaginationRange(1, 10, 57);
    await datatablePage.assertRowCount(10);
  });

  test('should perform global search handling debounced server responses and verify filtered tokens @regression @advanced', async ({
    datatablePage,
  }) => {
    await datatablePage.assertTableLoaded();

    // 1. Execute debounced search for "London"
    const searchResponse = await datatablePage.search('London');
    expect(searchResponse.recordsTotal).toBe(57);
    expect(searchResponse.recordsFiltered).toBe(12);

    // 2. Validate entry count indicator reflects filtered subset
    await datatablePage.assertPaginationRange(1, 10, 12, 57);
    await datatablePage.assertRowCount(10);

    // 3. Verify all visible rows match the searched criterion
    await datatablePage.assertAllVisibleRowsMatch('Office', 'London');

    // 4. Verify search input retains the active query
    const inputVal = await datatablePage.getSearchInputValue();
    expect(inputVal).toBe('London');

    // 5. Clear search query and confirm restoration of the complete dataset
    const clearResponse = await datatablePage.clearSearch();
    expect(clearResponse.recordsFiltered).toBe(57);
    await datatablePage.assertPaginationRange(1, 10, 57);
    await datatablePage.assertRowCount(10);
  });

  test('should handle non-matching search query and verify empty state boundaries @regression @advanced', async ({
    datatablePage,
  }) => {
    await datatablePage.assertTableLoaded();

    // 1. Search for a query guaranteed to have zero matches
    const zeroResultsResponse = await datatablePage.search('NonExistentRecord_XYZ99');
    expect(zeroResultsResponse.recordsFiltered).toBe(0);

    // 2. Validate empty table indicator and filtered info indicator
    await datatablePage.assertEmptyState();
    await datatablePage.assertPaginationRange(0, 0, 0, 57);
    await datatablePage.assertRowCount(0);

    // 3. Clear query to ensure table recovers to healthy state
    await datatablePage.clearSearch();
    await datatablePage.assertPaginationRange(1, 10, 57);
    await datatablePage.assertRowCount(10);
  });
});
