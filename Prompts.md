
## Challenge 1.1

Act as an expert QA Automation Engineer. I need to automate "Challenge 1.1: Playwright Documentation Explorer" following the Page Object Model (POM) pattern with TypeScript and Playwright.

Please complete the steps and generate the requested deliverables:

1. OBJECTIVE AND SCENARIO:
- Target URL: https://playwright.dev
- Flow to automate:
  a. Navigate to the documentation homepage.
  b. Open the search modal and search for "Locators".
  c. Verify that search results populate dynamically and navigate to the "Locators" documentation page.
  d. Switch the code snippet language tab from Node.js to Python (or Java) and verify that the content updates accordingly.
  e. Toggle Dark/Light mode theme and verify that the theme attribute in the root html tag updates correctly.

2. REQUIRED DELIVERABLES:
Create or update exactly the following files respecting their file paths:
- `src/pages/playwright-home.page.ts`: Must contain locators and actions for the home page (such as opening the search).
- `src/pages/docs.page.ts`: Must contain locators and actions for the documentation page (snippet language switching, dark/light theme toggling, assertions).
- `src/fixtures/test.fixture.ts`: Custom fixtures configuration to instantiate and provide Page Objects (`homePage`, `docsPage`) to tests.
- `tests/smoke/playwright-docs.spec.ts`: Main test file. Tests must include the tags `@smoke` and `@foundational` in their description/configuration.

3. TECHNICAL REQUIREMENTS:
- Use Playwright best practices (locators using `getByRole`, `getByText`, `getByPlaceholder`, etc.).
- Ensure you include explicit web assertions (`expect(...)`).
- Methods should be clean and reusable.

Generate the full code structure for each of the listed files.

## Challenge 1.2

Act as an expert QA Automation Engineer. I need to automate "Challenge 1.2: TodoMVC Core Workflow" using Playwright with TypeScript following the Page Object Model (POM) pattern.

Please complete the steps and generate the requested deliverables:

1. OBJECTIVE AND SCENARIO:
- Target URL: https://demo.playwright.dev/todomvc
- Objective: Automate essential CRUD actions on a stateful client application.
- Flow to automate:
  a. Add 3 distinct todo items: "Buy groceries", "Review PR", and "Write Playwright test".
  b. Mark the second item ("Review PR") as completed.
  c. Filter by "Active" and assert that only 2 items appear.
  d. Filter by "Completed" and assert that 1 item appears.
  e. Clear completed items and verify the remaining item count.

2. REQUIRED DELIVERABLES:
Create or update exactly the following files respecting their file paths:
- `src/pages/todo.page.ts`: Must contain locators and methods to add items, mark as completed, apply filters ("Active", "Completed", "All"), and clear completed items.
- `src/fixtures/test.fixture.ts`: Update the fixture to include the new Page Object (`todoPage`).
- `tests/smoke/todo-crud.spec.ts`: Main test file. Tests must include the `@smoke` and `@foundational` tags.

3. TECHNICAL REQUIREMENTS AND BEST PRACTICES:
- Use Playwright recommended locators (such as `getByPlaceholder`, `getByRole`, `getByTestId`, or text selectors).
- Include explicit assertions (`expect(...)`) to validate visibility and quantity of visible items under each filter state.
- Keep the code modular and reusable.

Run the tests locally and confirm that they pass in green.


## Challenge 2.1

# TASK OVERVIEW
You are an expert QA Automation and Agentic AI Engineer specialized in Playwright, TypeScript, Model Context Protocol (MCP), and API interception techniques[cite: 1]. 

Your objective is to complete **Challenge 2.1: Dynamic E-Commerce Flow with Custom MCP Tool & API Mocking** for `https://www.saucedemo.com` (or a mock eCommerce portal)[cite: 1].

Follow the scenario requirements strictly and generate clean, modular, production-grade code for all required deliverables[cite: 1].

---

# OBJECTIVE & SCENARIO STEPS
1. **Spec Contract**: Create `docs/specs/checkout-contract.md` covering login, inventory sorting, cart calculation, and checkout validation requirements[cite: 1].
2. **Custom MCP Tool**: Define the MCP tool schema and implementation (`src/mcp/inventory-tool.json` and `src/mcp/inventory-tool.ts`) that accepts product filters and calculates expected pricing[cite: 1].
3. **API Interception**: Use Playwright's `page.route()` to mock/intercept inventory API responses, simulating out-of-stock items, price surge updates, and network latency[cite: 1].
4. **End-to-End Automation**: Automate the full checkout flow with dynamic assertions for tax and total calculations[cite: 1].
5. **Robust Waiting & Fallbacks**: Implement error-handling fallbacks for slow network conditions using explicit assertions and web-first waiting (NO arbitrary `page.waitForTimeout` or sleep delays)[cite: 1].

---

# REQUIRED DELIVERABLES
Generate code and text for each of the following files:

