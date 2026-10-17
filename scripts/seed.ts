import { serviceClient } from "./environment";
import { organizationData, preferencesData, driverData, operationalSeed } from "./seed-data";
export async function seed() {
  const client = serviceClient();
  const tables: Record<string, Record<string, unknown>[]> = {
    organizations: organizationData,
    ngo_preferences: preferencesData,
    drivers: driverData,
    ...operationalSeed(),
  };
  for (const [table, rows] of Object.entries(tables)) {
    const { error } = await client
      .from(table)
      .upsert(rows, { onConflict: table === "ngo_preferences" ? "organization_id" : "id" });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log("Seed aplicado: 9 organizações, 3 motoristas, 16 entregas, 4 doações e 3 missões.");
}
if (process.argv[1]?.endsWith("seed.ts"))
  seed().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
