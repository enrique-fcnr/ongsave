import { describe, it, expect } from "vitest";
import {
  calculateImpact,
  canTransition,
  summarizeDriverDay,
  matchScore,
  tokenSchema,
  type Batch,
  type Organization,
  type Preferences,
  transitions,
} from "../src/lib/domain";
import { analysisSchema, publicationSchema } from "../src/lib/ai/schema";
import { demoAnalysis } from "../src/lib/ai/demo-analysis";
describe("Regras do resgate", () => {
  it("exige cada etapa da missão e estados terminais não podem avançar", () => {
    expect(canTransition("WAITING_DRIVER", "DRIVER_ASSIGNED")).toBe(true);
    expect(canTransition("AT_PICKUP", "DELIVERED")).toBe(false);
    expect(transitions.DELIVERED).toEqual([]);
    expect(transitions.CANCELLED).toEqual([]);
  });
  it("valida o token sem perder zeros iniciais", () => {
    expect(tokenSchema.parse("0042")).toBe("0042");
    for (const value of ["42", "12345", "ab12", ""])
      expect(tokenSchema.safeParse(value).success).toBe(false);
  });
  it("centraliza as estimativas e rejeita peso inválido", () => {
    expect(calculateImpact(38)).toEqual({
      food_saved_kg: 38,
      estimated_meals: 76,
      estimated_disposal_savings: 293.36,
      estimated_co2_avoided_kg: 54.34,
      estimated_water_saved_liters: 9500,
    });
    expect(() => calculateImpact(-1)).toThrow();
    expect(() => calculateImpact(NaN)).toThrow();
  });
  it("calcula a estimativa diária do motorista pelas entregas concluídas no horário de São Paulo", () => {
    const daily = summarizeDriverDay(
      [
        { driver_id: "driver-1", status: "DELIVERED", delivered_at: "2026-10-14T03:00:00Z" },
        { driver_id: "driver-1", status: "DELIVERED", delivered_at: "2026-10-14T11:00:00-03:00" },
        { driver_id: "driver-1", status: "IN_TRANSIT", delivered_at: null },
        { driver_id: "driver-2", status: "DELIVERED", delivered_at: "2026-10-14T12:00:00-03:00" },
        { driver_id: "driver-1", status: "DELIVERED", delivered_at: "2026-10-13T23:59:00-03:00" },
      ],
      "driver-1",
      new Date("2026-10-14T16:00:00Z"),
    );
    expect(daily).toEqual({ deliveries: 2, revenue: 50 });
  });
  it("ordena matching simples considerando horário de São Paulo", () => {
    const b = { category: "produce", estimated_weight_kg: 38 } as Batch;
    const org = { neighborhood: "Vila Mariana" } as Organization;
    const prefs = {
      accepted_categories: ["produce"],
      current_needs: ["produce"],
      daily_capacity_kg: 50,
      receiving_enabled: true,
      receiving_start: "07:00",
      receiving_end: "18:00",
    } as Preferences;
    expect(matchScore(b, org, prefs, org, new Date("2026-09-30T15:00:00Z"))).toBe(100);
    expect(
      matchScore(
        b,
        org,
        { ...prefs, daily_capacity_kg: 10, receiving_enabled: false },
        org,
        new Date("2026-09-30T23:00:00Z"),
      ),
    ).toBe(60);
  });
  it("valida fixture e rejeita resposta de IA inconsistente", () => {
    expect(analysisSchema.safeParse(demoAnalysis).success).toBe(true);
    expect(analysisSchema.safeParse({ ...demoAnalysis, confidence: 2 }).success).toBe(false);
    expect(
      analysisSchema.safeParse({ ...demoAnalysis, estimated_weight_range: { min: 50, max: 60 } })
        .success,
    ).toBe(false);
    expect(analysisSchema.safeParse({ ...demoAnalysis, category: "unsafe" }).success).toBe(false);
  });
  it("não publica sem confirmação humana", () => {
    expect(
      publicationSchema.safeParse({ ...demoAnalysis, description: "", user_confirmed: false })
        .success,
    ).toBe(false);
    expect(
      publicationSchema.safeParse({ ...demoAnalysis, description: "", user_confirmed: true })
        .success,
    ).toBe(true);
  });
});
