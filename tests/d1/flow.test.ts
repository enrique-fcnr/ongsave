import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb } from "./helpers";
import { seedDemo } from "./seed";
import { id } from "../../scripts/seed-data";
import { demoAnalysis } from "../../src/lib/ai/demo-analysis";
import { loadActor, type Actor } from "../../src/server/permissions";
import { availableBatches, batchDetail, rescueDetail, rescueList } from "../../src/server/queries";
import { recordAnalysis } from "../../src/server/services/analysis";
import { updateOwnProfile } from "../../src/server/services/profile";
import { resetDemo } from "../../src/server/services/demo";
import {
  acceptMission,
  advanceRescue,
  deliveryToken,
  markNotificationRead,
  publishSurplus,
  reserveDonation,
} from "../../src/server/services/rescue";
import { createDb, type Db } from "../../src/server/db/client";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let db: Db;
let batch: string;
let rescue: string;
const actor = async (email: string) => (await loadActor(db, id(`auth:${email}`))) as Actor;
const count = async (query: string, ...params: unknown[]) =>
  (await ctx.d1
    .prepare(`SELECT count(*) AS n FROM ${query}`)
    .bind(...params)
    .first<{ n: number }>())!.n;
const payload = {
  ...demoAnalysis,
  description: "Teste integrado",
  user_confirmed: true as const,
};
async function publish(email = "mercado@ongsave.demo", weight = 38) {
  const market = await actor(email);
  const analysisId = await recordAnalysis(
    db,
    market,
    `${market.authUserId}/t-${crypto.randomUUID()}.jpg`,
    demoAnalysis,
    "demo",
    "fixture-v1",
  );
  return publishSurplus(
    db,
    market,
    { ...payload, estimated_weight_kg: weight, estimated_weight_range: undefined } as never,
    analysisId,
  );
}
const STEPS = [
  "GOING_TO_PICKUP",
  "AT_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_DESTINATION",
] as const;

beforeAll(async () => {
  vi.stubEnv("ENABLE_DEMO_MODE", "true");
  ctx = await createTestDb();
  db = ctx.db;
  await seedDemo(ctx.d1);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await ctx?.dispose();
});

