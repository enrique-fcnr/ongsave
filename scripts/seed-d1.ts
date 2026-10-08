import { impactForWeight } from "../src/server/db/impact";
import { driverData, operationalSeed, organizationData, preferencesData } from "./seed-data";
import { execute, target, upsert } from "./d1-sql";

const token = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, "0");

// Directory data that profiles depend on: organizations.
export function organizationStatements() {
  return upsert("organizations", organizationData);
}

// Preferences, drivers and the operational demo: 16 deliveries with metrics,
// 4 available batches and 3 seed missions. Requires the demo profiles.
export function seedStatements(now = new Date()) {
  const tables = operationalSeed(now);
  const batches = tables.surplus_batches.map((b) => ({
    ...b,
    estimated_impact_json: impactForWeight(Number(b.estimated_weight_kg)),
  }));
  return [
    ...upsert("ngo_preferences", preferencesData, "organization_id", ["id"]),
    ...upsert("drivers", driverData),
    ...upsert("surplus_batches", batches),
    ...upsert("surplus_items", tables.surplus_items),
    ...upsert("donation_reservations", tables.donation_reservations),
    ...upsert("rescues", tables.rescues),
    // Former trigger init_rescue_token: every rescue has a private 4-digit code.
    ...upsert(
      "rescue_tokens",
      tables.rescues.map((r) => ({ rescue_id: r.id, confirmation_token: token() })),
      "rescue_id",
    ).map((s) => s.replace(/DO UPDATE SET .*;$/, "DO NOTHING;")),
    ...upsert("rescue_events", tables.rescue_events),
    ...upsert("impact_metrics", tables.impact_metrics),
  ];
}

if (process.argv[1]?.endsWith("seed-d1.ts")) {
  try {
    execute(seedStatements(), target());
    console.log("Seed aplicado: 8 organizações, 3 motoristas, 16 entregas, 4 doações e 3 missões.");
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  }
}
