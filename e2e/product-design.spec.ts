import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { demoAnalysis } from "../src/lib/ai/demo-analysis";
import { id } from "../scripts/seed-data";

// Read-only checks: do not publish, reserve, advance, reset or save preferences.
const roles = [
  {
    role: "market",
    email: "mercado@ongsave.demo",
    routes: [
      "/home",
      "/supermarket/surplus/new",
      `/supermarket/surplus/${id("batch:0")}`,
      "/rescues",
      "/impact",
      "/profile",
      "/supermarket/reports",
    ],
  },
  {
    role: "ngo",
    email: "ong@ongsave.demo",
    routes: [
      "/home",
      "/ngo/donations",
      `/ngo/donations/${id("batch:0")}`,
      "/rescues",
      "/impact",
      "/profile",
    ],
  },
  {
    role: "driver",
    email: "motorista@ongsave.demo",
    routes: ["/driver/missions", "/rescues", "/impact", "/profile"],
  },
];
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const width of [390, 768, 1440]) {
  test(`foto, revisão e confirmação em ${width}px com APIs isoladas`, async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, "Requer login de demonstração.");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await page.getByLabel("E-mail", { exact: true }).fill("mercado@ongsave.demo");
    await page.getByLabel("Senha", { exact: true }).fill("demo123");
    await page.getByRole("button", { name: "Entrar no ONGSave", exact: true }).click();
    await expect(page).toHaveURL(/\/home/);
    const directory = `artifacts/product-design/review-${width}`;
    mkdirSync(directory, { recursive: true });
    // Intercept every write. This verifies the UI contract without creating a remote lot or photo.
    await page.route("**/api/upload", (route) =>
      route.fulfill({
        json: { path: "fixture/food.jpg", analysisId: "00000000-0000-4000-8000-000000000001" },
      }),
    );
    let releaseAnalysis!: () => void;
    const analysisGate = new Promise<void>((resolve) => {
      releaseAnalysis = resolve;
    });
    await page.route("**/api/analyze", async (route) => {
      await analysisGate;
      await route.fulfill({
        json: {
          analysis: demoAnalysis,
          analysisId: "00000000-0000-4000-8000-000000000001",
          provider: "demo",
        },
      });
    });
    let reviewedPayload: Record<string, unknown> | undefined;
    await page.route("**/api/batches", async (route) => {
      reviewedPayload = route.request().postDataJSON().payload;
      await route.fulfill({ json: { id: "00000000-0000-4000-8000-000000000002" } });
    });
    await page.goto("/supermarket/surplus/new");
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Selecionar da galeria", exact: true }).click();
    await (await chooser).setFiles(resolve("e2e/fixtures/vegetables.jpg"));
    await expect(page.getByRole("heading", { name: "Analisando excedente" })).toBeVisible();
    await page.screenshot({ path: `${directory}/analise.png`, animations: "disabled" });
    releaseAnalysis();
    await expect(page.getByRole("heading", { name: "Revise antes de publicar" })).toBeVisible();
    const publication = page.getByRole("button", { name: "Confirmar e publicar", exact: true });
    await expect(publication).toBeDisabled();
    await page.getByLabel("Peso revisado (kg)", { exact: true }).fill("12");
    await page.getByRole("tab", { name: "Itens", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar item" }).click();
    const nextItems = page.getByRole("button", {
      name: "Próxima página: Itens do lote",
      exact: true,
    });
    while (await nextItems.isEnabled()) await nextItems.click();
    await page
      .getByRole("textbox", { name: /^Nome do item/ })
      .last()
      .fill("Maçãs");
    await page
      .getByRole("spinbutton", { name: /^Quantidade do item/ })
      .last()
      .fill("10");
    await fits(page);
    await page.screenshot({
      path: `${directory}/revisao.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("tab", { name: "Confirmar", exact: true }).click();
    await page.getByRole("checkbox", { name: /^Confirmo que revisei/ }).check();
    await expect(publication).toBeEnabled();
    await publication.click();
    await expect(
      page.getByRole("heading", { name: "Excedente publicado", exact: true }),
    ).toBeVisible();
    expect(reviewedPayload).toMatchObject({ user_confirmed: true, estimated_weight_kg: 12 });
    await fits(page);
    await page.screenshot({ path: `${directory}/confirmacao.png`, animations: "disabled" });
  });
}
for (const width of [390, 768, 1440]) {
  for (const account of roles) {
    test(`${account.role}: telas e navegação em ${width}px`, async ({ page }) => {
      test.skip(
        !process.env.NEXT_PUBLIC_SUPABASE_URL,
        "Requer contas de demonstração configuradas.",
      );
      test.setTimeout(180000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/login");
      await page.getByLabel("E-mail", { exact: true }).fill(account.email);
      await page.getByLabel("Senha", { exact: true }).fill("demo123");
      await page.getByRole("button", { name: "Entrar no ONGSave", exact: true }).click();
      await expect(page).toHaveURL(/\/home|\/driver\/missions/);
      const directory = `artifacts/product-design/${account.role}-${width}`;
      mkdirSync(directory, { recursive: true });
      for (const route of account.routes) {
        await page.goto(route);
        const main = page.locator("#app-content");
        await expect(main.locator("h1").first()).toBeVisible();
        await fits(page);
        const nav = page.getByRole("navigation", {
          name: width < 768 ? "Navegação principal" : "Navegação do produto",
          exact: true,
        });
        await expect(nav).toBeVisible();
        if (route !== "/supermarket/reports" || width >= 768)
          await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
        await page.screenshot({
          path: `${directory}/${route.replaceAll("/", "-").slice(1)}.png`,
          animations: "disabled",
        });
        if (route === "/profile") {
          await expect(page.getByRole("group", { name: "Seus dados", exact: true })).toBeVisible();
          if (account.role === "ngo") {
            await expect(
              page.getByRole("group", { name: "Disponibilidade para receber" }),
            ).toBeVisible();
            await expect(
              page
                .getByRole("group", { name: "Alimentos e armazenamento" })
                .getByLabel("Possui freezer"),
            ).toBeAttached();
          }
        }
        if (route === "/ngo/donations" && (await page.locator(".donation-card").count())) {
          await page.locator(".donation-card").first().click();
          await expect(page.locator(".detail-summary h1")).toBeVisible();
          await fits(page);
          await page.screenshot({
            path: `${directory}/doacao-detalhe.png`,
            animations: "disabled",
          });
        }
        if (route === "/rescues" && (await page.locator(".rescue-row").count())) {
          if (!(await page.locator(".rescue-row").filter({ visible: true }).count()))
            await page.getByRole("tab", { name: "Entregas", exact: true }).click();
          await page.locator(".rescue-row").filter({ visible: true }).first().click();
          await expect(page.locator(".timeline")).toBeVisible();
          await fits(page);
          await page.screenshot({
            path: `${directory}/resgate-detalhe.png`,
            animations: "disabled",
          });
        }
      }
      await page.getByRole("button", { name: /^Notificações,/ }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: "Fechar", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      expect(errors).toEqual([]);
    });
  }
}
