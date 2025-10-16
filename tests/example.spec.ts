import { test, expect } from "@playwright/test"

test.describe("landing page", () => {
  test("loads the home page", async ({ page }) => {
    await page.goto("/")

    await expect(page.locator("main"))
      .toBeVisible()
    await expect(page.getByRole("heading", { name: /10xcards/i }))
      .toBeVisible()
  })
})
