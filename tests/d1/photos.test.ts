import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb } from "./helpers";
import { seedDemo } from "./seed";
import { id } from "../../scripts/seed-data";

// Route handlers read bindings through getCloudflareContext(); point it at the local proxy.
const binding: { env?: CloudflareEnv } = {};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: binding.env }),
}));
vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-with-at-least-32-characters!");
vi.stubEnv("BETTER_AUTH_URL", "http://localhost:8787");

const { GET } = await import("../../src/app/api/photos/[...key]/route");
const { POST: upload } = await import("../../src/app/api/upload/route");
const { getAuth } = await import("../../src/server/auth");
const { loadActor } = await import("../../src/server/permissions");
const { uploadPhoto, deletePhotos } = await import("../../src/server/storage");

let ctx: Awaited<ReturnType<typeof createTestDb>>;
const base = "http://localhost:8787";
const jpeg = readFileSync("e2e/fixtures/vegetables.jpg");
let photo: string;

async function cookie(email: string) {
  const response = await getAuth().api.signInEmail({
    body: { email, password: "demo123" },
    headers: new Headers({ origin: base }),
    asResponse: true,
  });
  return response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}
const read = async (key: string, email?: string) =>
  GET(
    new Request(`${base}/api/photos/${key}`, {
      headers: email ? { cookie: await cookie(email) } : {},
    }),
    {
      params: Promise.resolve({ key: key.split("/") }),
    },
  );
const send = async (email: string, file: File) => {
  const form = new FormData();
  form.set("file", file);
  return upload(
    new Request(`${base}/api/upload`, {
      method: "POST",
      body: form,
      headers: { cookie: await cookie(email), origin: base },
    }),
  );
};

beforeAll(async () => {
  ctx = await createTestDb();
  binding.env = ctx.env;
  await seedDemo(ctx.d1);
});
afterAll(async () => ctx?.dispose());

describe("Fotos no R2", () => {
  it("mercado envia JPEG: objeto privado no R2 e análise manual registrada pelo servidor", async () => {
    const response = await send(
      "mercado@ongsave.demo",
      new File([jpeg], "x.jpg", { type: "image/jpeg" }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { path: string; analysisId: string };
    expect(body.path).toMatch(
      new RegExp(`^${id("auth:mercado@ongsave.demo")}/[0-9a-f-]{36}\\.jpeg$`),
    );
    photo = body.path;
    const object = await ctx.env.PHOTOS.head(photo);
    expect(object?.httpMetadata?.contentType).toBe("image/jpeg");
    const analysis = await ctx.d1
      .prepare("SELECT provider, model, image_url FROM analyses WHERE id=?")
      .bind(body.analysisId)
      .first();
    expect(analysis).toEqual({ provider: "manual", model: "human-review", image_url: photo });
  });

  it("rejeita arquivo que não é imagem, mesmo com tipo image/jpeg declarado", async () => {
    const fake = new File([new TextEncoder().encode("<html>não é uma foto</html>")], "x.jpg", {
      type: "image/jpeg",
    });
    const response = await send("mercado@ongsave.demo", fake);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Formato não suportado. Use JPEG, PNG ou WebP.",
    });
  });

  it("rejeita arquivo acima de 4 MB", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 1);
    big.set([0xff, 0xd8]);
    const response = await send("mercado@ongsave.demo", new File([big], "big.jpg"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Escolha uma foto JPEG, PNG ou WebP de até 4 MB.",
    });
  });

  it("ONG e motorista não enviam fotos", async () => {
    const response = await send("ong@ongsave.demo", new File([jpeg], "x.jpg"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Seu perfil não pode realizar esta ação." });
  });

  it("leitura: sem sessão 401, outro mercado 403, dono e ONG que vê o lote 200", async () => {
    await ctx.d1
      .prepare(
        "INSERT INTO surplus_batches(id,supermarket_id,created_by,title,category,image_url,estimated_weight_kg,visual_condition,pickup_priority,recommended_pickup_hours,expires_at,user_confirmed) VALUES('photo-batch',?,?,'Lote com foto','produce',?,10,'acceptable','high',8,?,1)",
      )
      .bind(
        id("mercado-paulista"),
        id("profile:mercado@ongsave.demo"),
        photo,
        new Date(Date.now() + 3600000).toISOString(),
      )
      .run();
    expect((await read(photo)).status).toBe(401);
    expect((await read(photo, "aurora@ongsave.demo")).status).toBe(403);
    expect((await read(photo, "motorista@ongsave.demo")).status).toBe(403);
    const owner = await read(photo, "mercado@ongsave.demo");
    expect(owner.status).toBe(200);
    const ngo = await read(photo, "ong@ongsave.demo");
    expect(ngo.status).toBe(200);
    expect(ngo.headers.get("cache-control")).toBe("private, max-age=3600");
    expect(ngo.headers.get("content-type")).toBe("image/jpeg");
    expect(new Uint8Array(await ngo.arrayBuffer())).toEqual(new Uint8Array(jpeg));
  });

  it("limpeza apaga só a pasta pedida, em lotes", async () => {
    const actor = (await loadActor(ctx.db, id("auth:mercado@ongsave.demo")))!;
    for (let i = 0; i < 3; i++)
      await uploadPhoto(ctx.db, ctx.env.PHOTOS, actor, new File([jpeg], "x.jpg"));
    await ctx.env.PHOTOS.put(`${id("auth:aurora@ongsave.demo")}/keep.jpeg`, jpeg);
    expect(await deletePhotos(ctx.env.PHOTOS, `${id("auth:mercado@ongsave.demo")}/`)).toBe(4);
    expect(
      (await ctx.env.PHOTOS.list({ prefix: `${id("auth:mercado@ongsave.demo")}/` })).objects,
    ).toHaveLength(0);
    expect(await ctx.env.PHOTOS.head(`${id("auth:aurora@ongsave.demo")}/keep.jpeg`)).not.toBeNull();
  });
});
