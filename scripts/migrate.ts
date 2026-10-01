import "./environment";
import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";
async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "Preencha DATABASE_URL com a conexão PostgreSQL ou aplique a migration pelo SQL Editor do Supabase.",
    );
  const host = new URL(process.env.DATABASE_URL).hostname;
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    ssl: ["localhost", "127.0.0.1"].includes(host) ? false : "require",
  });
  try {
    await sql`create schema if not exists private`;
    await sql`create table if not exists private.schema_migrations(version text primary key,applied_at timestamptz not null default now())`;
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      await sql.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(8642031)`;
        if ((await tx`select version from private.schema_migrations where version=${file}`).length)
          return;
        const [{ hosted_history }] = await tx<
          { hosted_history: boolean }[]
        >`select to_regclass('supabase_migrations.schema_migrations') is not null as hosted_history`;
        if (hosted_history) {
          const version = file.split("_")[0];
          const applied =
            await tx`select version from supabase_migrations.schema_migrations where version=${version}`;
          if (applied.length) {
            await tx`insert into private.schema_migrations(version) values(${file})`;
            console.log(`Migration já registrada pelo Supabase: ${file}`);
            return;
          }
        }
        await tx.unsafe(readFileSync(`supabase/migrations/${file}`, "utf8"));
        await tx`insert into private.schema_migrations(version) values(${file})`;
        console.log(`Migration aplicada: ${file}`);
      });
    }
  } finally {
    await sql.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
