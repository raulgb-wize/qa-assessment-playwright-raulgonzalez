import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Strongly typed interface representing a row in the DataTables server-side demo grid.
 */
export interface TableRowData {
  firstName: string;
  lastName: string;
  position: string;
  office: string;
  startDate: string;
  salary: string;
}

/**
 * Valid column header names supported by the DataTables server-side demo.
 */
export type ColumnHeaderName =
  | 'First name'
  | 'Last name'
  | 'Position'
  | 'Office'
  | 'Start date'
  | 'Salary';

/**
 * Sort direction enumeration.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Compound sort configuration for multi-column sorting.
 */
export interface ColumnSortOrder {
  column: ColumnHeaderName;
  direction: SortDirection;
}

/**
 * Server-side DataTables JSON response schema.
 */
export interface ServerProcessingResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: string[][];
}

/**
 * Parsed pagination and entry status state.
 */
export interface PaginationState {
  start: number;
  end: number;
  total: number;
  filteredTotal?: number;
  rawText: string;
}

/**
 * Column mapping configuration to resolve column indices and property names.
 */
export const COLUMN_INDICES: Record<ColumnHeaderName, number> = {
  'First name': 0,
  'Last name': 1,
  Position: 2,
  Office: 3,
  'Start date': 4,
  Salary: 5,
};

/**
 * Page Object Model for the Server-Side DataTables Demo.
 * Targets https://datatables.net/examples/data_sources/server_side
 *
 * Implements strict POM encapsulation with parameterized cell lookups,
 * dynamic row getters, atomic network response listeners, and web-first assertions.
 */
export class DataTablePage extends BasePage {
  public static readonly DEFAULT_URL =
    'https://datatables.net/examples/data_sources/server_side';

  // Private encapsulated locators
  private readonly tableContainer: Locator;
  private readonly table: Locator;
  private readonly headerRow: Locator;
  private readonly headers: Locator;
  private readonly bodyRows: Locator;
  private readonly emptyCell: Locator;
  private readonly searchInput: Locator;
  private readonly infoText: Locator;
  private readonly pagingContainer: Locator;
  private readonly pageButtons: Locator;
  private readonly firstPageButton: Locator;
  private readonly previousPageButton: Locator;
  private readonly nextPageButton: Locator;
  private readonly lastPageButton: Locator;
  private readonly lengthSelect: Locator;
  private readonly processingIndicator: Locator;

  constructor(page: Page) {
    super(page);

    this.tableContainer = page.locator('.dt-container, #example_wrapper');
    this.table = page.locator('#example');
    this.headerRow = page.locator('#example thead tr');
    this.headers = page.locator('#example thead th');
    this.bodyRows = page.locator('#example tbody tr');
    this.emptyCell = page.locator('#example tbody td.dt-empty, #example tbody td.dataTables_empty');
    this.searchInput = page.locator(
      '.dt-container input[type="search"], #example_filter input, #dt-search-0',
    );
    this.infoText = page.locator('.dt-info, #example_info');
    this.pagingContainer = page.locator('.dt-paging, .dataTables_paginate');
    this.pageButtons = page.locator(
      '.dt-paging button.dt-paging-button, .dataTables_paginate .paginate_button',
    );
    this.firstPageButton = page.locator(
      '.dt-paging button[aria-label="First"], .dt-paging button.first, .dataTables_paginate .first',
    );
    this.previousPageButton = page.locator(
      '.dt-paging button[aria-label="Previous"], .dt-paging button.previous, .dataTables_paginate .previous',
    );
    this.nextPageButton = page.locator(
      '.dt-paging button[aria-label="Next"], .dt-paging button.next, .dataTables_paginate .next',
    );
    this.lastPageButton = page.locator(
      '.dt-paging button[aria-label="Last"], .dt-paging button.last, .dataTables_paginate .last',
    );
    this.lengthSelect = page.locator('.dt-length select, #example_length select');
    this.processingIndicator = page.locator('.dt-processing, #example_processing');
  }

