# Test Inventory & Seed Adoption: Real Task App (Vikunja / Todoist-Class)

- **Target Tier**: Tier 2 (Advanced) / Challenge 2.3
- **Author**: QA Automation Engineer & MCP Specialist
- **Application Under Test**: Vikunja Live Demo Task Manager (`https://try.vikunja.io`)
- **Execution Mode**: Local / Public Sandbox Authentication (`.env.dev` backed)
- **Document Status**: Approved Baseline & Coverage Contract

---

## 1. Executive Summary & Application Context

Vikunja is an enterprise-grade, open-source task management platform featuring a Todoist-class user journey:
- Project hierarchy (Inbox, Personal projects, Sub-tasks).
- Stateful task interactions (inline task creation, rich task editor modal, completion checkboxes, prioritization).
- Dynamic client-side routing coupled with REST API backend endpoints (`/api/v1/*`).

This document provides a prioritized, risk-based test inventory derived from live Model Context Protocol (MCP) browser inspection. It establishes the test boundaries, prioritizes critical user journeys for the initial `@smoke` gate, outlines the regression backlog, and explicitly excludes out-of-scope features for this assessment timebox.

---

## 2. Live MCP Inspection & Architectural Mapping

### 2.1 Primary Views Inspected
1. **Authentication Gate (`/login`)**:
   - Single-factor username/email and password credentials with dynamic notification banners.
   - Primary Elements: `#username` (`getByPlaceholder('e.g. frederick')`), `#password` (`getByPlaceholder('Your password')`), submit button (`getByRole('button', { name: /login/i })`).
2. **Inbox & Main Task Board (`/` & `/projects/1`)**:
   - Inline task quick-add textarea: `textarea.add-task-textarea` with dynamic localized placeholder (`Aufgabe hinzufügen…` / `Add a task...`).
   - Add task submit button: Button role with accessible label `Hinzufügen` / `Add` (`.add-task-button`).
   - Task list entries: Interactive list items containing completion checkboxes (`input[type="checkbox"]` with dynamic aria-labels like `'<Task Name>' als erledigt markieren` / `mark as done`) and title links.
3. **Task Detail Modal / Editor (`task-detail`)**:
   - Triggered upon clicking a task title or immediately following task creation.
   - Headings: Task title (`role: heading, level: 1`), Description section, Comments section.
   - Dismissible via standard `Escape` keyboard dispatch or close button.

### 2.2 Semantic Locator Strategy Matrix
| UI Component | Role / Accessible Name | Playwright Recommended Locator | Fallback / Resilience Strategy |
| :--- | :--- | :--- | :--- |
| **Username Input** | `textbox` (name/id: `username`) | `page.locator('#username')` | `page.getByPlaceholder(/username|frederick/i)` |
| **Password Input** | `textbox` (name/id: `password`) | `page.locator('#password')` | `page.getByPlaceholder(/password/i)` |
| **Login Submit** | `button`, Name: `LOGIN` | `page.getByRole('button', { name: /login/i })` | `page.locator('button[type="submit"]')` |
| **Add Task Textarea** | `textbox` / `textarea` | `page.locator('.add-task-textarea')` | `page.getByPlaceholder(/aufgabe hinzufügen|add a task/i)` |
| **Add Task Button** | `button`, Exact: `Hinzufügen` / `Add` | `page.getByRole('button', { name: /^(hinzufügen|add)$/i })` | `page.locator('.add-task-button')` |
| **Task Checkbox** | `checkbox`, Name: `<Task Title>` | `page.getByRole('checkbox', { name: new RegExp(taskTitle) })` | Parent row `input[type="checkbox"]` |
| **Task Title Link** | `text` / `button` | `page.getByText(taskTitle, { exact: true })` | `page.locator('.task-title').filter({ hasText: taskTitle })` |
| **Task Editor Heading** | `heading`, Name: `<Task Title>` | `page.getByRole('heading', { name: taskTitle, exact: true })` | `page.locator('.task-detail-heading')` |
| **Search / Quick Action** | `button`, Title: `Such-/Schnellaktionsleiste` | `page.getByTitle(/such|search|quick action/i)` | `page.getByRole('button', { name: /such|search/i })` |

---

## 3. Prioritized Test Inventory (12 Candidate Test Cases)

