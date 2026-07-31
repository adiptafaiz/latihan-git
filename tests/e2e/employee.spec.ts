import { test, expect } from "@playwright/test";

async function login(page: any) {
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@perusahaan.com");
    await page.getByLabel("Password").fill("admin123");

    await page.getByRole("button", { name: "Masuk" }).click();

    await page.waitForURL("**/dashboard", {
        timeout: 15000,
    });
}

test.describe("Employee Page", () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test("employee page loads", async ({ page }) => {
        await page.goto("/employees");

        await expect(page).toHaveURL(/employees/);
        await expect(page.locator("h1")).toHaveText("Karyawan");
    });

    test("show add employee button", async ({ page }) => {
        await page.goto("/employees");

        await expect(
            page.getByRole("link", { name: /Tambah Karyawan/i })
        ).toBeVisible();
    });

    test("show export csv button", async ({ page }) => {
        await page.goto("/employees");

        await expect(
            page.getByRole("link", { name: /Export CSV/i })
        ).toBeVisible();
    });

    test("show import csv button", async ({ page }) => {
        await page.goto("/employees");

        await expect(
            page.getByRole("button", { name: /Import/i })
        ).toBeVisible();
    });

    test("admin can open new employee page", async ({ page }) => {
        await page.goto("/employees");

        await page.getByRole("link", { name: /Tambah Karyawan/i }).click();

        await expect(page).toHaveURL(/employees\/new/);
    });
});