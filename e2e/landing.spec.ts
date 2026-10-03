import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

async function revealSections(page: Page) {
  for (const section of await page.locator("main > section").all()) {
    await section.scrollIntoViewIfNeeded();
    for (const content of await section.locator("[data-reveal]").all()) {
      await content.scrollIntoViewIfNeeded();
      await expect(content).toHaveCSS("opacity", "1");
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}

test("landing desktop: menus, recursos por teclado, processo e FAQ", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.locator("header summary").click();
  await expect(page.getByRole("link", { name: "O impacto de cada entrega" })).toBeVisible();
  await page.locator("header summary").press("Escape");
  await expect(page.locator("header details")).not.toHaveAttribute("open");
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "A plataforma", exact: true })
    .click();
  const tab = page.getByRole("tab", { name: "Foto & revisão" });
  await tab.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Doações" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("O alimento certo encontra quem precisa.");
  await page.getByRole("tab", { name: "Doações" }).press("End");
  await expect(page.getByRole("tab", { name: "Impacto" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Uma entrega. Um resultado que fica.");
  await page.getByRole("tab", { name: "Impacto" }).press("Home");
  await page.getByRole("button", { name: /2 Conecte a doação/ }).click();
  await expect(page.locator("#process-copy-1")).toBeVisible();
  await expect(page.locator("#process-copy-0")).toBeHidden();
  await page.getByRole("button", { name: /3 Resgate, entregue/ }).click();
  await expect(page.locator("#process-copy-2")).toContainText("confirma o recebimento");
  await page.locator("#perguntas summary").filter({ hasText: "Como um resgate começa?" }).click();
  await expect(page.locator("#faq-answer-1")).toBeVisible();
  await page
    .locator("#perguntas summary")
    .filter({ hasText: "A foto publica a doação automaticamente?" })
    .click();
  await expect(page.locator("#faq-answer-2")).toContainText("Não.");
  await expect(page.locator("#faq-answer-1")).toBeHidden();
  await page.getByRole("button", { name: "Pausar movimento" }).click();
  await expect(page.getByRole("button", { name: "Retomar movimento" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const image = page.getByRole("img", { name: /Imagem ilustrativa de uma equipe/ });
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
    )
    .toBe(true);
  await revealSections(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  mkdirSync("artifacts/landing", { recursive: true });
  await page.screenshot({ path: "artifacts/landing/desktop-hero.png", animations: "disabled" });
  await page.screenshot({
    path: "artifacts/landing/desktop-completa.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .locator("#nossa-rede")
    .screenshot({ path: "artifacts/landing/equipe.png", animations: "disabled" });
});

test("landing mobile: navegação fecha após escolha e os recursos funcionam", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Abrir menu" });
  await toggle.click();
  await page
    .getByRole("navigation", { name: "Navegação mobile" })
    .getByRole("link", { name: "A plataforma", exact: true })
    .click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/#plataforma$/);
  await page.getByRole("tab", { name: "Missões" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Cada trajeto tem um propósito.");
  await toggle.click();
  await page.getByRole("button", { name: "Fechar menu" }).press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await revealSections(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  mkdirSync("artifacts/landing", { recursive: true });
  await page.screenshot({ path: "artifacts/landing/mobile-hero.png", animations: "disabled" });
  await page.screenshot({
    path: "artifacts/landing/mobile-completa.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("landing respeita movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Pausar movimento" })).toBeHidden();
  await expect(page.locator("[data-reveal-ready]")).toHaveCount(0);
  await expect(page.locator("#plataforma h2")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("heading", { name: /Alimentos merecem/ })).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("landing mantém conteúdo, navegação e FAQ sem JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Alimentos merecem/ })).toBeVisible();
  await expect(page.locator("#para-quem h2")).toHaveCSS("opacity", "1");
  await page
    .locator("#perguntas summary")
    .filter({ hasText: "Quem pode participar da ONGSave?" })
    .click();
  await expect(page.locator("#faq-answer-0")).toBeVisible();
  await page.getByRole("link", { name: "Começar um resgate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bom ter você aqui." })).toBeVisible();
  await context.close();
});