| ID | Test Case Title | Target Workflow | Tier / Tag | Scope Rationale / Automation Decision |
| :---: | :--- | :--- | :---: | :--- |
| **TC01** | Create new task in Inbox | Task Creation | `@smoke` `@advanced` | **Automated in Smoke**: Core application value proposition; verifies task submission and DOM render. |
| **TC02** | Mark task as completed | Task Completion | `@smoke` `@advanced` | **Automated in Smoke**: Critical status transition; toggles state and validates completion indicator. |
| **TC03** | Open task detail editor modal | Task Inspection | `@smoke` `@advanced` | **Automated in Smoke**: Validates navigation into task metadata drawer, title heading, and dismissibility. |
| **TC04** | Edit task title & description | Task Modification | `@regression` | Deferred to regression: Validates secondary field mutation, auto-save debounce, and updated content. |
| **TC05** | Global quick-action task search | Search & Filtering | `@regression` | Deferred to regression: Validates modal search popover, typing debounce, and matching result highlighting. |
| **TC06** | Assign due date via quick prefix | Metadata & Scheduling| `@regression` | Deferred to regression: Validates natural language date parser and badge indicator rendering. |
| **TC07** | Toggle task favorite priority | Favoriting / Flags | `@regression` | Deferred to regression: Validates star/favorite button toggle and persistence in favorites bucket. |
| **TC08** | Negative: Submit empty task | Form Validation | `@regression` | Deferred to regression: Asserts button disablement or validation toast when textarea contains 0 characters. |
| **TC09** | Empty state view on zero tasks | Empty States | `@regression` | Deferred to regression: Validates empty project illustration and "No tasks yet" copy rendering. |
| **TC10** | Third-party CalDAV calendar sync | Integrations | `out of scope` | **Out of Scope**: Requires external CalDAV server/client daemon setup outside local Playwright harness. |
| **TC11** | User Settings & TOTP / 2FA config | Auth / Security | `out of scope` | **Out of Scope**: Modifying security MFA on shared sandbox account disrupts concurrent candidate test runs. |
| **TC12** | Project sharing & team invites | Collaboration | `out of scope` | **Out of Scope**: Multi-tenant email invitation delivery and token verification exceed single-user timebox. |

---

## 4. Timebox Boundaries: What Will NOT Be Automated

To prevent flakiness and respect the assessment timebox, the following subsystems are explicitly declared **Out of Scope**:
1. **Third-Party Calendar / CalDAV Synchronization (TC10)**:
   - *Reason*: Requires network infrastructure beyond web UI automation (CalDAV sync daemon, external calendar server).
2. **Two-Factor Authentication / TOTP Configuration (TC11)**:
   - *Reason*: Modifying shared sandbox credentials (`demo/demo`) in a public environment would break concurrent or subsequent test runs.
3. **Team Management & Email Invitation Links (TC12)**:
   - *Reason*: External SMTP email dispatch and link retrieval introduce external dependencies and flakiness.
4. **Billing, Subscription Tiers & Payment Gateways**:
   - *Reason*: Vikunja community edition has no billing wall; enterprise upgrade flows are not part of the core product seed.
5. **Drag-and-Drop Kanban Board Reordering**:
   - *Reason*: Mouse coordinate drag gestures depend on screen resolution and canvas layout; deferred past initial smoke coverage.

---

## 5. Architectural Implementation Contract

### 5.1 Strict POM & Fixture Separation
- **Page Objects**:
  - `TaskLoginPage` (`src/pages/task-login.page.ts`): Handles authentication, credentials retrieval from environment, and banner dismissal.
  - `InboxPage` (`src/pages/inbox.page.ts`): Encapsulates task creation, task completion, and task element retrieval.
  - `TaskEditorPage` (`src/pages/task-editor.page.ts`): Encapsulates task detail modal verification and modal dismissal.
- **Dependency Injection**:
  - Registered exclusively in `src/fixtures/test.fixture.ts` under `taskLoginPage`, `inboxPage`, and `taskEditorPage`.
  - Specs import `test` and `expect` strictly from `@fixtures`.
  - **Zero `page.locator()` queries** in test specs.
  - **Zero `new PageObject(page)` instantiations** in test specs.
  - **Zero `page.waitForTimeout()` calls** across all files.
