import { test, expect } from "@playwright/test";
// Requer o D1 com as contas demo (npm run demo:users -- --local) e o cf:preview em E2E_BASE_URL.
test.skip(!process.env.E2E_BASE_URL, "Rode contra o cf:preview ou a produção (E2E_BASE_URL).");
test("login, demo rápido, logout e mensagens", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("ong@ongsave.demo");
  await page.getByLabel("Senha", { exact: true }).fill("errada1");
  await page.getByRole("button", { name: /Entrar no ONGSave/ }).click();
  await expect(
    page.getByText("E-mail ou senha incorretos. Confira sua conta e tente novamente."),
  ).toBeVisible();
  await page.getByLabel("Senha", { exact: true }).fill("demo123");
  await page.getByRole("button", { name: /Entrar no ONGSave/ }).click();
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByRole("heading", { name: "Instituto Esperança" })).toBeVisible();
  await page.goto("/profile");
  await page.locator("#app-content").getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/demo");
  await page.getByRole("button", { name: "Entrar como motorista" }).click();
  await expect(page).toHaveURL(/\/driver\/missions/);
  await expect(page.getByRole("heading", { name: /Olá, Lucas/ })).toBeVisible();
  expect(errors).toEqual([]);
});
