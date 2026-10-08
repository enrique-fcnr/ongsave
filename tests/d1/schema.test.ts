import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb } from "./helpers";
import { guard, GuardError, runAtomic, type Db } from "../../src/server/db/client";
import { impactForWeight } from "../../src/server/db/impact";
import { saoPauloClock, saoPauloDay } from "../../src/server/db/time";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let db: Db;
const org = (id: string, type = "SUPERMARKET") =>
  ctx.d1
    .prepare(
      "INSERT INTO organizations(id,name,type,slug,address_line,neighborhood,latitude,longitude) VALUES(?,?,?,?,?,?,?,?)",
    )
    .bind(id, id, type, id, "Rua A, 1", "Centro", -23.5, -46.6);
const authUser = (id: string) =>
  ctx.d1
    .prepare("INSERT INTO user(id,name,email) VALUES(?,?,?)")
    .bind(`auth-${id}`, id, `${id}@test`);
const profile = (id: string, role = "SUPERMARKET") =>
  ctx.d1
    .prepare("INSERT INTO profiles(id,auth_user_id,name,email,role) VALUES(?,?,?,?,?)")
    .bind(id, `auth-${id}`, id, `${id}@test`, role);
const batch = (id: string, overrides: Record<string, unknown> = {}) => {
  const row = {
    id,
    supermarket_id: "m1",
    created_by: "p1",
    title: "Lote",
    category: "produce",
    estimated_weight_kg: 10,
    visual_condition: "acceptable",
    pickup_priority: "high",
    recommended_pickup_hours: 8,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    user_confirmed: 1,
    ...overrides,
  };
  const keys = Object.keys(row);
  return ctx.d1
    .prepare(
      `INSERT INTO surplus_batches(${keys.join(",")}) VALUES(${keys.map(() => "?").join(",")})`,
    )
    .bind(...Object.values(row));
};

beforeAll(async () => {
  ctx = await createTestDb();
  db = ctx.db;
  await ctx.d1.batch([
    authUser("p1"),
    authUser("p2"),
    authUser("bad"),
    org("m1"),
    org("n1", "NGO"),
    org("n2", "NGO"),
    profile("p1"),
    profile("p2", "NGO"),
  ]);
});
afterAll(async () => ctx?.dispose());

