import { test, expect } from "@playwright/test";

for (const width of [390, 996]) {
  test(`mapa mostra apenas a missão escolhida pela lista em ${width}px`, async ({ page }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL,
      "Requer as contas demo do Supabase configurado.",
    );
    const errors: string[] = [];
    let vectorTiles = 0;
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (/tiles\.openfreemap\.org\/planet\/.*\.pbf/.test(response.url()) && response.ok())
        vectorTiles++;
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await page.getByLabel("E-mail", { exact: true }).fill("motorista@ongsave.demo");
    await page.getByLabel("Senha", { exact: true }).fill("demo123");
    await page.getByRole("button", { name: "Entrar no ONGSave", exact: true }).click();
    await expect(page).toHaveURL(/\/driver\/missions/);
    const map = page.getByRole("region", { name: "Mapa dos resgates", exact: true });
    await expect.poll(() => vectorTiles, { timeout: 30000 }).toBeGreaterThan(0);
    await expect
      .poll(async () => Number(await map.getAttribute("data-route-points")), { timeout: 30000 })
      .toBeGreaterThan(1);
    await expect(map.getByRole("button", { name: /^Entrega:/ })).toBeVisible();
    await expect(map.locator(".map-marker:not(.driver)")).toHaveCount(2);
    await expect(map.getByRole("img", { name: "Posição simulada do motorista" })).toBeVisible();
    await expect(map.getByLabel("Legenda do mapa")).toBeVisible();
    const previous = await map.getAttribute("data-route-rescue");
    await page.getByRole("tab", { name: "Outras missões", exact: true }).click();
    await page
      .locator("button.rescue-row[aria-pressed='false']")
      .filter({ visible: true })
      .first()
      .click();
    await page.getByRole("tab", { name: "Rota", exact: true }).click();
    await expect(map).not.toHaveAttribute("data-route-rescue", previous!);
    await expect(map.locator(".map-marker:not(.driver)")).toHaveCount(2);
    await expect
      .poll(async () => Number(await map.getAttribute("data-route-points")), { timeout: 15000 })
      .toBeGreaterThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
    const badgeBox = await map.locator(".map-badge").boundingBox();
    const destinationBox = await map.getByRole("button", { name: /^Entrega:/ }).boundingBox();
    expect(destinationBox!.y).toBeGreaterThan(badgeBox!.y + badgeBox!.height);
    await map.screenshot({ path: `artifacts/redesign/map-${width}.png` });
  });
}
