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

async function dismissDevOverlay(page: Page) {
  await page.keyboard.press("Escape").catch(() => undefined);
  await page.evaluate(() => {
    document.querySelector("nextjs-portal")?.remove();
  });
}

async function loginAs(
  page: Page,
  role: "host" | "cleaner" | "contractor",
) {
  await page.goto("/login", { waitUntil: "load" });
  await dismissDevOverlay(page);
  await page.getByRole("heading", { name: /Logga in|Log in|Iniciar sesión/ }).waitFor();
  const roleName =
    role === "host"
      ? /Värd eller förvaltare|Host or manager|Anfitrión o administrador/
      : role === "cleaner"
        ? /Städpersonal|Cleaning staff|Personal de limpieza/
        : /Hantverkare|^Contractor$|Profesional/;
  const password = page.locator("input[name=password]");
  for (let attempt = 0; attempt < 3 && !(await password.isVisible().catch(() => false)); attempt += 1) {
    await dismissDevOverlay(page);
    await page.getByRole("button", { name: roleName }).click({ force: true });
    await password.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
  }
  await expect(password).toBeVisible();
  if (role === "host") {
    await page.getByRole("button", { name: /demokontot|demo account|demostración/i }).click();
  } else {
    await password.fill("demo1234");
    await page.getByRole("button", { name: /Logga in|Log in|Iniciar sesión/ }).click();
  }
  await page.waitForURL(/\/app/, { timeout: 20000 });
}

test.describe("authenticated host app", () => {
  for (const locale of ["sv", "en", "es"] as const) {
    test(`host routes render in ${locale}`, async ({ page }) => {
      test.setTimeout(90_000);
      await setLocale(page, locale);
      await loginAs(page, "host");
      if (locale === "sv") {
        await expect(page).toHaveTitle(/Översikt/);
        await expect(page.getByRole("navigation").getByRole("link", { name: "Översikt" })).toBeVisible();
      }
      if (locale === "es") {
        await expect(page).toHaveTitle(/Resumen/);
        await expect(page.getByRole("navigation").getByRole("link", { name: "Resumen" })).toBeVisible();
        await expect(page.getByRole("navigation")).not.toContainText("Overview");
      }
      for (const path of HOST_ROUTES) {
        const response = await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(response?.ok(), path).toBeTruthy();
        await expect(page.locator("h1").first()).toBeVisible();
      }
      await page.goto("/app/properties");
      await page.locator('a[href*="/app/properties/"]').first().click();
      await expect(page).toHaveTitle(/.+/);
      await page.goto("/app/cases");
      await page.locator('a[href*="/app/cases/"]').first().click();
      await expect(page.locator("h1").first()).toBeVisible();
      await page.goto("/app/cleaning");
      const cleaningLink = page.locator('a[href*="/app/cleaning/"]').first();
      if (await cleaningLink.count()) {
        await cleaningLink.click();
        await expect(page.locator("h1, main").first()).toBeVisible();
      }
      await page.goto("/app/owner");
      await expect(page).toHaveURL(/\/app(?!\/owner)/);
    });
  }

  test("host app loads on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setLocale(page, "sv");
    await loginAs(page, "host");
    for (const path of ["/app", "/app/cases", "/app/properties", "/app/cleaning", "/app/settings"]) {
      const response = await page.goto(path);
      expect(response?.ok(), path).toBeTruthy();
      await expect(page.locator("main, h1, [class*='container']").first()).toBeVisible();
    }
  });

  test("host can create a test case from the new-case form", async ({ page }) => {
    await setLocale(page, "sv");
    await loginAs(page, "host");
    await page.goto("/app/cases/new");
    await page.locator("#propertyId").selectOption({ label: "Villa Sol" });
    await page.locator("#priority").selectOption("urgent");
    await page.locator("#title").fill("QA testdata läcka");
    await page.locator("#description").fill("Endast testdata. Ingen riktig skada.");
    await page.getByRole("button", { name: /Skapa|Create|Crear/ }).click();
    await page.waitForURL(/\/app\/cases\/(?!new)/);
    await expect(page.locator("body")).toContainText("QA testdata läcka");
    await expect(page.locator("body")).toContainText(/Akut|Urgent|Urgente/);
  });
});

test.describe("staff roles", () => {
  test("cleaner sees assigned jobs only", async ({ page }) => {
    await setLocale(page, "sv");
    await loginAs(page, "cleaner");
    await expect(page).toHaveURL(/\/app\/cleaner/);
    await expect(page.getByText(/städuppdrag/i).first()).toBeVisible();
    await page.locator('a[href*="/app/cleaner/"]').first().click();
    await expect(page.locator("body")).not.toContainText("Intern nyckelkod");
  });

  test("contractor sees assigned work only", async ({ page }) => {
    await setLocale(page, "sv");
    await loginAs(page, "contractor");
    await expect(page).toHaveURL(/\/app\/contractor/);
    await expect(page).toHaveTitle(/Dina arbeten|Your jobs|Tus trabajos/);
    await expect(page.locator("body")).toContainText(/Dina arbeten|ärende|Villa|Casa/i);
  });
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
  });
});
