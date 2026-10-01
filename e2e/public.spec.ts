import { test, expect } from "@playwright/test";
for (const width of [375, 390, 430, 768, 1280, 1440])
  test(`página pública e login sem overflow em ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Alimentos merecem/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bom ter você aqui." })).toBeVisible();
    await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
test("rotas protegidas redirecionam e PWA possui ícones válidos", async ({ page, request }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login/);
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  expect((await request.get("/sw.js")).ok()).toBe(true);
});

test("API reconhece a origem local e rejeita origem externa", async ({ request }, testInfo) => {
  const origin = new URL(testInfo.project.use.baseURL!).origin;
  const local = await request.post("/api/batches", { headers: { Origin: origin } });
  expect(local.status()).toBe(400);
  expect(await local.json()).toEqual({ error: "Faça login para continuar." });
  const external = await request.post("/api/batches", {
    headers: { Origin: "https://example.invalid" },
  });
  expect(external.status()).toBe(400);
  expect(await external.json()).toEqual({ error: "Origem não autorizada." });
});
