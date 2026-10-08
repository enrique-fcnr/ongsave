import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Row = Record<string, unknown>;

export function literal(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (value instanceof Date) return literal(value.toISOString());
  if (typeof value === "object") return literal(JSON.stringify(value));
  return `'${String(value).replaceAll("'", "''")}'`;
}

// Idempotent upsert: re-running restores the fixture values.
export function upsert(table: string, rows: Row[], conflict = "id", keep: string[] = []) {
  return rows.map((row) => {
    const columns = Object.keys(row);
    const updates = columns.filter((c) => c !== conflict && !keep.includes(c));
    return (
      `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(",")}) VALUES (${columns
        .map((c) => literal(row[c]))
        .join(",")}) ON CONFLICT("${conflict}") DO ` +
      (updates.length
        ? `UPDATE SET ${updates.map((c) => `"${c}"=excluded."${c}"`).join(",")};`
        : "NOTHING;")
    );
  });
}

export function target() {
  const remote = process.argv.includes("--remote");
  if (!remote && !process.argv.includes("--local"))
    throw new Error("Informe --local (D1 do wrangler dev/preview) ou --remote (produção).");
  return remote ? "--remote" : "--local";
}

// Applies statements with `wrangler d1 execute`, on the account pinned in wrangler.jsonc.
export function execute(statements: string[], where: "--local" | "--remote") {
  const dir = mkdtempSync(join(tmpdir(), "ongsave-d1-"));
  const file = join(dir, "seed.sql");
  writeFileSync(file, statements.join("\n") + "\n");
  execFileSync("npx", ["wrangler", "d1", "execute", "ongsave-db", where, `--file=${file}`], {
    stdio: "inherit",
  });
}
