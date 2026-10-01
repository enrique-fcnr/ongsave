import { writeFileSync } from "node:fs";
import {
  accountData,
  id,
  organizationData,
  preferencesData,
  driverData,
  operationalSeed,
} from "./seed-data";
const literal = (v: unknown): string =>
  v === null
    ? "null"
    : typeof v === "number" || typeof v === "boolean"
      ? String(v)
      : Array.isArray(v) && v.every((x) => typeof x === "string")
        ? `array[${v.map(literal).join(",")}]`
        : typeof v === "object"
          ? `'${JSON.stringify(v).replaceAll("'", "''")}'::jsonb`
          : `'${String(v).replaceAll("'", "''")}'`;
const insert = (table: string, rows: Record<string, unknown>[]) =>
  rows
    .map(
      (row) =>
        `insert into public.${table} (${Object.keys(row).join(",")}) values (${Object.values(row).map(literal).join(",")}) on conflict do nothing;`,
    )
    .join("\n");
const profiles = accountData
  .map(
    (a) =>
      `insert into public.profiles(id,auth_user_id,name,email,role) select ${literal(id(`profile:${a.email}`))},id,${literal(a.name)},${literal(a.email)},${literal(a.role)} from auth.users where email=${literal(a.email)} on conflict do nothing;\n${a.org ? `insert into public.organization_members(id,organization_id,profile_id) select ${literal(id(`member:${a.email}`))},${literal(id(a.org))},id from public.profiles where email=${literal(a.email)} on conflict do nothing;` : ""}`,
  )
  .join("\n");
const sql = `-- Generated from scripts/seed-data.ts. Bootstrap Auth with npm run demo:users.\nbegin;\n${insert("organizations", organizationData)}\n${profiles}\n${insert("ngo_preferences", preferencesData)}\ndo $$ begin\nif (select count(*) from public.profiles where email like '%@ongsave.demo') < 11 then raise notice 'Execute npm run demo:users para popular o histórico e as missões.'; return; end if;\n${insert("drivers", driverData)}\n${Object.entries(
  operationalSeed(new Date("2026-09-30T15:00:00Z")),
)
  .map(([t, r]) => insert(t, r))
  .join("\n")}\nend $$;\ncommit;\n`;
writeFileSync("supabase/seed.sql", sql);
console.log("supabase/seed.sql gerado.");
