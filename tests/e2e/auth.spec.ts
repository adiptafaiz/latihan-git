import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
    test("login page loads", async ({ page }) => {
        await page.goto("/login");

        await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
        await expect(page.getByLabel("Email")).toBeVisible();
        await expect(page.getByLabel("Password")).toBeVisible();
        await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
    });

    test("login failed with invalid credentials", async ({ page }) => {
        await page.goto("/login");

        await page.getByLabel("Email").fill("salah@test.com");
        await page.getByLabel("Password").fill("passwordsalah");
        await page.getByRole("button", { name: "Masuk" }).click();

        await page.waitForTimeout(3000);

    });

    test("login success", async ({ page }) => {
        await page.goto("/login");

        await page.getByLabel("Email").fill("admin@perusahaan.com");
        await page.getByLabel("Password").fill("admin123"); // ganti sesuai password

        await page.getByRole("button", { name: "Masuk" }).click();

        await expect(page).toHaveURL(/dashboard/);
    });
});