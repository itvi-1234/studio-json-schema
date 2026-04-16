import { test, expect } from "@playwright/test";
import {
  VALID_SCHEMA,
  INVALID_SCHEMA,
  VALID_YAML_SCHEMA,
  SCHEMA_UNSUPPORTED_DIALECT,
  COMPLEX_SCHEMA,
  fillMonacoEditor,
  waitForGraph,
  waitForValidationStatus,
} from "./helpers";

test.describe("Schema Render and Interaction Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
  });

  test("should render graph nodes when a valid JSON Schema is pasted", async ({ page }) => {
    await fillMonacoEditor(page, VALID_SCHEMA);
    const nodes = page.locator(".react-flow__node");
    await expect(nodes.first()).toBeVisible({ timeout: 10_000 });
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test("clicking a node opens popup and highlights schema in editor", async ({ page }) => {
    await fillMonacoEditor(page, VALID_SCHEMA);
    const targetNode = page.locator(".react-flow__node", { hasText: "name" }).first();
    await expect(targetNode).toBeVisible({ timeout: 10_000 });
    await targetNode.click();

    const popup = page.locator("table", { hasText: "Keyword" });
    await expect(popup).toBeVisible({ timeout: 10_000 });

    const highlightLine = page.locator(".monaco-highlight-line");
    await expect(highlightLine.first()).toBeVisible({ timeout: 10_000 });
  });

  test("error block works properly for invalid schema", async ({ page }) => {
    await fillMonacoEditor(page, INVALID_SCHEMA);
    const errorBlock = page.locator(".text-red-400");
    await expect(errorBlock).toBeVisible({ timeout: 10_000 });
    await expect(errorBlock).toContainText("✗", { timeout: 10_000 });
  });

  test("navbar elements are properly center-aligned", async ({ page }) => {
    const navbar = page.locator("nav").first();
    await expect(navbar).toHaveClass(/items-center/);
    await expect(navbar).toHaveCSS("align-items", "center");
  });
});

