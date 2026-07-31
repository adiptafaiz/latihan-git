import { test, expect } from "@playwright/test";

async function loginStaff(page: any) {
    await page.goto("/login");

    await page.getByLabel("Email").fill("staff@perusahaan.com");
    await page.getByLabel("Password").fill("staff123");

    await page.getByRole("button", { name: "Masuk" }).click();

    await page.waitForURL("**/dashboard", {
        timeout: 15000,
    });
}

test.describe("RBAC", () => {
    test("staff cannot access user management", async ({ page }) => {
        await loginStaff(page);

        await page.goto("/users");

        await expect(page).not.toHaveURL(/users/);
    });

    test("staff can access employee page", async ({ page }) => {
        await loginStaff(page);

        await page.goto("/employees");

        await expect(page).toHaveURL(/employees/);
    });
});