describe("Fluxo completo nos services D1 (porte de tests/database.test.ts)", () => {
  it("seed idempotente mantém 16 métricas históricas", async () => {
    await seedDemo(ctx.d1);
    expect(await count("impact_metrics")).toBe(16);
  });

  it("outro mercado não lê lotes do Mercado Paulista e ninguém muda o próprio papel", async () => {
    const aurora = await actor("aurora@ongsave.demo");
    const rescues = await rescueList(db, aurora, { supermarketId: id("mercado-paulista") });
    expect(rescues).toHaveLength(0);
    const own = await rescueList(db, aurora);
    expect(own.every((r) => r.supermarket_id === id("supermercado-aurora"))).toBe(true);
    await expect(
      updateOwnProfile(db, aurora, {
        profile: { name: "Equipe Aurora", phone: "" },
        role: "ADMIN",
      } as never),
    ).rejects.toThrow();
    await expect(
      updateOwnProfile(db, aurora, { profile: { name: "X", phone: "", role: "ADMIN" } } as never),
    ).rejects.toThrow();
    const row = await ctx.d1
      .prepare("SELECT role FROM profiles WHERE email='aurora@ongsave.demo'")
      .first<{ role: string }>();
    expect(row?.role).toBe("SUPERMARKET");
  });

  it("publica foto com metadados do servidor; segunda publicação da mesma foto falha", async () => {
    const market = await actor("mercado@ongsave.demo");
    const analysisId = await recordAnalysis(
      db,
      market,
      `${market.authUserId}/test.jpg`,
      demoAnalysis,
      "demo",
      "fixture-v1",
    );
    batch = await publishSurplus(db, market, payload, analysisId);
    const row = await ctx.d1
      .prepare(
        "SELECT status, ai_provider, ai_model, is_demo, estimated_impact_json FROM surplus_batches WHERE id=?",
      )
      .bind(batch)
      .first<Record<string, unknown>>();
    expect(row).toMatchObject({
      status: "AVAILABLE",
      ai_provider: "demo",
      ai_model: "fixture-v1",
      is_demo: 1,
    });
    expect(JSON.parse(row!.estimated_impact_json as string).estimated_meals).toBe(76);
    expect(await count("surplus_items WHERE batch_id=?", batch)).toBe(4);
    expect(
      await count(
        "notifications WHERE type='BATCH_AVAILABLE' AND json_extract(metadata,'$.batch_id')=?",
        batch,
      ),
    ).toBe(4);
    await expect(publishSurplus(db, market, payload, analysisId)).rejects.toThrow(/já publicada/);
    const ngo = await actor("ong@ongsave.demo");
    await expect(
      recordAnalysis(db, ngo, `${ngo.authUserId}/x.jpg`, null, "openai", "fake"),
    ).rejects.toThrow("Perfil não autorizado");
    await expect(
      recordAnalysis(db, market, "outro-usuario/x.jpg", null, "manual", "human-review"),
    ).rejects.toThrow("Imagem não pertence ao usuário");
    await expect(publishSurplus(db, ngo, payload, analysisId)).rejects.toThrow(
      "Apenas supermercados publicam excedentes",
    );
  });

  it("ONG vê a publicação; aceite cria resgate e segunda ONG não reserva o mesmo lote", async () => {
    const ong = await actor("ong@ongsave.demo");
    expect((await availableBatches(db, ong, new Date())).map((b) => b.id)).toContain(batch);
    rescue = await reserveDonation(db, ong, batch);
    expect(await count("rescue_tokens WHERE rescue_id=?", rescue)).toBe(1);
    expect(await count("rescue_events WHERE rescue_id=?", rescue)).toBe(2);
    expect(
      await count(
        "notifications WHERE type='MISSION_AVAILABLE' AND json_extract(metadata,'$.rescue_id')=?",
        rescue,
      ),
    ).toBe(3);
    const saoLucas = await actor("saolucas@ongsave.demo");
    await expect(reserveDonation(db, saoLucas, batch)).rejects.toThrow(/não está mais disponível/);
    expect(await rescueDetail(db, saoLucas, rescue)).toBeNull();
    expect(await batchDetail(db, saoLucas, batch, new Date())).toBeNull();
    await expect(reserveDonation(db, await actor("motorista@ongsave.demo"), batch)).rejects.toThrow(
      "Apenas ONGs podem aceitar doações",
    );
  });

  it("ONG pausada não pode reservar", async () => {
    const viver = await actor("viver@ongsave.demo");
    await updateOwnProfile(db, viver, {
      profile: { name: "Equipe Projeto Viver", phone: "" },
      preferences: { receiving_enabled: false },
    });
    await expect(reserveDonation(db, viver, id("batch:18"))).rejects.toThrow(/capacidade/);
    await updateOwnProfile(db, viver, {
      profile: { name: "Equipe Projeto Viver", phone: "" },
      preferences: { receiving_enabled: true },
    });
  });

  it("motorista aceita; concorrente perde acesso e não avança; ONG não altera status", async () => {
    await acceptMission(db, await actor("motorista@ongsave.demo"), rescue);
    const mariana = await actor("mariana@ongsave.demo");
    await expect(acceptMission(db, mariana, rescue)).rejects.toThrow(/já aceitou/);
    await expect(advanceRescue(db, mariana, rescue, "GOING_TO_PICKUP")).rejects.toThrow(
      /não é o motorista/,
    );
    expect(await rescueDetail(db, mariana, rescue)).toBeNull();
    await expect(
      advanceRescue(db, await actor("ong@ongsave.demo"), rescue, "GOING_TO_PICKUP"),
    ).rejects.toThrow(/não é o motorista/);
    const events = (await rescueDetail(db, await actor("ong@ongsave.demo"), rescue))!.events;
    expect(events.at(-1)).toMatchObject({
      status: "DRIVER_ASSIGNED",
      metadata: { driver_name: "Lucas Almeida" },
    });
  });

  it("motorista não lê o token nem pula etapas; o resgate não carrega o token", async () => {
    const lucas = await actor("motorista@ongsave.demo");
    await expect(deliveryToken(db, lucas, rescue)).rejects.toThrow(/Código disponível/);
    await expect(deliveryToken(db, await actor("ong@ongsave.demo"), rescue)).rejects.toThrow(
      /Código disponível/,
    );
    await expect(advanceRescue(db, lucas, rescue, "DELIVERED", "1234")).rejects.toThrow(
      /Transição/,
    );
    await expect(advanceRescue(db, lucas, rescue, "AT_PICKUP")).rejects.toThrow(/Transição/);
    for (const next of STEPS) expect(await advanceRescue(db, lucas, rescue, next)).toBe(true);
    const detail = await rescueDetail(db, lucas, rescue);
    expect(JSON.stringify(detail)).not.toMatch(/confirmation_token/);
  });

  it("token errado não entrega; token da ONG finaliza com impacto único", async () => {
    const token = (await deliveryToken(db, await actor("ong@ongsave.demo"), rescue))!;
    expect(token).toMatch(/^\d{4}$/);
    await expect(deliveryToken(db, await actor("saolucas@ongsave.demo"), rescue)).rejects.toThrow(
      /Código disponível/,
    );
    const lucas = await actor("motorista@ongsave.demo");
    const wrong = token === "0000" ? "1111" : "0000";
    expect(await advanceRescue(db, lucas, rescue, "DELIVERED", wrong)).toBe(false);
    expect(await count("impact_metrics WHERE rescue_id=?", rescue)).toBe(0);
    expect(await advanceRescue(db, lucas, rescue, "DELIVERED", token)).toBe(true);
    const impact = await ctx.d1
      .prepare("SELECT food_saved_kg, estimated_meals FROM impact_metrics WHERE rescue_id=?")
      .bind(rescue)
      .first<{ food_saved_kg: number; estimated_meals: number }>();
    expect(impact).toEqual({ food_saved_kg: 38, estimated_meals: 76 });
    await expect(advanceRescue(db, lucas, rescue, "DELIVERED", token)).rejects.toThrow(/Transição/);
    expect(await count("impact_metrics WHERE rescue_id=?", rescue)).toBe(1);
    const statuses = await ctx.d1
      .prepare(
        "SELECT (SELECT status FROM surplus_batches WHERE id=?) b, (SELECT status FROM donation_reservations WHERE batch_id=?) r",
      )
      .bind(batch, batch)
      .first();
    expect(statuses).toEqual({ b: "DELIVERED", r: "COMPLETED" });
  });

  it("notificação só é marcada como lida pelo dono", async () => {
    const ong = await actor("ong@ongsave.demo");
    const mine = await ctx.d1
      .prepare("SELECT id FROM notifications WHERE profile_id=? LIMIT 1")
      .bind(ong.profileId)
      .first<{ id: string }>();
    await markNotificationRead(db, await actor("saolucas@ongsave.demo"), mine!.id);
    expect(await count("notifications WHERE id=? AND read_at IS NOT NULL", mine!.id)).toBe(0);
    await markNotificationRead(db, ong, mine!.id);
    expect(await count("notifications WHERE id=? AND read_at IS NOT NULL", mine!.id)).toBe(1);
  });

  it("reset restrito restaura as oportunidades e preserva métricas seed", async () => {
    await expect(resetDemo(db, await actor("ong@ongsave.demo"))).rejects.toThrow(/conta oficial/);
    await expect(resetDemo(db, await actor("aurora@ongsave.demo"))).rejects.toThrow(
      /conta oficial/,
    );
    await resetDemo(db, await actor("mercado@ongsave.demo"));
    expect(await count("rescues WHERE id=?", rescue)).toBe(0);
    expect(await count("surplus_batches WHERE id=?", batch)).toBe(0);
    expect(await count("impact_metrics")).toBe(16);
    expect(await count("rescues WHERE status='WAITING_DRIVER'")).toBe(3);
    expect(await count("surplus_batches WHERE status='AVAILABLE'")).toBe(4);
    expect(await count("analyses")).toBe(0);
  });
});

