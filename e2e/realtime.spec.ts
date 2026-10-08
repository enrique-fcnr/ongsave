import { test, expect, type Page } from "@playwright/test";
// Requer o Worker com o Durable Object (cf:preview ou produção) em E2E_BASE_URL.
test.skip(!process.env.E2E_BASE_URL, "Rode contra o cf:preview ou a produção (E2E_BASE_URL).");
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("demo123");
  await page.getByRole("button", { name: "Entrar no ONGSave" }).click();
  await expect(page).toHaveURL(/\/home|\/driver\/missions/);
}
test("publicação de uma sessão aparece na outra em menos de 2 s, sem dado no aviso", async ({
  browser,
}) => {
  const [a, b, anon] = await Promise.all([
    browser.newContext(),
    browser.newContext(),
    browser.newContext(),
  ]);
  try {
    const market = await a.newPage();
    const ngo = await b.newPage();
    const frames: string[] = [];
    ngo.on("websocket", (ws) => {
      if (ws.url().endsWith("/api/realtime"))
        ws.on("framereceived", (f) => frames.push(String(f.payload)));
    });
    await login(market, "mercado@ongsave.demo");
    await login(ngo, "ong@ongsave.demo");
    await ngo.goto("/ngo/donations");
    await expect(ngo.getByText("Atualizações ao vivo", { exact: true })).toBeVisible();
    await market.goto("/supermarket/surplus/new");
    await market.locator('input[type="file"]').nth(1).setInputFiles("e2e/fixtures/vegetables.jpg");
    await expect(market.getByText(/Análise (de demonstração|concluída)/)).toBeVisible();
    const title = `Ao vivo ${Date.now()}`;
    await market.getByLabel("Título", { exact: true }).fill(title);
    await market.getByRole("checkbox").check();
    await market.getByRole("button", { name: "Confirmar e publicar" }).click();
    await expect(market.getByRole("heading", { name: "Excedente publicado" })).toBeVisible();
    await expect(ngo.getByRole("heading", { name: title, exact: true })).toBeVisible({
      timeout: 2000,
    });
    expect(frames.some((f) => f.includes('"type":"changed"'))).toBe(true);
    expect(frames.join()).not.toContain(title);
    const page = await anon.newPage();
    await page.goto("/");
    const result = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          const ws = new WebSocket(location.origin.replace("http", "ws") + "/api/realtime");
          ws.onopen = () => resolve("open");
          ws.onerror = () => resolve("refused");
        }),
    );
    expect(result).toBe("refused");
  } finally {
    await Promise.all([a.close(), b.close(), anon.close()]);
  }
});
