import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";
import { guardReasons } from "./schema";

export type Db = DrizzleD1Database<typeof schema> & { $client: D1Database };
export type GuardReason = (typeof guardReasons)[number];

export function createDb(d1: D1Database): Db {
  return drizzle(d1, { schema }) as Db;
}

// Request-scoped D1 handle (Route Handlers, Server Components, Server Actions).
export function getDb(): Db {
  return createDb(getCloudflareContext().env.DB);
}

// For code that may run outside a request (static generation, scripts in next dev).
export async function getDbAsync(): Promise<Db> {
  return createDb((await getCloudflareContext({ async: true })).env.DB);
}

export class GuardError extends Error {
  constructor(readonly reason: GuardReason) {
    super(`Regra violada: ${reason}`);
  }
}

// Runs statements as one D1 batch: a single implicit transaction, all or nothing.
// A failed `batch_guards` assertion aborts the batch and surfaces as GuardError.
export async function runAtomic(db: Db, statements: D1PreparedStatement[]) {
  try {
    return await db.$client.batch(statements);
  } catch (error) {
    const reason = guardReason(error);
    if (reason) throw new GuardError(reason);
    throw error;
  }
}

export function guardReason(error: unknown): GuardReason | undefined {
  const text = error instanceof Error ? `${error.message} ${String(error.cause ?? "")}` : "";
  const match = /CHECK constraint failed: guard_([a-z_]+)/.exec(text);
  return guardReasons.find((reason) => reason === match?.[1]);
}

// INSERT that fails the batch with `reason` unless `condition` holds. Bind `params` to the
// placeholders in `condition`.
export function guard(db: Db, reason: GuardReason, condition: string, ...params: unknown[]) {
  return db.$client
    .prepare(`INSERT INTO batch_guards(reason) SELECT ? WHERE NOT (${condition})`)
    .bind(reason, ...params);
}
