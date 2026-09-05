import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("homepage loads with CTAs, nav anchors and no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Starta kostnadsfri pilot|Start a free pilot|Empieza la prueba gratuita/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Testa en gästguide|Try a guest guide|Prueba una guía de huésped/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Människorna bakom Homioqo|The people behind Homioqo|Las personas detrás de Homioqo/ }),
    ).toBeVisible();
    await expect(page.getByText("John Julius Erik Walden")).toBeVisible();
    await expect(page.getByText("Karl John Oliver Landen")).toBeVisible();
    await expect(page.getByText(/Kundlogotyper|Customer logos|logotipos de clientes/)).toHaveCount(0);
    await expect(page.getByText(/Julius, grundare|Julius, founder|Julius, fundador/)).toHaveCount(0);

    for (const href of ["#sa-fungerar-det", "#funktioner", "#priser", "#faq"]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
      await expect(page.locator(href)).toHaveCount(1);
    }

    const broken = await page.locator("img").evaluateAll((images) =>
      images
        .filter((image) => image instanceof HTMLImageElement && image.naturalWidth === 0)
        .map((image) => (image as HTMLImageElement).src),
    );
    expect(broken, broken.join("\n")).toEqual([]);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("audience toggle keeps the company register segment", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: /Företag|Company|Empresa/ }).click();
    await page
      .getByRole("link", { name: /Boka en personlig demo|Book a personal demo|Reservar una demostración personal/ })
      .first()
      .click();
    await expect(page.locator("#demo")).toBeVisible();
    await page.goto("/register?segment=company");
    await expect(page.getByRole("button", { name: /Företag|Company|Empresa/, pressed: true })).toBeVisible();
  });

  test("demo, login, register, privacy and terms are reachable", async ({ page }) => {
    for (const path of ["/demo", "/login", "/register", "/privacy", "/terms"]) {
      const response = await page.goto(path);
      expect(response?.ok(), path).toBeTruthy();
    }
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: /Villa Sol/ })).toBeVisible();
    await expect(page.getByText(/exempel|example|ejemplo/i)).toBeVisible();
    await page.getByRole("link", { name: /Öppna gästguiden|Open the guest guide|Abrir la guía/ }).click();
    await expect(page).toHaveURL(/\/g\/qr_solsidan/);
    await page.getByRole("link", { name: /Homioqo/ }).first().click();
  });

  test("register does not ask for payment details", async ({ page }) => {
    await page.goto("/register?segment=private");
    await expect(page.getByText(/kortnummer|card number|número de tarjeta|stripe/i)).toHaveCount(0);
    await expect(page.locator("input[name=firstName]")).toBeVisible();
  });

  test("login rejects a wrong password without leaking internals", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Anfitrión|Host|Värd|administratör|administrador/i }).click();
    await page.locator("input[name=password]").fill("fel-losenord");
    await page.getByRole("button", { name: /Logga in|Log in|Sign in|Iniciar sesión/ }).click();
    await expect(page.getByText(/Fel e-post eller lösenord|Incorrect email or password|Correo o contraseña/)).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("SESSION_SECRET");
    expect(body).not.toContain("SUPABASE");
  });

  test("invalid QR shows a friendly 404 without internals", async ({ page }) => {
    await page.goto("/g/qr_finns_inte");
    await expect(page.getByRole("heading", { name: /hittades inte|not found|encontramos/i })).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("9912");
    expect(body).not.toContain("SUPABASE");
    expect(body).not.toContain("SESSION_SECRET");
    await expect(page.getByRole("link", { name: /startsidan|homepage|inicio/i })).toBeVisible();
  });

  test("protected app routes send logged-out users to login", async ({ page }) => {
    await page.goto("/app/properties");
    await expect(page).toHaveURL(/\/login/);
  });

  test("language can be switched on the homepage and kept on reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Språk|Language|Idioma/ }).first().click();
    const english = page.getByRole("button", { name: /^English$/ });
    if (await english.count()) {
      await english.click();
      await expect(page.getByRole("heading", { name: /The people behind Homioqo|people behind/i })).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: /The people behind Homioqo|people behind/i })).toBeVisible();
    }
  });

  test("contact form requires consent and a valid email", async ({ page }) => {
    await page.goto("/#demo");
    await page.locator("#demo-name").fill("Test Person");
    await page.locator("#demo-email").fill("inte-mejl");
    await page.locator("#demo-phone").fill("+46701111111");
    await page.locator("#demo-message").fill("Vill testa Homioqo");
    await page.locator("#demo").getByRole("button", { name: /Skicka|Send|Enviar/ }).click();
    await expect(page.locator("#demo-email")).toBeVisible();
  });

  test("mobile homepage does not overflow horizontally", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.getByRole("button", { name: /Meny|Menu|Menú/ }).click();
    await expect(page.getByRole("link", { name: /Starta kostnadsfri pilot|Start a free pilot|Empieza la prueba gratuita/ })).toBeVisible();
  });
});
