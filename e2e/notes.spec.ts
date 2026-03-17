import { test, expect } from "@playwright/test";

/**
 * Process 12: Notes list. User opens /notes.
 */
test("notes list loads", async ({ page }) => {
  await page.goto("/notes");
  await expect(
    page.getByRole("heading", { name: "Notes", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByRole("button", { name: /Add note/i }),
  ).toBeVisible();
});

/**
 * Process 13: Note detail / edit. Select a note, edit content, debounced save.
 */
test("note detail and edit with debounced save", async ({ page }) => {
  await page.goto("/notes");
  await expect(
    page.getByRole("heading", { name: "Notes", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  const firstNote = page
    .getByRole("button", {
      name: /general|interview|research|job description/i,
    })
    .first();
  await expect(firstNote).toBeVisible({ timeout: 10000 });
  await firstNote.click();
  await expect(page.getByLabel("Content")).toBeVisible({ timeout: 5000 });
  const textarea = page.getByRole("textbox", { name: "Content" });
  await textarea.fill("E2E note edit at " + Date.now());
  await expect(
    page.locator('[class*="saveStatus"]').filter({ hasText: /Saving…|Saved/ }),
  ).toBeVisible({ timeout: 3000 });
  await expect(
    page.locator('[class*="saveStatus"]').filter({ hasText: "Saved" }),
  ).toBeVisible({ timeout: 10000 });
});

/**
 * Process 14: Add note.
 */
test("add note", async ({ page }) => {
  await page.goto("/notes");
  await page.getByRole("button", { name: /Add note/i }).first().click();
  await page
    .getByRole("textbox", { name: "Content" })
    .fill("E2E new note " + Date.now());
  await page.locator("form").getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("E2E new note")).toBeVisible({ timeout: 5000 });
});

/**
 * Process 15: Delete note. Select note, click Delete note.
 */
test("delete note", async ({ page }) => {
  await page.goto("/notes");
  await page.getByRole("button", { name: /Add note/i }).first().click();
  await page
    .getByRole("textbox", { name: "Content" })
    .fill("E2E note to delete");
  await page
    .locator("form")
    .getByRole("button", { name: /Add note/i })
    .click();
  await expect(page.getByText("E2E note to delete")).toBeVisible({
    timeout: 5000,
  });
  await page
    .getByRole("button")
    .filter({ hasText: "E2E note to delete" })
    .first()
    .click();
  await expect(page.getByRole("button", { name: "Delete note" })).toBeVisible({
    timeout: 3000,
  });
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete note" }).click();
  await expect(page.getByText("Select a note or add a new one.")).toBeVisible({
    timeout: 5000,
  });
});
