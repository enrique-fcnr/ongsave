import { readFileSync, readdirSync } from "node:fs";
import { getPlatformProxy } from "wrangler";
import { createDb } from "../../src/server/db/client";

// Real D1 (workerd/Miniflare) in memory, no remote bindings. Applies every
// drizzle/migrations/*.sql file the same way `wrangler d1 migrations apply` does.
export async function createTestDb() {
  const proxy = await getPlatformProxy<CloudflareEnv>({ persist: false, remoteBindings: false });
  const d1 = proxy.env.DB;
  for (const file of readdirSync("drizzle/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const statements = readFileSync(`drizzle/migrations/${file}`, "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    await d1.batch(statements.map((s) => d1.prepare(s)));
  }
  return { d1, env: proxy.env, db: createDb(d1), dispose: () => proxy.dispose() };
}
