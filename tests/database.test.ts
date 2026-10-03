import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { accountData, id } from "../scripts/seed-data";
import { demoAnalysis } from "../src/lib/ai/demo-analysis";
let db: PGlite;
let batch: string;
let rescue: string;
async function actor(email: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id(`auth:${email}`)]);
  await db.exec("set role authenticated");
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;create schema auth;create schema storage;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;`,
  );
  for (const a of accountData)
    await db.query("insert into auth.users values($1,$2)", [id(`auth:${a.email}`), a.email]);
  for (const file of readdirSync("supabase/migrations")
    .filter((file) => file.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
});
afterAll(async () => {
  await db?.close();
});
describe("Fluxo real nas funções PostgreSQL e RLS", () => {
  it("seed idempotente mantém 16 métricas históricas", async () => {
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int as count from public.impact_metrics",
        )
      ).rows[0].count,
    ).toBe(16);
  });
  it("conta de outro mercado não lê lotes do Mercado Paulista nem muda papéis", async () => {
    await actor("aurora@ongsave.demo");
    expect(
      (
        await db.query("select id from public.surplus_batches where supermarket_id=$1", [
          id("mercado-paulista"),
        ])
      ).rows,
    ).toHaveLength(0);
    await expect(db.exec("update public.profiles set role='ADMIN'")).rejects.toThrow(
      /permission denied/,
    );
  });
  it("publica foto com metadados registrados pelo servidor e revisão humana", async () => {
    await db.exec("reset role;set role service_role");
    const result = await db.query<{ id: string }>(
      "select public.record_analysis($1,$2::jsonb,'demo','fixture-v1',$3) as id",
      [
        `${id("auth:mercado@ongsave.demo")}/test.jpg`,
        JSON.stringify(demoAnalysis),
        id("auth:mercado@ongsave.demo"),
      ],
    );
    await actor("mercado@ongsave.demo");
    const payload = { ...demoAnalysis, description: "Teste integrado", user_confirmed: true };
    batch = (
      await db.query<{ id: string }>("select public.publish_surplus($1::jsonb,$2) as id", [
        JSON.stringify(payload),
        result.rows[0].id,
      ])
    ).rows[0].id;
    expect(
      (
        await db.query<{ status: string }>(
          "select status from public.surplus_batches where id=$1",
          [batch],
        )
      ).rows[0].status,
    ).toBe("AVAILABLE");
    await expect(
      db.query("select public.publish_surplus($1::jsonb,$2)", [
        JSON.stringify(payload),
        result.rows[0].id,
      ]),
    ).rejects.toThrow(/já publicada/);
    await expect(
      db.query("select public.record_analysis($1,null,'openai','fake',$2)", [
        "fake",
        id("auth:mercado@ongsave.demo"),
      ]),
    ).rejects.toThrow(/permission denied/);
  });
  it("ONG vê publicação e aceite é atômico, segunda ONG não reserva o mesmo lote", async () => {
    await actor("ong@ongsave.demo");
    expect(
      (await db.query("select id from public.surplus_batches where id=$1", [batch])).rows,
    ).toHaveLength(1);
    rescue = (await db.query<{ id: string }>("select public.reserve_donation($1) as id", [batch]))
      .rows[0].id;
    await actor("saolucas@ongsave.demo");
    await expect(db.query("select public.reserve_donation($1)", [batch])).rejects.toThrow(
      /não está mais disponível/,
    );
    expect(
      (await db.query("select id from public.rescues where id=$1", [rescue])).rows,
    ).toHaveLength(0);
  });
  it("ONG pausada não pode reservar", async () => {
    // Keep the local fixture available so this assertion tests paused receiving,
    // independently of the expiry timestamp in the historical seed file.
    await db.exec("reset role");
    await db.query(
      "update public.surplus_batches set expires_at=now()+interval '1 hour' where id=$1",
      [id("batch:18")],
    );
    await actor("viver@ongsave.demo");
    await db.exec("update public.ngo_preferences set receiving_enabled=false");
    await expect(db.query("select public.reserve_donation($1)", [id("batch:18")])).rejects.toThrow(
      /capacidade/,
    );
    await db.exec("update public.ngo_preferences set receiving_enabled=true");
  });
  it("motorista aceita e concorrente perde acesso e não pode avançar", async () => {
    await actor("motorista@ongsave.demo");
    await db.query("select public.accept_mission($1)", [rescue]);
    await actor("mariana@ongsave.demo");
    await expect(db.query("select public.accept_mission($1)", [rescue])).rejects.toThrow(
      /já aceitou/,
    );
    await expect(
      db.query("select public.advance_rescue($1,'GOING_TO_PICKUP',null)", [rescue]),
    ).rejects.toThrow(/não é o motorista/);
    expect(
      (await db.query("select id from public.rescues where id=$1", [rescue])).rows,
    ).toHaveLength(0);
  });
  it("driver não lê token nem pula etapas", async () => {
    await actor("motorista@ongsave.demo");
    await expect(db.exec("select * from private.rescue_tokens")).rejects.toThrow(
      /permission denied/,
    );
    await expect(db.query("select public.delivery_token($1)", [rescue])).rejects.toThrow(
      /Código disponível/,
    );
    await expect(
      db.query("select public.advance_rescue($1,'DELIVERED','1234')", [rescue]),
    ).rejects.toThrow(/Transição/);
    for (const next of [
      "GOING_TO_PICKUP",
      "AT_PICKUP",
      "PICKED_UP",
      "IN_TRANSIT",
      "AT_DESTINATION",
    ])
      await db.query("select public.advance_rescue($1,$2::public.rescue_status,null)", [
        rescue,
        next,
      ]);
  });
  it("token errado não entrega; token da ONG finaliza com impacto único", async () => {
    await actor("ong@ongsave.demo");
    const token = (
      await db.query<{ token: string }>("select public.delivery_token($1) as token", [rescue])
    ).rows[0].token;
    expect(token).toMatch(/^\d{4}$/);
    await actor("motorista@ongsave.demo");
    const wrong = token === "0000" ? "1111" : "0000";
    expect(
      (
        await db.query<{ ok: boolean }>("select public.advance_rescue($1,'DELIVERED',$2) as ok", [
          rescue,
          wrong,
        ])
      ).rows[0].ok,
    ).toBe(false);
    expect(
      (await db.query("select id from public.impact_metrics where rescue_id=$1", [rescue])).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query<{ ok: boolean }>("select public.advance_rescue($1,'DELIVERED',$2) as ok", [
          rescue,
          token,
        ])
      ).rows[0].ok,
    ).toBe(true);
    const impact = (
      await db.query<{ food_saved_kg: string; estimated_meals: number }>(
        "select food_saved_kg,estimated_meals from public.impact_metrics where rescue_id=$1",
        [rescue],
      )
    ).rows[0];
    expect(Number(impact.food_saved_kg)).toBe(38);
    expect(impact.estimated_meals).toBe(76);
    await expect(
      db.query("select public.advance_rescue($1,'DELIVERED',$2)", [rescue, token]),
    ).rejects.toThrow(/Transição/);
  });
  it("reset restrito restaura as oportunidades e preserva métricas seed", async () => {
    await actor("ong@ongsave.demo");
    await expect(
      db.query("select public.reset_demo($1)", [id("auth:mercado@ongsave.demo")]),
    ).rejects.toThrow(/permission denied/);
    await db.exec("reset role;set role service_role");
    await db.query("select public.reset_demo($1)", [id("auth:mercado@ongsave.demo")]);
    await db.exec("reset role");
    expect(
      (await db.query("select id from public.rescues where id=$1", [rescue])).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int as count from public.impact_metrics",
        )
      ).rows[0].count,
    ).toBe(16);
    expect(
      (await db.query("select id from public.rescues where status='WAITING_DRIVER'")).rows,
    ).toHaveLength(3);
  });
});
