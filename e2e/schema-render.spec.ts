import { test, expect } from "@playwright/test";
import {
  VALID_SCHEMA,
  INVALID_SCHEMA,
  fillMonacoEditor,
  waitForGraph,
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
    
    const targetNode = page.locator(".react-flow__node", { hasText: 'name' }).first();
    await expect(targetNode).toBeVisible({ timeout: 10000 });
    await targetNode.click();

    const popup = page.locator("table", { hasText: "Keyword" });
    await expect(popup).toBeVisible({ timeout: 10000 });

    const highlightLine = page.locator(".monaco-highlight-line");
    await expect(highlightLine.first()).toBeVisible({ timeout: 10000 });
  });

  test("error block works properly for invalid schema", async ({ page }) => {
    await fillMonacoEditor(page, INVALID_SCHEMA);
    
    const errorBlock = page.locator(".text-red-400");
    await expect(errorBlock).toBeVisible({ timeout: 10000 });
    await expect(errorBlock).toContainText("✗", { timeout: 10000 });
  });

  test("navbar elements are properly center-aligned", async ({ page }) => {
    const navbar = page.locator("nav").first();
    await expect(navbar).toHaveClass(/items-center/);
    await expect(navbar).toHaveCSS("align-items", "center");
  });
});
