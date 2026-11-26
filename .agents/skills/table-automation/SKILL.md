---
name: table-automation
description: Multi-agent orchestration pipeline (Inspector -> POM Generator -> Assertion Auditor) for automating server-side paginated data grids with complex sorting, debounced search, and boundary pagination.
---

# Table Automation Skill

This skill provides an autonomous multi-agent pipeline designed to inspect, model, and validate dynamic, server-side data grids (such as DataTables, AG Grid, or enterprise grids).

## Workflow Reference
Refer to the complete architectural definition and execution protocols in [workflow.md](file:///c:/Users/PC%20RACCON/Documents/GitHub/qa-assessment-playwright-mcp/.agents/skills/table-automation/workflow.md).

## Pipeline Structure
1. **Inspector Agent**:
   - Analyzes DOM accessibility tree and column layouts.
   - Sniffs server-side pagination/sorting XHR endpoints (`server_processing.php`).
   - Identifies debouncing windows, keyboard modifiers (Shift+Click for compound sort), and ARIA states.
2. **POM Generator**:
   - Generates typed Page Object Model (`DataTablePage`) extending `BasePage`.
   - Incorporates parameterized cell getters, dynamic row queries, and atomic `waitForServerResponse` wrappers.
   - Registers fixture injection in `src/fixtures/test.fixture.ts`.
3. **Assertion Auditor**:
   - Enforces web-first assertions, zero raw locators in test specs, and zero arbitrary delays.
   - Validates multi-column sorting integrity, pagination boundary conditions, and search debouncing.