describe("Schema D1", () => {
  it("aplica a migration com todas as tabelas", async () => {
    const { results } = await ctx.d1
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '\\_%' ESCAPE '\\' AND name NOT LIKE 'sqlite%' ORDER BY name",
      )
      .all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual(
      expect.arrayContaining([
        "analyses",
        "donation_reservations",
        "drivers",
        "impact_metrics",
        "ngo_preferences",
        "notifications",
        "organization_members",
        "organizations",
        "profiles",
        "rescue_events",
        "rescue_tokens",
        "rescues",
        "surplus_batches",
        "surplus_items",
      ]),
    );
  });

  it("CHECKs rejeitam valores inválidos", async () => {
    await expect(profile("bad", "OWNER").run()).rejects.toThrow(/CHECK constraint failed/);
    await expect(org("bad-org", "DRIVER").run()).rejects.toThrow(/CHECK constraint failed/);
    await expect(batch("b-weight", { estimated_weight_kg: 0 }).run()).rejects.toThrow(/CHECK/);
    await expect(batch("b-weight2", { estimated_weight_kg: 5001 }).run()).rejects.toThrow(/CHECK/);
    await expect(batch("b-cat", { category: "toys" }).run()).rejects.toThrow(/CHECK/);
    await expect(batch("b-status", { status: "LOST" }).run()).rejects.toThrow(/CHECK/);
    await expect(batch("b-hours", { recommended_pickup_hours: 73 }).run()).rejects.toThrow(/CHECK/);
    await expect(batch("b-confirm", { user_confirmed: 0 }).run()).rejects.toThrow(/CHECK/);
    await expect(batch("b-seed", { seed_kind: "OTHER" }).run()).rejects.toThrow(/CHECK/);
    await expect(
      ctx.d1
        .prepare(
          "INSERT INTO ngo_preferences(id,organization_id,receiving_start,receiving_end) VALUES('x','n1','22:00','07:00')",
        )
        .run(),
    ).rejects.toThrow(/CHECK/);
    await expect(
      ctx.d1
        .prepare(
          "INSERT INTO ngo_preferences(id,organization_id,daily_capacity_kg) VALUES('y','n1',0)",
        )
        .run(),
    ).rejects.toThrow(/CHECK/);
    await batch("b-ok").run();
    await ctx.d1
      .prepare(
        "INSERT INTO rescues(id,batch_id,supermarket_id,ngo_id,pickup_address,pickup_latitude,pickup_longitude,delivery_address,delivery_latitude,delivery_longitude,mock_distance_km,mock_eta_minutes,mock_route_geometry) VALUES('r-ok','b-ok','m1','n1','a',0,0,'b',0,0,1,14,'[]')",
      )
      .run();
    await expect(
      ctx.d1
        .prepare("INSERT INTO rescue_tokens(rescue_id,confirmation_token) VALUES('r-ok','12a4')")
        .run(),
    ).rejects.toThrow(/CHECK/);
    await expect(
      ctx.d1
        .prepare("INSERT INTO rescue_tokens(rescue_id,confirmation_token) VALUES('r-ok','123')")
        .run(),
    ).rejects.toThrow(/CHECK/);
    await ctx.d1
      .prepare("INSERT INTO rescue_tokens(rescue_id,confirmation_token) VALUES('r-ok','0042')")
      .run();
  });

  it("UNIQUE de batch_id impede reserva e rescue duplicados", async () => {
    await batch("b-unique").run();
    const reserve = (id: string, ngo: string) =>
      ctx.d1
        .prepare(
          "INSERT INTO donation_reservations(id,batch_id,ngo_id,accepted_by) VALUES(?,?,?,?)",
        )
        .bind(id, "b-unique", ngo, "p2");
    await reserve("res-1", "n1").run();
    await expect(reserve("res-2", "n2").run()).rejects.toThrow(/UNIQUE constraint failed/);
    const rescue = (id: string, ngo: string) =>
      ctx.d1
        .prepare(
          "INSERT INTO rescues(id,batch_id,supermarket_id,ngo_id,pickup_address,pickup_latitude,pickup_longitude,delivery_address,delivery_latitude,delivery_longitude,mock_distance_km,mock_eta_minutes,mock_route_geometry) VALUES(?,?,?,?,'a',0,0,'b',0,0,1,14,'[]')",
        )
        .bind(id, "b-unique", "m1", ngo);
    await rescue("r-1", "n1").run();
    await expect(rescue("r-2", "n2").run()).rejects.toThrow(/UNIQUE constraint failed/);
  });

  it("chaves estrangeiras com cascade valem no D1", async () => {
    await expect(batch("b-fk", { supermarket_id: "nope" }).run()).rejects.toThrow(/FOREIGN KEY/);
    await ctx.d1.prepare("DELETE FROM surplus_batches WHERE id='b-ok'").run();
    const left = await ctx.d1
      .prepare("SELECT count(*) AS n FROM rescue_tokens WHERE rescue_id='r-ok'")
      .first<{ n: number }>();
    expect(left?.n).toBe(0);
  });

  it("guarda de batch aborta tudo e informa a regra violada", async () => {
    const before = await ctx.d1
      .prepare("SELECT count(*) AS n FROM surplus_batches")
      .first<{ n: number }>();
    await expect(
      runAtomic(db, [batch("b-guard"), guard(db, "unavailable", "1 = ?", 2)]),
    ).rejects.toEqual(new GuardError("unavailable"));
    const after = await ctx.d1
      .prepare("SELECT count(*) AS n FROM surplus_batches")
      .first<{ n: number }>();
    expect(after?.n).toBe(before?.n);
    await runAtomic(db, [batch("b-guard"), guard(db, "unavailable", "1 = ?", 1)]);
    const empty = await ctx.d1
      .prepare("SELECT count(*) AS n FROM batch_guards")
      .first<{ n: number }>();
    expect(empty?.n).toBe(0);
  });
});

describe("impactForWeight", () => {
  // Valores de private.impact_for_weight(numeric) no PostgreSQL.
  it.each([
    [
      10,
      {
        food_saved_kg: 10,
        estimated_meals: 20,
        estimated_disposal_savings: 77.2,
        estimated_co2_avoided_kg: 14.3,
        estimated_water_saved_liters: 2500,
      },
    ],
    [
      23,
      {
        food_saved_kg: 23,
        estimated_meals: 46,
        estimated_disposal_savings: 177.56,
        estimated_co2_avoided_kg: 32.89,
        estimated_water_saved_liters: 5750,
      },
    ],
    [
      100,
      {
        food_saved_kg: 100,
        estimated_meals: 200,
        estimated_disposal_savings: 772,
        estimated_co2_avoided_kg: 143,
        estimated_water_saved_liters: 25000,
      },
    ],
    [
      12.5,
      {
        food_saved_kg: 12.5,
        estimated_meals: 25,
        estimated_disposal_savings: 96.5,
        estimated_co2_avoided_kg: 17.88,
        estimated_water_saved_liters: 3125,
      },
    ],
  ])("%s kg", (kg, expected) => {
    expect(impactForWeight(kg)).toEqual(expected);
  });
});

describe("Relógio operacional em São Paulo", () => {
  it("converte hora e limites do dia local", () => {
    const at = new Date("2026-10-08T02:30:00.000Z"); // 23:30 de 07/10 em São Paulo
    expect(saoPauloClock(at)).toBe("23:30:00");
    expect(saoPauloDay(at)).toEqual({
      start: "2026-10-07T03:00:00.000Z",
      end: "2026-10-08T03:00:00.000Z",
    });
  });
});