1. `docs/specs/checkout-contract.md`[cite: 1]
2. `src/mcp/inventory-tool.json` & `src/mcp/inventory-tool.ts`[cite: 1]
3. `src/pages/inventory.page.ts`, `src/pages/cart.page.ts`, and `src/pages/checkout.page.ts` (Page Object Model design)[cite: 1]
4. `tests/regression/checkout-flow.spec.ts` (tagged with `@regression` and `@advanced`)[cite: 1]

---

# EXECUTION GUIDELINES
- Implement Page Object Model (POM) architecture for all UI components[cite: 1].
- Ensure strict TypeScript typing throughout[cite: 1].
- Use Playwright best practices for route mocking (`page.route`) and dynamic assertions[cite: 1].
- Structure the output file-by-file with clear code blocks indicating the exact file paths[cite: 1].


## Challenge 2.2


# TASK OVERVIEW
You are an expert Test Automation Architect and Multi-Agent Orchestration Specialist utilizing Playwright, TypeScript, and modern Agentic AI workflows[cite: 5].

Your objective is to complete **Challenge 2.2: Dynamic Data Grid with Multi-Agent Orchestration** targeting `https://datatables.net/examples/data_sources/server_side` (or a modern server-side paginated data grid demo)[cite: 5].

Follow the scenario requirements strictly and build a production-grade, highly reliable test suite and agent workflow configuration[cite: 5].

---

# OBJECTIVE & SCENARIO STEPS
1. **Multi-Agent Orchestration Pattern**: Implement an agent pipeline pattern consisting of:
   - `Inspector Agent`: Inspects the DOM and XHR/Fetch network responses for server-side pagination and sorting[cite: 5].
   - `POM Generator`: Constructs clean, modular Page Object Models with robust locator strategies[cite: 5].
   - `Assertion Auditor`: Reviews and enforces strict assertions, debouncing checks, and boundary validations[cite: 5].
2. **Multi-Column Sorting**: Automate sorting across multiple columns (e.g., Office ascending, Age descending)[cite: 5].
3. **Pagination & Entry Count Validation**: Verify pagination navigation across bounds (Page 1 -> Page 5 -> Last Page) and validate entry count indicator strings (e.g., "Showing 1 to 10 of 57 entries")[cite: 5].
4. **Global Search & Debounce Assertions**: Automate global search handling debounced server responses, verifying highlighted search tokens and proper data updates[cite: 5].

---

# REQUIRED DELIVERABLES
Generate code and configurations for each of the following components:

1. **Agent Workflow Configuration**:
   - `.agents/skills/table-automation/workflow.md` (or relevant schema/skill definition detailing Inspector -> POM Generator -> Assertion Auditor pipeline)[cite: 5].
2. **Page Object Model**:
   - `src/pages/datatable.page.ts` featuring parameterized cell lookup methods, dynamic row getters, and robust waiting strategies[cite: 5].
3. **End-to-End Test Suite**:
   - `tests/regression/datatable-sorting.spec.ts` (tagged with `@regression` and `@advanced`)[cite: 5].

---

# EXECUTION GUIDELINES
- Implement strict TypeScript interfaces for row data and grid options[cite: 5].
- Avoid hardcoded timeouts or arbitrary sleep delays; rely entirely on Playwright web-first assertions and response listening (`waitForResponse` / `expect` auto-retries)[cite: 5].
- Ensure cell lookup methods in the POM are parameterized and dynamic[cite: 5].
- Structure the response clearly, outputting file-by-file with exact relative file paths[cite: 1, 5].


## Challenge 2.3

Act as a Senior QA Automation Engineer and MCP Specialist. Follow the guidelines in the scenario below to complete Challenge 2.3: Real Task App — Test Inventory & Seed Adoption.

### OBJECTIVE
Use Playwright MCP to inspect the live application, generate a prioritized test inventory in `docs/specs/task-app-coverage.md`, and implement a small green `@smoke` suite following strictly specified architectural constraints.

---

### STEP-BY-STEP INSTRUCTIONS

1. **Environment Setup & Inspection**:
   - Copy `.env.example` to `.env.dev` and ensure `BASE_URL` (and `E2E_USER` / `E2E_PASSWORD` if applicable) are configured. (Do NOT commit secrets).
   - Use Playwright MCP tools to navigate to the live UI (`BASE_URL`) and inspect the accessibility tree, unique roles, and labels. Identify 1–2 primary views (e.g., inbox/today, task editor).

2. **Author Test Inventory (`docs/specs/task-app-coverage.md`)**:
   - List **8–12 candidate test cases** covering: create, complete, edit, filter/search, and one negative or empty state.
   - Tag each test case as `@smoke`, `@regression`, or `out of scope` (with a clear one-line reason for out-of-scope items like auth wall, billing, third-party widgets, etc.).
   - Explicitly call out what will **NOT** be automated in this timebox.

