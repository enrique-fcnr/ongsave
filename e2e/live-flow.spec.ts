import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { analysisSchema } from "../src/lib/ai/schema";
import { createClient } from "@supabase/supabase-js";

type Change = { table: string; record: Record<string, unknown> };
function observeRealtime(page: Page) {
  const changes: Change[] = [];
  page.on("websocket", (socket) => {
    if (!socket.url().includes("/realtime/v1/")) return;
    socket.on("framereceived", ({ payload }) => {
      try {
        const message = JSON.parse(payload.toString());
        const event = Array.isArray(message) ? message[3] : message.event;
        const body = Array.isArray(message) ? message[4] : message.payload;
        if (event === "postgres_changes" && body?.data?.table) {
          changes.push({ table: body.data.table, record: body.data.record || {} });
        }
      } catch {
        /* Ignore heartbeat frames. Only Postgres frames prove Realtime. */
      }
    });
  });
  return changes;
}
async function change(changes: Change[], table: string, id: string, status: string) {
  await expect
    .poll(
      () =>
        changes.some((c) => c.table === table && c.record.id === id && c.record.status === status),
      { timeout: 15000, message: `Aguardar evento real ${table}:${id}:${status}` },
    )
    .toBe(true);
}
async function subscribed(page: Page) {
  await expect(page.getByText("Atualizações ao vivo", { exact: true })).toBeVisible({
    timeout: 15000,
  });
}
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("demo123");
  await page.getByRole("button", { name: "Entrar no ONGSave" }).click();
  await expect(page).toHaveURL(/\/home|\/driver\/missions/);
  await subscribed(page);
}
async function metric(page: Page, label: RegExp) {
  const value = await page
    .locator(".metric")
    .filter({ has: page.getByText(label) })
    .locator(".value")
    .innerText();
  return Number(
    value
      .replace(/[^\d,.]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );
}
async function totals(page: Page) {
  const [kg, meals, count] = await Promise.all([
    metric(page, /^Alimentos (salvos|recebidos|transportados)$/),
    metric(page, /^Refeições estimadas$/),
    metric(page, /^Resgates concluídos$/),
  ]);
  const weekly = await page
    .getByRole("img", { name: /^Quilogramas por semana:/ })
    .getAttribute("aria-label");
  const week = Number(
    weekly!.split(": ")[1].split(", ").at(-1)!.replace(/\./g, "").replace(",", "."),
  );
  return { kg, meals, count, week };
}
async function renderedMap(page: Page, rescueId: string, phase: "pickup" | "delivery") {
  const map = page.getByRole("region", { name: "Mapa dos resgates", exact: true });
  await expect(map).toHaveAttribute("data-route-rescue", rescueId, { timeout: 20000 });
  await expect(map).toHaveAttribute("data-route-phase", phase);
  await expect
    .poll(async () => Number(await map.getAttribute("data-route-points")), { timeout: 20000 })
    .toBeGreaterThan(1);
  await expect(map.locator("canvas.maplibregl-canvas")).toBeVisible();
  await expect(map.locator(".map-marker.selected").filter({ hasText: "C" })).toBeVisible();
  await expect(map.getByRole("button", { name: /^Entrega:/ })).toBeVisible();
  await expect(map.getByRole("img", { name: "Posição simulada do motorista" })).toBeVisible();
}

test("foto real, três contas, impacto e repetição após reset com fallback manual", async ({
  browser,
}, testInfo) => {
  test.skip(
    process.env.RUN_LIVE_E2E !== "true",
    "Requer Supabase dedicado e contas seed. RUN_LIVE_E2E=true autoriza resetar dados demo.",
  );
  test.setTimeout(300000);
  const contexts = await Promise.all(
    [0, 1, 2].map(() => browser.newContext({ viewport: { width: 390, height: 844 } })),
  );
  const main = await Promise.all(contexts.map((c) => c.newPage()));
  const [market, ngo, driver] = main;
  let mapTiles = 0;
  driver.on("response", (response) => {
    if (
      response.url().startsWith("https://tile.openstreetmap.org/") &&
      response.ok() &&
      response.headers()["content-type"]?.startsWith("image/")
    )
      mapTiles++;
  });
  const changes = main.map(observeRealtime);
  const impact = await Promise.all(contexts.map((c) => c.newPage()));
  const history = await Promise.all(contexts.map((c) => c.newPage()));
  const errors: string[] = [];
  [...main, ...impact, ...history].forEach((page) =>
    page.on("pageerror", (e) => errors.push(e.message)),
  );
  let previous: { title: string; photoPath: string } | undefined;
  let seeded: Awaited<ReturnType<typeof totals>>[] | undefined;
  try {
    // Check deletion against authenticated Storage metadata, because signed
    // downloads can remain cached at the CDN after the origin object is gone.
    const storage = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: storageAuth, error: storageAuthError } = await storage.auth.signInWithPassword({
      email: "mercado@ongsave.demo",
      password: "demo123",
    });
    expect(storageAuthError).toBeNull();
    await Promise.all([
      login(market, "mercado@ongsave.demo"),
      login(ngo, "ong@ongsave.demo"),
      login(driver, "motorista@ongsave.demo"),
    ]);
    for (const manual of [false, true]) {
      const run = manual ? "manual-após-reset" : "multimodal";
      // Reset through the real presentation control, using the official market account.
      await market.goto("/demo");
      market.once("dialog", (dialog) => void dialog.accept());
      const resetResponse = market.waitForResponse(
        (r) => r.url().endsWith("/api/demo/reset") && r.request().method() === "POST",
      );
      await market.getByRole("button", { name: "Resetar demonstração" }).click();
      const reset = await resetResponse;
      const resetData = await reset.json();
      expect(reset.ok(), JSON.stringify(resetData)).toBe(true);
      expect(resetData).toEqual({ ok: true });
      await expect(market.getByRole("status")).toContainText("Demonstração resetada");
      await Promise.all([
        ...impact.map((page) => page.goto("/impact")),
        ...history.map((page) => page.goto("/rescues")),
      ]);
      await Promise.all([...impact, ...history].map(subscribed));
      const before = await Promise.all(impact.map(totals));
      if (seeded) expect(before).toEqual(seeded);
      else seeded = before;
      if (previous) {
        for (const page of history)
          await expect(page.getByRole("heading", { name: previous.title })).toHaveCount(0);
        const { data: photos, error: photosError } = await storage.storage
          .from("surplus")
          .list(storageAuth.user!.id, { search: previous.photoPath.split("/").pop() });
        expect(photosError).toBeNull();
        expect(photos).toEqual([]);
      }
      await Promise.all([
        ngo.goto("/ngo/donations"),
        driver.goto("/driver/missions"),
        market.goto("/supermarket/surplus/new"),
      ]);
      await Promise.all(main.map(subscribed));
      const title = `Resgate E2E ${run} ${Date.now()}`;
      const weight = manual ? 17 : 23;
      if (manual)
        await market.route("**/api/analyze", (route) =>
          route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: "Falha injetada no teste de recuperação." }),
          }),
        );
      const uploaded = market.waitForResponse(
        (r) => r.url().endsWith("/api/upload") && r.request().method() === "POST",
      );
      const analyzed = market.waitForResponse(
        (r) => r.url().endsWith("/api/analyze") && r.request().method() === "POST",
      );
      await market
        .locator('input[type="file"]')
        .nth(1)
        .setInputFiles(resolve(process.env.E2E_PHOTO_PATH || "e2e/fixtures/vegetables.jpg"));
      const uploadResponse = await uploaded;
      expect(uploadResponse.ok()).toBe(true);
      const upload = await uploadResponse.json();
      expect(upload.path).toMatch(/^[\da-f-]{36}\/[\da-f-]{36}\.jpeg$/);
      expect(upload.analysisId).toMatch(/^[\da-f-]{36}$/);
      const analysisResponse = await analyzed;
      if (manual) {
        expect(analysisResponse.status()).toBe(503);
        await market.getByRole("button", { name: "Preencher manualmente" }).click();
        await expect(market.getByText("Preenchimento manual", { exact: true })).toBeVisible();
      } else {
        expect(analysisResponse.ok()).toBe(true);
        const result = await analysisResponse.json();
        expect(analysisSchema.safeParse(result.analysis).success).toBe(true);
        expect(result.provider).toBe(process.env.AI_MODE === "live" ? "openai" : "demo");
        expect(result.analysisId).toMatch(/^[\da-f-]{36}$/);
        await expect(
          market.getByText(
            process.env.AI_MODE === "live" ? "Análise concluída" : "Análise de demonstração",
            { exact: true },
          ),
        ).toBeVisible();
      }
      // Human corrections must be persisted and used to calculate impact.
      await market.getByLabel("Título", { exact: true }).fill(title);
      await market.getByLabel("Categoria", { exact: true }).selectOption("produce");
      await market.getByLabel("Peso revisado (kg)", { exact: true }).fill(String(weight));
      await market.getByLabel("Retirar em até (horas)", { exact: true }).fill("8");
      await expect(market.getByRole("button", { name: "Confirmar e publicar" })).toBeDisabled();
      await market.getByRole("checkbox").check();
      const published = market.waitForResponse(
        (r) => r.url().endsWith("/api/batches") && r.request().method() === "POST",
      );
      await market.getByRole("button", { name: "Confirmar e publicar" }).click();
      const publication = await published;
      expect(publication.ok()).toBe(true);
      const batch = await publication.json();
      expect(batch.id).toMatch(/^[\da-f-]{36}$/);
      await expect(market.getByRole("heading", { name: "Excedente publicado" })).toBeVisible();
      await change(changes[1], "surplus_batches", batch.id, "AVAILABLE");
      const donation = ngo
        .getByRole("link")
        .filter({ has: ngo.getByRole("heading", { name: title, exact: true }) });
      await expect(donation).toBeVisible({ timeout: 15000 });
      const photo = donation.getByRole("img", { name: title });
      await expect
        .poll(() => photo.evaluate((image) => (image as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      const signedPhoto = await photo.getAttribute("src");
      expect(signedPhoto).toContain(`/storage/v1/object/sign/surplus/${upload.path}`);
      await ngo.getByRole("button", { name: /^Notificações,/ }).click();
      await expect(
        ngo.getByRole("dialog").getByText(`${weight} kg de ${title}`, { exact: true }),
      ).toBeVisible();
      await ngo.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
      await donation.click();
      await expect(ngo.getByRole("heading", { name: title, exact: true })).toBeVisible();
      ngo.once("dialog", (dialog) => void dialog.accept());
      await ngo.getByRole("button", { name: "Aceitar doação" }).click();
      await expect(ngo).toHaveURL(/\/rescue\/[\da-f-]+$/);
      const rescueId = new URL(ngo.url()).pathname.split("/").pop()!;
      await Promise.all([
        subscribed(ngo),
        change(changes[2], "rescues", rescueId, "WAITING_DRIVER"),
      ]);
      await driver
        .getByRole("button")
        .filter({ has: driver.getByRole("heading", { name: title, exact: true }) })
        .click();
      await renderedMap(driver, rescueId, "pickup");
      await expect.poll(() => mapTiles, { timeout: 15000 }).toBeGreaterThan(0);
      await testInfo.attach(`mapa-coleta-${run}`, {
        body: await driver.getByRole("region", { name: "Mapa dos resgates" }).screenshot(),
        contentType: "image/png",
      });
      await market.goto(ngo.url());
      await subscribed(market);
      await driver.getByRole("button", { name: "Aceitar missão", exact: true }).click();
      await driver.getByRole("link", { name: "Continuar missão", exact: true }).click();
      await expect(driver).toHaveURL(new RegExp(`/driver/missions/${rescueId}$`));
      await subscribed(driver);
      for (const action of [
        "Iniciar coleta",
        "Cheguei ao supermercado",
        "Confirmar retirada",
        "Iniciar transporte",
        "Cheguei à ONG",
      ])
        await driver.getByRole("button", { name: action, exact: true }).click();
      await renderedMap(driver, rescueId, "delivery");
      await testInfo.attach(`mapa-entrega-${run}`, {
        body: await driver.getByRole("region", { name: "Mapa dos resgates" }).screenshot(),
        contentType: "image/png",
      });
      await change(changes[1], "rescues", rescueId, "AT_DESTINATION");
      await expect(ngo.getByRole("button", { name: /Mostrar código/ })).toBeVisible({
        timeout: 15000,
      });
      await ngo.getByRole("button", { name: /Mostrar código/ }).click();
      const token = await ngo.locator(".token").innerText();
      expect(token).toMatch(/^\d{4}$/);
      await expect(market.locator(".token")).toHaveCount(0);
      await expect(driver.locator(".token")).toHaveCount(0);
      await driver
        .getByLabel("Digite o código da instituição")
        .fill(String((Number(token) + 1) % 10000).padStart(4, "0"));
      await driver.getByRole("button", { name: "Confirmar entrega", exact: true }).click();
      await expect(driver.getByRole("alert").filter({ hasText: "Código incorreto" })).toBeVisible();
      await expect(driver.getByRole("heading", { name: "Missão concluída" })).toHaveCount(0);
      await driver.getByLabel("Digite o código da instituição").fill(token);
      await driver.getByRole("button", { name: "Confirmar entrega", exact: true }).click();
      await Promise.all(
        main.map((page) =>
          expect(page.getByRole("heading", { name: "Missão concluída", exact: true })).toBeVisible({
            timeout: 15000,
          }),
        ),
      );
      await Promise.all([
        change(changes[0], "rescues", rescueId, "DELIVERED"),
        change(changes[1], "rescues", rescueId, "DELIVERED"),
      ]);
      for (const page of main) {
        await expect(page.locator(".timeline-item")).toHaveCount(9);
        await expect(page.locator(".timeline-item").last()).toContainText("Entregue");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
      // Dashboards and history stayed open since before publication; no reload.
      for (let i = 0; i < impact.length; i++) {
        await expect
          .poll(() => totals(impact[i]), { timeout: 15000 })
          .toEqual({
            kg: before[i].kg + weight,
            meals: before[i].meals + weight * 2,
            count: before[i].count + 1,
            week: before[i].week + weight,
          });
        await expect(history[i].getByRole("link", { name: new RegExp(title) })).toContainText(
          "Entregue",
          { timeout: 15000 },
        );
      }
      previous = { title, photoPath: upload.path };
      if (manual) await market.unroute("**/api/analyze");
      expect(errors).toEqual([]);
    }
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
