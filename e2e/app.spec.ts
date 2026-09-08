import { expect, test, type Page } from "@playwright/test";

const HOST_ROUTES = [
  "/app",
  "/app/cases",
  "/app/cases/new",
  "/app/properties",
  "/app/cleaning",
  "/app/settings",
  "/app/notifications",
];

async function setLocale(page: Page, locale: "sv" | "en" | "es") {
  const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.context().addCookies([{ name: "homioqo.locale", value: locale, url: origin }]);
}

test.describe("login has no demo account", () => {
  test("does not offer a demo login or prefilled credentials", async ({ page }) => {
    await setLocale(page, "sv");
    await page.goto("/login", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Logga in|Log in|Iniciar sesión/ })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/demokontot|demo account|cuenta de demostración/i);
    await expect(page.locator("body")).not.toContainText("anna@homioqo.se");
    await expect(page.locator("body")).not.toContainText("demo1234");
    await page.getByRole("button", { name: /Värd eller förvaltare|Host or manager|Anfitrión/ }).click();
    await expect(page.locator("input[name=email]")).toHaveValue("");
    await expect(page.locator("input[name=password]")).toHaveValue("");
  });
});

test.describe("protected host routes", () => {
  for (const path of HOST_ROUTES) {
    test(`${path} sends signed-out users to login`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("public guest guide isolation", () => {
  test("Villa Sol guide does not expose internals", async ({ page }) => {
    await page.goto("/g/qr_solsidan");
    const body = await page.locator("body").innerText();
    expect(body).toContain("Villa Sol");
    expect(body).not.toContain("anna@homioqo.se");
    expect(body).not.toContain("Ytterdörr mot sjösidan");
    expect(body).not.toContain("Intern");
    expect(body).not.toContain("holm@mail.se");
    expect(body).toContain("EXAMPLE-WIFI");
  });
});
