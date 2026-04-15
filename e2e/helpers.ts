import { test, expect, type Page } from "@playwright/test";

export const VALID_SCHEMA = JSON.stringify(
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://studio.ioflux.org/schema",
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "integer" },
    },
  },
  null,
  2
);

export const INVALID_SCHEMA = `{ "type": "object", "properties": { BROKEN`;

export const VALID_YAML_SCHEMA = `
$schema: "https://json-schema.org/draft/2020-12/schema"
$id: "https://studio.ioflux.org/schema"
type: object
properties:
  username:
    type: string
  score:
    type: integer
`.trim();


export async function fillMonacoEditor(page: Page, content: string) {
  const editor = page.locator(".monaco-editor").first();
  await editor.waitFor({ state: "visible", timeout: 20_000 });
  await editor.click();
  await page.keyboard.press("Control+A");
  await page.waitForTimeout(100);
  await page.keyboard.type(content, { delay: 0 });
}

export async function waitForGraph(page: Page) {
  await page.waitForSelector(".react-flow", { timeout: 20_000 });
  await page.waitForSelector(".react-flow__node", { timeout: 20_000 });
}