3. **Implement Smoke Slice (2–3 tests, max 4)**:
   - Implement **only** the `@smoke` tests.
   - **Page Object Model (POM)**: Create POMs in `src/pages/` extending `BasePage` (`src/pages/base.page.ts`). (e.g., `inbox.page.ts`, `task-editor.page.ts`).
   - **Fixtures**: Register every POM in `src/fixtures/test.fixture.ts`. Specs must NEVER instantiate page objects manually with `new PageObject(page)`.
   - **Spec File**: Place specs in `tests/smoke/task-app-spec.ts`. Import `test` and `expect` directly from `@fixtures`.
   - **Locators & Tags**: Tag test blocks with `@smoke` and `@advanced`. Ensure specs contain **zero locators** and **zero `new PageObject` declarations** (all interaction must go through fixture-provided POM methods).
   - If login is required, keep credentials in `.env.dev` and use `{ appPage }` or a dedicated login POM. Skip billing, sharing, and integrations.

4. **PR Note & Deliverables**:
   - Verify that all deliverables exist:
     1. `docs/specs/task-app-coverage.md`
     2. `src/pages/*` (e.g., `inbox.page.ts`)
     3. `src/fixtures/test.fixture.ts`
     4. `tests/smoke/task-app.spec.ts`
   - Generate a draft for a PR note documenting: MCP tools used, prompts used, and any AI output rejected.

---

### STRICT ACCEPTANCE CRITERIA
- Inventory shows coverage thinking, not an unprioritized dump of cases.
- `npm run typecheck && npm run test:smoke` passes with 0 errors/failures.
- Zero raw locators in specs.
- Zero `new PageObject()` in specs.
- Zero secrets committed.

Please begin by inspecting the live app with Playwright MCP and drafting `docs/specs/task-app-coverage.md`.


## Challenge 3.1

Act as a Principal Test Automation Architect and Security Engineer. Execute Challenge 3.1: Enterprise CI/CD Pipeline with AI Failure Triage & DOM Security Sanitizer according to the specifications below.

### OBJECTIVE
Build a complete enterprise-grade Playwright automation architecture with GitHub Actions CI/CD integration, automated AI trace failure triage, a DOM/network data sanitizer, and an Architecture Decision Record (ADR).

---

### STEP-BY-STEP IMPLEMENTATION PLAN

1. **Security & Data Sanitizer (`src/utils/security-sanitizer.ts`)**:
   - Create a sanitizer module that scrubs sensitive data from DOM snapshots, HTML/JSON artifacts, and network logs before passing context to AI models.
   - Mask: Credit Card numbers, PII, Email addresses, Bearer tokens, and Auth headers.
   - Author unit tests in `tests/unit/sanitizer.spec.ts` ensuring all pattern types are accurately redacted without breaking valid JSON/HTML structure.

2. **Automated AI Test Failure Triage Engine (`scripts/ai-triage.ts`)**:
   - Write a Node/TypeScript script that triggers on CI failures.
   - Parse Playwright failure metadata, stack traces, and DOM snapshots (routed through `security-sanitizer.ts`).
   - Query an LLM to analyze the failure context and categorize it under exactly one tag:
     - `[BUG]`
     - `[FLAKE]`
     - `[LOCATOR_MISMATCH]`
     - `[ENV_ERROR]`
   - Format the findings into a clean Markdown summary and append it to GitHub Job Summary (`$GITHUB_STEP_SUMMARY`).

3. **CI/CD Integration (`.github/workflows/test-automation.yml`)**:
   - Update the GitHub Actions workflow to include:
     - Type checking and smoke tests.
     - Multi-browser matrix execution if required.
     - Rich artifact uploading (HTML report, Playwright traces, videos).
     - Execution step for `scripts/ai-triage.ts` on test failure (`if: failure()`).

4. **Architecture Decision Record (`docs/adr/ADR-001-agentic-test-architecture.md`)**:
   - Document the system design including:
     - System Topology (CI/CD + AI Triage flow)
     - Token Cost Projection
     - Reliability SLOs (Service Level Objectives)
     - Security Compliance (Sanitization & PII prevention)

---

### KEY DELIVERABLES
- `.github/workflows/test-automation.yml` (Updated)
- `scripts/ai-triage.ts`
- `src/utils/security-sanitizer.ts`
- `tests/unit/sanitizer.spec.ts`
- `docs/adr/ADR-001-agentic-test-architecture.md`

---

### ACCEPTANCE CRITERIA
- Unit tests in `tests/unit/sanitizer.spec.ts` pass 100%.
- Test suite is fully green and stable with zero flakiness.
- All logs and traces processed by AI are strictly sanitized.

Please start by writing `src/utils/security-sanitizer.ts` along with its unit tests in `tests/unit/sanitizer.spec.ts`.