test.describe("Validation Status Bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
  });

  test("shows success (✓) for a valid schema with $schema dialect", async ({ page }) => {
    await fillMonacoEditor(page, VALID_SCHEMA);
    await waitForValidationStatus(page, "✓");
    const bar = page.locator(".text-green-400");
    await expect(bar).toBeVisible({ timeout: 10_000 });
    await expect(bar).toContainText("✓ Valid JSON Schema");
  });

  test("shows error (✗) for unsupported dialect (draft-07)", async ({ page }) => {
    await fillMonacoEditor(page, SCHEMA_UNSUPPORTED_DIALECT);
    await waitForValidationStatus(page, "✗");
    const errorBar = page.locator(".text-red-400");
    await expect(errorBar).toBeVisible({ timeout: 10_000 });
    await expect(errorBar).toContainText("✗");
  });

  test("shows error (✗) for completely invalid JSON", async ({ page }) => {
    await fillMonacoEditor(page, INVALID_SCHEMA);
    await waitForValidationStatus(page, "✗");
    const errorBar = page.locator(".text-red-400");
    await expect(errorBar).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("YAML Format Support", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
  });

  test("switching editor to YAML mode changes the format select value", async ({ page }) => {
    const formatSelect = page.locator("select");
    await formatSelect.selectOption("yaml");
    await expect(formatSelect).toHaveValue("yaml");
  });

  test("pasting a valid YAML schema renders graph nodes", async ({ page }) => {
    const formatSelect = page.locator("select");
    await formatSelect.selectOption("yaml");
    await fillMonacoEditor(page, VALID_YAML_SCHEMA);
    const nodes = page.locator(".react-flow__node");
    await expect(nodes.first()).toBeVisible({ timeout: 15_000 });
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test("valid YAML schema shows success validation", async ({ page }) => {
    const formatSelect = page.locator("select");
    await formatSelect.selectOption("yaml");
    await fillMonacoEditor(page, VALID_YAML_SCHEMA);
    await waitForValidationStatus(page, "✓");
    await expect(page.locator(".text-green-400")).toBeVisible({ timeout: 10_000 });
  });

  test("switching back from YAML to JSON preserves graph", async ({ page }) => {
    const formatSelect = page.locator("select");
    await formatSelect.selectOption("yaml");
    await fillMonacoEditor(page, VALID_YAML_SCHEMA);
    await page.locator(".react-flow__node").first().waitFor({ timeout: 15_000 });

    await formatSelect.selectOption("json");
    const nodes = page.locator(".react-flow__node");
    await expect(nodes.first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Node Details Popup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
    await fillMonacoEditor(page, VALID_SCHEMA);
    await page.locator(".react-flow__node", { hasText: "name" }).first().waitFor({ timeout: 15_000 });
  });

  test("popup shows Keyword and Value column headers", async ({ page }) => {
    await page.locator(".react-flow__node", { hasText: "name" }).first().click();
    const popup = page.locator("table", { hasText: "Keyword" });
    await expect(popup).toBeVisible({ timeout: 10_000 });
    await expect(popup).toContainText("Keyword");
    await expect(popup).toContainText("Value");
  });

  test("copy path button changes icon to checkmark after click", async ({ page }) => {
    await page.locator(".react-flow__node", { hasText: "name" }).first().click();
    const copyBtn = page.locator("button[title='Copy path to clipboard']");
    await expect(copyBtn).toBeVisible({ timeout: 10_000 });
    await copyBtn.click();
    const checkIcon = page.locator("button[title='Copy path to clipboard'] svg.text-green-600");
    await expect(checkIcon).toBeVisible({ timeout: 5_000 });
  });

  test("closing popup via X button removes it from DOM", async ({ page }) => {
    await page.locator(".react-flow__node", { hasText: "name" }).first().click();
    const popup = page.locator("table", { hasText: "Keyword" });
    await expect(popup).toBeVisible({ timeout: 10_000 });

    const closeBtn = page.locator("button.absolute.z-50.top-2.right-2");
    await expect(closeBtn).toBeVisible({ timeout: 5_000 });
    await closeBtn.click();
    await expect(popup).not.toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Node Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
    await fillMonacoEditor(page, COMPLEX_SCHEMA);
    await page.locator(".react-flow__node").first().waitFor({ timeout: 15_000 });
  });

  test("search input is visible and accepts text", async ({ page }) => {
    const searchInput = page.locator("input[aria-label='Search nodes']");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("username");
    await expect(searchInput).toHaveValue("username");
  });

  test("searching a term not in schema shows error toast", async ({ page }) => {
    const searchInput = page.locator("input[aria-label='Search nodes']");
    await searchInput.fill("nonexistent");
    const toast = page.locator("div.bg-red-500");
    await expect(toast).toBeVisible({ timeout: 10_000 });
    await expect(toast).toContainText("is not in schema");
  });

  test("pressing Escape clears search input", async ({ page }) => {
    const searchInput = page.locator("input[aria-label='Search nodes']");
    await searchInput.fill("city");
    await searchInput.press("Escape");
    await expect(searchInput).toHaveValue("");
  });
});

test.describe("Editor Panel Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
  });

  test("editor toggle button has correct aria-label when editor is visible", async ({ page }) => {
    const toggleBtn = page.locator("button[aria-label='Hide Editor']");
    await expect(toggleBtn).toBeVisible({ timeout: 10_000 });
  });

  test("clicking editor toggle button hides editor panel", async ({ page }) => {
    const toggleBtn = page.locator("button[aria-label='Hide Editor']");
    await toggleBtn.click();
    const showBtn = page.locator("button[aria-label='Show Editor']");
    await expect(showBtn).toBeVisible({ timeout: 5_000 });
  });

  test("clicking editor toggle twice restores editor panel", async ({ page }) => {
    const hideBtn = page.locator("button[aria-label='Hide Editor']");
    await hideBtn.click();
    const showBtn = page.locator("button[aria-label='Show Editor']");
    await showBtn.click();
    const hideAgain = page.locator("button[aria-label='Hide Editor']");
    await expect(hideAgain).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Navigation Bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
  });

  test("logo image is visible in navbar", async ({ page }) => {
    const logo = page.locator("nav img[alt='Studio JSON Schema']");
    await expect(logo).toBeVisible();
  });

  test("GitHub link in navbar points to correct URL", async ({ page }) => {
    const githubLink = page.locator("a[data-tooltip-id='github']");
    await expect(githubLink).toHaveAttribute("href", "https://github.com/ioflux-org/studio-json-schema");
  });

  test("Docs link in navbar is present", async ({ page }) => {
    const docsLink = page.locator("a[data-tooltip-id='learn-keywords']");
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute("href", /readme/i);
  });

  test("fullscreen toggle button is present in navbar", async ({ page }) => {
    const fsBtn = page.locator("button[title='Enter Fullscreen']");
    await expect(fsBtn).toBeVisible();
  });
});

test.describe("Default Schema on First Load", () => {
  test("app loads default schema and renders graph without any interaction", async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
    const nodes = page.locator(".react-flow__node");
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test("default schema passes validation (shows ✓)", async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
    await waitForValidationStatus(page, "✓");
    await expect(page.locator(".text-green-400")).toBeVisible({ timeout: 10_000 });
  });

  test("React Flow controls are present", async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
    const controls = page.locator(".react-flow__controls");
    await expect(controls).toBeVisible();
  });
});