describe("Concorrência: só uma chamada vence", () => {
  it("dupla reserva simultânea do mesmo lote", async () => {
    const target = await publish();
    const results = await Promise.allSettled([
      reserveDonation(db, await actor("ong@ongsave.demo"), target),
      reserveDonation(db, await actor("saolucas@ongsave.demo"), target),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(failed.reason.message).toBe("Esta doação não está mais disponível");
    expect(await count("rescues WHERE batch_id=?", target)).toBe(1);
    expect(await count("donation_reservations WHERE batch_id=?", target)).toBe(1);
  });

  it("dois motoristas aceitam a mesma missão ao mesmo tempo", async () => {
    const mission = (await ctx.d1
      .prepare("SELECT id FROM rescues WHERE status='WAITING_DRIVER' LIMIT 1")
      .first<{ id: string }>())!.id;
    const results = await Promise.allSettled([
      acceptMission(db, await actor("mariana@ongsave.demo"), mission),
      acceptMission(db, await actor("rafael@ongsave.demo"), mission),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.message,
    ).toBe("Outro motorista já aceitou esta missão");
    expect(
      await count("rescue_events WHERE rescue_id=? AND status='DRIVER_ASSIGNED'", mission),
    ).toBe(1);
  });

  it("mesmo motorista não pega duas missões ao mesmo tempo", async () => {
    const [a, b] = (
      await ctx.d1
        .prepare("SELECT id FROM rescues WHERE status='WAITING_DRIVER' LIMIT 2")
        .all<{ id: string }>()
    ).results;
    const lucas = await actor("motorista@ongsave.demo");
    const results = await Promise.allSettled([
      acceptMission(db, lucas, a.id),
      acceptMission(db, lucas, b.id),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.message,
    ).toBe("Conclua sua missão atual primeiro");
    expect(
      await count(
        "rescues WHERE driver_id=? AND status NOT IN ('DELIVERED','CANCELLED')",
        lucas.driverId,
      ),
    ).toBe(1);
  });

  it("a mesma foto publicada duas vezes ao mesmo tempo gera um lote só", async () => {
    const market = await actor("mercado@ongsave.demo");
    const analysisId = await recordAnalysis(
      db,
      market,
      `${market.authUserId}/dup.jpg`,
      demoAnalysis,
      "demo",
      "fixture-v1",
    );
    const results = await Promise.allSettled([
      publishSurplus(db, market, payload, analysisId),
      publishSurplus(db, market, payload, analysisId),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await count("surplus_batches WHERE image_url=?", `${market.authUserId}/dup.jpg`)).toBe(
      1,
    );
  });

  it("dois avanços simultâneos da mesma etapa: um só evento", async () => {
    await resetDemo(db, await actor("mercado@ongsave.demo"));
    const lucas = await actor("motorista@ongsave.demo");
    const mission = (await ctx.d1
      .prepare("SELECT id FROM rescues WHERE status='WAITING_DRIVER' LIMIT 1")
      .first<{ id: string }>())!.id;
    await acceptMission(db, lucas, mission);
    const results = await Promise.allSettled([
      advanceRescue(db, lucas, mission, "GOING_TO_PICKUP"),
      advanceRescue(db, lucas, mission, "GOING_TO_PICKUP"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      await count("rescue_events WHERE rescue_id=? AND status='GOING_TO_PICKUP'", mission),
    ).toBe(1);
  });
});

describe("Capacidades, horário e bloqueio do código", () => {
  it("capacidade diária da ONG soma os resgates do dia em São Paulo", async () => {
    await resetDemo(db, await actor("mercado@ongsave.demo"));
    const ong = await actor("ong@ongsave.demo");
    await updateOwnProfile(db, ong, {
      profile: { name: "Equipe Instituto Esperança", phone: "" },
      preferences: { daily_capacity_kg: 60 },
    });
    const first = await publish("mercado@ongsave.demo", 40);
    const second = await publish("mercado@ongsave.demo", 30);
    await reserveDonation(db, ong, first);
    await expect(reserveDonation(db, ong, second)).rejects.toThrow(
      "Confira a capacidade e as preferências de recebimento",
    );
    // Ao mesmo tempo, duas reservas que cabem sozinhas mas não juntas: só uma passa.
    await updateOwnProfile(db, ong, {
      profile: { name: "Equipe Instituto Esperança", phone: "" },
      preferences: { daily_capacity_kg: 90 },
    });
    const third = await publish("mercado@ongsave.demo", 30);
    const results = await Promise.allSettled([
      reserveDonation(db, ong, second),
      reserveDonation(db, ong, third),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.message,
    ).toBe("Confira a capacidade e as preferências de recebimento");
  });

  it("categoria não aceita e horário de recebimento", async () => {
    await resetDemo(db, await actor("mercado@ongsave.demo"));
    const ong = await actor("ong@ongsave.demo");
    const name = { name: "Equipe Instituto Esperança", phone: "" };
    await updateOwnProfile(db, ong, {
      profile: name,
      preferences: { accepted_categories: ["bakery"] },
    });
    const produce = await publish();
    await expect(reserveDonation(db, ong, produce)).rejects.toThrow(/capacidade e as preferências/);
    await updateOwnProfile(db, ong, {
      profile: name,
      preferences: {
        accepted_categories: ["produce"],
        receiving_start: "09:00",
        receiving_end: "18:00",
      },
    });
    // 07:30 e 20:00 em São Paulo (UTC-3) ficam fora; 12:00 dentro.
    await expect(
      reserveDonation(db, ong, produce, new Date("2026-10-08T10:30:00Z")),
    ).rejects.toThrow("Instituição fora do horário de recebimento");
    await expect(
      reserveDonation(db, ong, produce, new Date("2026-10-08T23:00:00Z")),
    ).rejects.toThrow("Instituição fora do horário de recebimento");
  });

  it("capacidade do veículo e motorista indisponível", async () => {
    await resetDemo(db, await actor("mercado@ongsave.demo"));
    const lucas = await actor("motorista@ongsave.demo"); // Fiorino, 180 kg
    const heavy = await publish("mercado@ongsave.demo", 200);
    const mission = await reserveDonation(db, await actor("ong@ongsave.demo"), heavy);
    await expect(acceptMission(db, lucas, mission)).rejects.toThrow(
      "Veículo indisponível ou capacidade insuficiente",
    );
    const rafael = await actor("rafael@ongsave.demo"); // 300 kg
    await updateOwnProfile(db, rafael, {
      profile: { name: "Rafael Santos", phone: "" },
      driver: { availability: false },
    });
    await expect(acceptMission(db, rafael, mission)).rejects.toThrow(
      "Veículo indisponível ou capacidade insuficiente",
    );
    await updateOwnProfile(db, rafael, {
      profile: { name: "Rafael Santos", phone: "" },
      driver: { availability: true },
    });
    await acceptMission(db, rafael, mission);
  });

  it("após 5 códigos errados bloqueia por 1 minuto, sem gerar impacto", async () => {
    await resetDemo(db, await actor("mercado@ongsave.demo"));
    const lucas = await actor("motorista@ongsave.demo");
    const mission = (await ctx.d1
      .prepare("SELECT id FROM rescues WHERE status='WAITING_DRIVER' LIMIT 1")
      .first<{ id: string }>())!.id;
    await acceptMission(db, lucas, mission);
    for (const next of STEPS) await advanceRescue(db, lucas, mission, next);
    const token = (await deliveryToken(db, await actor(await ngoEmailOf(mission)), mission))!;
    const wrong = token === "0000" ? "1111" : "0000";
    const t0 = new Date();
    for (let i = 0; i < 5; i++)
      expect(await advanceRescue(db, lucas, mission, "DELIVERED", wrong, t0)).toBe(false);
    await expect(
      advanceRescue(db, lucas, mission, "DELIVERED", token, new Date(t0.getTime() + 30000)),
    ).rejects.toThrow("Muitas tentativas. Aguarde 1 minuto");
    expect(await count("impact_metrics WHERE rescue_id=?", mission)).toBe(0);
    expect(
      await advanceRescue(db, lucas, mission, "DELIVERED", token, new Date(t0.getTime() + 61000)),
    ).toBe(true);
    expect(await count("impact_metrics WHERE rescue_id=?", mission)).toBe(1);
  });
});

async function ngoEmailOf(rescueId: string) {
  const row = await ctx.d1
    .prepare(
      "SELECT p.email FROM rescues r JOIN organization_members m ON m.organization_id=r.ngo_id JOIN profiles p ON p.id=m.profile_id WHERE r.id=?",
    )
    .bind(rescueId)
    .first<{ email: string }>();
  return row!.email;
}

// Holds every batch() until `n` callers reached it: both requests have already read and
// validated the same state, so only the guards inside the batch can stop the second one.
function withBarrier(n: number) {
  let arrived = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => (release = resolve));
  const d1 = new Proxy(ctx.d1, {
    get(target, key) {
      if (key === "batch")
        return async (statements: D1PreparedStatement[]) => {
          if (++arrived >= n) release();
          await ready;
          return target.batch(statements);
        };
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return createDb(d1);
}

describe("Guardas do batch com leituras simultâneas garantidas", () => {
  it("reserva: as duas ONGs passam na validação, só uma grava", async () => {
    await resetDemo(db, await actor("mercado@ongsave.demo"));
    const target = await publish();
    const racing = withBarrier(2);
    const results = await Promise.allSettled([
      reserveDonation(racing, await actor("ong@ongsave.demo"), target),
      reserveDonation(racing, await actor("saolucas@ongsave.demo"), target),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.message,
    ).toBe("Esta doação não está mais disponível");
    expect(await count("rescues WHERE batch_id=?", target)).toBe(1);
    expect(await count("batch_guards")).toBe(0);
  });

  it("missão: os dois motoristas passam na validação, só um grava", async () => {
    const mission = (await ctx.d1
      .prepare("SELECT id FROM rescues WHERE status='WAITING_DRIVER' LIMIT 1")
      .first<{ id: string }>())!.id;
    const racing = withBarrier(2);
    const results = await Promise.allSettled([
      acceptMission(racing, await actor("mariana@ongsave.demo"), mission),
      acceptMission(racing, await actor("rafael@ongsave.demo"), mission),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.message,
    ).toBe("Outro motorista já aceitou esta missão");
  });

  it("capacidade diária: duas reservas que só cabem sozinhas", async () => {
    await resetDemo(db, await actor("mercado@ongsave.demo"));
    const ong = await actor("ong@ongsave.demo");
    await updateOwnProfile(db, ong, {
      profile: { name: "Equipe Instituto Esperança", phone: "" },
      preferences: { daily_capacity_kg: 50 },
    });
    const a = await publish("mercado@ongsave.demo", 30);
    const b = await publish("mercado@ongsave.demo", 30);
    const racing = withBarrier(2);
    const results = await Promise.allSettled([
      reserveDonation(racing, ong, a),
      reserveDonation(racing, ong, b),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.message,
    ).toBe("Confira a capacidade e as preferências de recebimento");
  });

  it("motorista com duas missões ao mesmo tempo", async () => {
    await resetDemo(db, await actor("mercado@ongsave.demo"));
    const [a, b] = (
      await ctx.d1
        .prepare("SELECT id FROM rescues WHERE status='WAITING_DRIVER' LIMIT 2")
        .all<{ id: string }>()
    ).results;
    const lucas = await actor("motorista@ongsave.demo");
    const racing = withBarrier(2);
    const results = await Promise.allSettled([
      acceptMission(racing, lucas, a.id),
      acceptMission(racing, lucas, b.id),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.message,
    ).toBe("Conclua sua missão atual primeiro");
  });
});
