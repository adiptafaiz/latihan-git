import { test, expect } from "@playwright/test";

async function login(page: any) {
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@perusahaan.com");
    await page.getByLabel("Password").fill("admin123");

    await page.getByRole("button", { name: "Masuk" }).click();

    await page.waitForURL("**/dashboard");
}

test.describe("Import Export", () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test("export csv button visible", async ({ page }) => {
        await page.goto("/employees");

        await expect(
            page.getByRole("link", { name: /Export CSV/i })
        ).toBeVisible();
    });

    test("import csv button visible", async ({ page }) => {
        await page.goto("/employees");

        await expect(
            page.getByRole("button", { name: /Import/i })
        ).toBeVisible();
    });
});