  /**
   * Navigates to the server-side DataTables view and waits for initial data load.
   */
  public async open(url: string = DataTablePage.DEFAULT_URL): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('server_processing.php') && res.status() === 200,
      { timeout: 15_000 },
    );

    await this.page.goto(url);
    await this.waitForPageLoad();
    await this.dismissBlockingDialogIfPresent();
    await responsePromise;
    await this.assertTableLoaded();
  }

  /**
   * Listens for an XHR server processing response triggered by the specified user action.
   * Eliminates the need for any arbitrary wait timeouts.
   */
  public async waitForServerResponse<T = ServerProcessingResponse>(
    action?: () => Promise<void>,
  ): Promise<T> {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('server_processing.php') && res.status() === 200,
      { timeout: 10_000 },
    );

    if (action) {
      await action();
    }

    const response = await responsePromise;
    return (await response.json()) as T;
  }

  // =========================================================================
  // Parameterized Cell Lookup & Dynamic Row Methods
  // =========================================================================

  /**
   * Resolves the zero-based column index for a given column header.
   */
  public getColumnIndex(columnName: ColumnHeaderName): number {
    return COLUMN_INDICES[columnName];
  }

  /**
   * Returns the Locator for a specific column header by name.
   */
  public getHeader(columnName: ColumnHeaderName): Locator {
    return this.headers.filter({ hasText: columnName }).first();
  }

  /**
   * Returns a Locator for a specific row by zero-based index.
   */
  public getRow(rowIndex: number): Locator {
    return this.bodyRows.nth(rowIndex);
  }

  /**
   * Returns a Locator for all currently visible rows.
   */
  public getAllRows(): Locator {
    return this.bodyRows;
  }

  /**
   * Returns the count of currently visible rows in the table body.
   */
  public async getRowCount(): Promise<number> {
    const count = await this.bodyRows.count();
    // If the only row is the empty message, visible data count is 0
    if (count === 1 && (await this.emptyCell.isVisible())) {
      return 0;
    }
    return count;
  }

  /**
   * Parameterized cell locator by zero-based row and column indices.
   */
  public getCell(rowIndex: number, columnIndex: number): Locator {
    return this.getRow(rowIndex).locator('td').nth(columnIndex);
  }

  /**
   * Parameterized cell locator by zero-based row index and column header name.
   */
  public getCellByColumnName(rowIndex: number, columnName: ColumnHeaderName): Locator {
    const colIndex = this.getColumnIndex(columnName);
    return this.getCell(rowIndex, colIndex);
  }

  /**
   * Retrieves trimmed text content of a specific cell.
   */
  public async getCellText(rowIndex: number, columnName: ColumnHeaderName): Promise<string> {
    const cell = this.getCellByColumnName(rowIndex, columnName);
    await expect(cell).toBeVisible();
    const text = await cell.textContent();
    return (text ?? '').trim();
  }

  /**
   * Extracts strongly-typed data from a specific row index.
   */
  public async getRowData(rowIndex: number): Promise<TableRowData> {
    const row = this.getRow(rowIndex);
    await expect(row).toBeVisible();

    const cells = await row.locator('td').allTextContents();
    return {
      firstName: cells[0]?.trim() ?? '',
      lastName: cells[1]?.trim() ?? '',
      position: cells[2]?.trim() ?? '',
      office: cells[3]?.trim() ?? '',
      startDate: cells[4]?.trim() ?? '',
      salary: cells[5]?.trim() ?? '',
    };
  }

  /**
   * Extracts strongly-typed data from all visible rows.
   */
  public async getAllRowsData(): Promise<TableRowData[]> {
    const rowCount = await this.getRowCount();
    const result: TableRowData[] = [];
    for (let i = 0; i < rowCount; i++) {
      result.push(await this.getRowData(i));
    }
    return result;
  }

  /**
   * Extracts all visible values for a given column as a string array.
   */
  public async getColumnValues(columnName: ColumnHeaderName): Promise<string[]> {
    const colIndex = this.getColumnIndex(columnName);
    const cells = this.bodyRows.locator(`td:nth-child(${colIndex + 1})`);
    return (await cells.allTextContents()).map((t) => t.trim());
  }

  /**
   * Parses formatted currency or number strings (e.g. "$433,060") into numeric values.
   */
  public parseSalaryToNumber(salaryStr: string): number {
    return parseInt(salaryStr.replace(/[^0-9]/g, ''), 10) || 0;
  }

  /**
   * Extracts numeric values for a given column across all visible rows.
   */
  public async getNumericColumnValues(columnName: ColumnHeaderName): Promise<number[]> {
    const values = await this.getColumnValues(columnName);
    return values.map((v) => this.parseSalaryToNumber(v));
  }

  /**
   * Finds the zero-based row index containing an exact cell value for a given column.
   * Returns -1 if no matching row is found.
   */
  public async findRowIndexByCellValue(
    columnName: ColumnHeaderName,
    expectedValue: string,
  ): Promise<number> {
    const values = await this.getColumnValues(columnName);
    return values.indexOf(expectedValue);
  }

  // =========================================================================
  // Sorting & Multi-Column Sorting
  // =========================================================================

  /**
   * Returns the current sort direction ('asc' | 'desc' | null) of a column.
   */
  public async getColumnSortDirection(
    columnName: ColumnHeaderName,
  ): Promise<SortDirection | null> {
    const header = this.getHeader(columnName);
    await expect(header).toBeVisible();

    const ariaSort = await header.getAttribute('aria-sort');
    if (ariaSort === 'ascending') return 'asc';
    if (ariaSort === 'descending') return 'desc';

    const className = (await header.getAttribute('class')) ?? '';
    if (className.includes('dt-ordering-asc') || className.includes('sorting_asc')) {
      return 'asc';
    }
    if (className.includes('dt-ordering-desc') || className.includes('sorting_desc')) {
      return 'desc';
    }
    return null;
  }

  /**
   * Clicks a column header to toggle sort, optionally with Shift key for multi-column sorting.
   */
  public async clickColumnHeader(
    columnName: ColumnHeaderName,
    withShift: boolean = false,
  ): Promise<ServerProcessingResponse> {
    const header = this.getHeader(columnName);
    await expect(header).toBeVisible();

    return await this.waitForServerResponse<ServerProcessingResponse>(async () => {
      if (withShift) {
        await header.click({ modifiers: ['Shift'] });
      } else {
        await header.click();
      }
    });
  }

  /**
   * Sorts a single column into the desired direction ('asc' or 'desc').
   */
  public async sortByColumn(
    columnName: ColumnHeaderName,
    targetDirection: SortDirection = 'asc',
  ): Promise<ServerProcessingResponse> {
    let currentDirection = await this.getColumnSortDirection(columnName);

    if (currentDirection === targetDirection) {
      return { draw: 0, recordsTotal: 0, recordsFiltered: 0, data: [] };
    }

    let response = await this.clickColumnHeader(columnName, false);
    currentDirection = await this.getColumnSortDirection(columnName);

    if (currentDirection !== targetDirection) {
      response = await this.clickColumnHeader(columnName, false);
    }

    await this.assertColumnSorted(columnName, targetDirection);
    return response;
  }

  /**
   * Automates multi-column compound sorting across multiple columns.
   * Primary column is clicked normally, subsequent secondary columns are Shift-clicked.
   *
   * Example:
   * await datatablePage.sortMultiColumn([
   *   { column: 'Office', direction: 'asc' },
   *   { column: 'Salary', direction: 'desc' }
   * ]);
   */
  public async sortMultiColumn(
    sortConfigs: ColumnSortOrder[],
  ): Promise<ServerProcessingResponse[]> {
    if (sortConfigs.length === 0) return [];

    const responses: ServerProcessingResponse[] = [];

    // 1. Primary sort
    const primary = sortConfigs[0];
    const primaryResp = await this.sortByColumn(primary.column, primary.direction);
    responses.push(primaryResp);

    // 2. Secondary sorts with Shift key
    for (let i = 1; i < sortConfigs.length; i++) {
      const secondary = sortConfigs[i];
      let currentDir = await this.getColumnSortDirection(secondary.column);

      // First shift-click introduces the secondary sort
      let resp = await this.clickColumnHeader(secondary.column, true);
      responses.push(resp);
      currentDir = await this.getColumnSortDirection(secondary.column);

      // If the target direction is not yet reached, shift-click again to toggle
      if (currentDir !== secondary.direction) {
        resp = await this.clickColumnHeader(secondary.column, true);
        responses.push(resp);
      }
    }

    return responses;
  }

  // =========================================================================
  // Pagination & Entry Indicator Methods
  // =========================================================================

  /**
   * Retrieves the raw info indicator string (e.g., "Showing 1 to 10 of 57 entries").
   */
  public async getInfoText(): Promise<string> {
    await expect(this.infoText).toBeVisible();
    const text = await this.infoText.textContent();
    return (text ?? '').trim();
  }

  /**
   * Parses the info text into structured pagination boundaries.
   */
  public async parsePaginationState(): Promise<PaginationState> {
    const rawText = await this.getInfoText();
    // Matches e.g. "Showing 1 to 10 of 57 entries" or with filtered note "(filtered from 57 total entries)"
    const match = rawText.match(
      /Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+entries(?:\s+\(filtered from\s+(\d+)\s+total entries\))?/i,
    );

    if (!match) {
      throw new Error(`Failed to parse pagination state from info text: "${rawText}"`);
    }

    return {
      start: parseInt(match[1], 10),
      end: parseInt(match[2], 10),
      total: parseInt(match[3], 10),
      filteredTotal: match[4] ? parseInt(match[4], 10) : undefined,
      rawText,
    };
  }

  /**
   * Navigates directly to a target page number.
   */
  public async goToPage(pageNumber: number): Promise<ServerProcessingResponse> {
    const pageBtn = this.pageButtons.filter({ hasText: new RegExp(`^${pageNumber}$`) }).first();
    await expect(pageBtn).toBeVisible();

    return await this.waitForServerResponse<ServerProcessingResponse>(async () => {
      await pageBtn.click();
    });
  }

  /**
   * Navigates to the first page.
   */
  public async goToFirstPage(): Promise<ServerProcessingResponse> {
    await expect(this.firstPageButton).toBeVisible();
    return await this.waitForServerResponse<ServerProcessingResponse>(async () => {
      await this.firstPageButton.click();
    });
  }

  /**
   * Navigates to the next page.
   */
  public async goToNextPage(): Promise<ServerProcessingResponse> {
    await expect(this.nextPageButton).toBeVisible();
    return await this.waitForServerResponse<ServerProcessingResponse>(async () => {
      await this.nextPageButton.click();
    });
  }

  /**
   * Navigates to the previous page.
   */
  public async goToPreviousPage(): Promise<ServerProcessingResponse> {
    await expect(this.previousPageButton).toBeVisible();
    return await this.waitForServerResponse<ServerProcessingResponse>(async () => {
      await this.previousPageButton.click();
    });
  }

  /**
   * Navigates to the last page.
   */
  public async goToLastPage(): Promise<ServerProcessingResponse> {
    await expect(this.lastPageButton).toBeVisible();
    return await this.waitForServerResponse<ServerProcessingResponse>(async () => {
      await this.lastPageButton.click();
    });
  }

  /**
   * Returns the currently active page number from pagination controls.
   */
  public async getCurrentPageNumber(): Promise<number> {
    const activeBtn = this.pageButtons.filter({
      has: this.page.locator('.current, [aria-current="page"]'),
    });

    if ((await activeBtn.count()) > 0) {
      const text = await activeBtn.first().textContent();
      return parseInt(text?.trim() ?? '1', 10);
    }

    const currentButton = this.pagingContainer.locator('.dt-paging-button.current, .paginate_button.current');
    const text = await currentButton.textContent();
    return parseInt(text?.trim() ?? '1', 10);
  }

  // =========================================================================
  // Global Search & Debounced Input Methods
  // =========================================================================

  /**
   * Inputs a search query into the global search input and waits for the debounced server response.
   */
  public async search(query: string): Promise<ServerProcessingResponse> {
    await expect(this.searchInput).toBeVisible();

    return await this.waitForServerResponse<ServerProcessingResponse>(async () => {
      await this.searchInput.fill(query);
    });
  }

  /**
   * Clears the search input and waits for the server response restoring all unfiltered data.
   */
  public async clearSearch(): Promise<ServerProcessingResponse> {
    await expect(this.searchInput).toBeVisible();

    return await this.waitForServerResponse<ServerProcessingResponse>(async () => {
      await this.searchInput.fill('');
    });
  }

  /**
   * Gets the current value from the search input.
   */
  public async getSearchInputValue(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  // =========================================================================
  // Web-First Assertions
  // =========================================================================

  /**
   * Asserts that the table container and first row are fully rendered.
   */
  public async assertTableLoaded(): Promise<void> {
    await expect(this.tableContainer).toBeVisible();
    await expect(this.table).toBeVisible();
    await expect(this.headers.first()).toBeVisible();
    await expect(this.bodyRows.first()).toBeVisible();
  }

  /**
   * Asserts the visible row count in the table body.
   */
  public async assertRowCount(expectedCount: number): Promise<void> {
    if (expectedCount === 0) {
      await expect(this.emptyCell).toBeVisible();
    } else {
      await expect(this.bodyRows).toHaveCount(expectedCount);
    }
  }

  /**
   * Asserts that the info text matches the given string or regular expression.
   */
  public async assertInfoText(expectedPattern: string | RegExp): Promise<void> {
    if (typeof expectedPattern === 'string') {
      await expect(this.infoText).toContainText(expectedPattern);
    } else {
      await expect(this.infoText).toHaveText(expectedPattern);
    }
  }

  /**
   * Asserts the structured pagination range in the info string.
   */
  public async assertPaginationRange(
    start: number,
    end: number,
    total: number,
    filteredTotal?: number,
  ): Promise<void> {
    const expectedRegex = filteredTotal !== undefined
      ? new RegExp(`Showing\\s+${start}\\s+to\\s+${end}\\s+of\\s+${total}\\s+entries\\s+\\(filtered from\\s+${filteredTotal}\\s+total entries\\)`, 'i')
      : new RegExp(`Showing\\s+${start}\\s+to\\s+${end}\\s+of\\s+${total}\\s+entries`, 'i');

    await expect(this.infoText).toHaveText(expectedRegex);
  }

  /**
   * Asserts that a column header has the expected sort direction.
   */
  public async assertColumnSorted(
    columnName: ColumnHeaderName,
    expectedDirection: SortDirection,
  ): Promise<void> {
    const header = this.getHeader(columnName);
    const expectedAria = expectedDirection === 'asc' ? 'ascending' : 'descending';
    const expectedClass = expectedDirection === 'asc' ? /dt-ordering-asc|sorting_asc/ : /dt-ordering-desc|sorting_desc/;

    await expect(header).toHaveAttribute('aria-sort', expectedAria);
    await expect(header).toHaveClass(expectedClass);
  }

  /**
   * Asserts that the specified page number is currently active in the pagination controls.
   */
  public async assertActivePage(expectedPage: number): Promise<void> {
    const activePageButton = this.pagingContainer.locator(
      `.dt-paging-button.current:has-text("${expectedPage}"), .paginate_button.current:has-text("${expectedPage}")`,
    );
    await expect(activePageButton).toBeVisible();
  }

  /**
   * Asserts that a specific cell matches the expected value.
   */
  public async assertCellText(
    rowIndex: number,
    columnName: ColumnHeaderName,
    expectedText: string,
  ): Promise<void> {
    const cell = this.getCellByColumnName(rowIndex, columnName);
    await expect(cell).toHaveText(expectedText);
  }

  /**
   * Asserts that all visible rows contain the expected text in the given column.
   */
  public async assertAllVisibleRowsMatch(
    columnName: ColumnHeaderName,
    expectedSubstring: string,
  ): Promise<void> {
    const rowCount = await this.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {
      const cell = this.getCellByColumnName(i, columnName);
      await expect(cell).toContainText(expectedSubstring);
    }
  }

  /**
   * Asserts the table's empty state message when no records match a search query.
   */
  public async assertEmptyState(): Promise<void> {
    await expect(this.emptyCell).toBeVisible();
    await expect(this.emptyCell).toContainText(/No matching records found|No data available/i);
  }
}
