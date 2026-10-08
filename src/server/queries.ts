// Read queries that replace the Supabase selects. Each one filters with permissions.ts,
// mirroring the RLS policy of every table it touches (including joined tables).
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import type { Batch, Organization, Preferences, Rescue } from "@/lib/domain";
import type { Db } from "./db/client";
import {
  drivers,
  impactMetrics,
  ngoPreferences,
  notifications,
  organizations,
  rescueEvents,
  rescues,
  surplusBatches,
  surplusItems,
} from "./db/schema";
import { member, readableBatches, readableRescues, type Actor } from "./permissions";

const LIMIT = 200;

// rescues + surplus_batches(*) + impact_metrics(*), newest first, same 200 cap as before.
export async function rescueList(
  db: Db,
  actor: Actor,
  scope: { supermarketId?: string; ngoId?: string } = {},
) {
  const rows = await db
    .select({ rescue: rescues, batch: surplusBatches, impact: impactMetrics })
    .from(rescues)
    .innerJoin(surplusBatches, eq(surplusBatches.id, rescues.batch_id))
    .leftJoin(impactMetrics, eq(impactMetrics.rescue_id, rescues.id))
    .where(
      and(
        readableRescues(actor),
        scope.supermarketId ? eq(rescues.supermarket_id, scope.supermarketId) : undefined,
        scope.ngoId ? eq(rescues.ngo_id, scope.ngoId) : undefined,
      ),
    )
    .orderBy(desc(rescues.created_at))
    .limit(LIMIT);
  return rows.map(
    ({ rescue, batch, impact }) =>
      ({
        ...rescue,
        surplus_batches: batch,
        impact_metrics: impact ? [impact] : [],
      }) as unknown as Rescue,
  );
}

// Policy "directory": any authenticated profile reads the organization directory.
export async function organizationDirectory(db: Db) {
  return (await db.select().from(organizations)) as Organization[];
}

async function withItems(db: Db, batches: (typeof surplusBatches.$inferSelect)[]) {
  if (!batches.length) return [] as Batch[];
  const ids = batches.map((b) => b.id);
  const items: (typeof surplusItems.$inferSelect)[] = [];
  // D1 binds at most 100 parameters per statement.
  for (let i = 0; i < ids.length; i += 90)
    items.push(
      ...(await db
        .select()
        .from(surplusItems)
        .where(inArray(surplusItems.batch_id, ids.slice(i, i + 90)))
        .orderBy(asc(surplusItems.created_at))),
    );
  return batches.map(
    (b) => ({ ...b, surplus_items: items.filter((i) => i.batch_id === b.id) }) as unknown as Batch,
  );
}

// Feed: surplus_batches(*,surplus_items(*)) available and not expired, newest first.
export async function availableBatches(db: Db, actor: Actor, now: Date) {
  const batches = await db
    .select()
    .from(surplusBatches)
    .where(
      and(
        readableBatches(actor, now),
        eq(surplusBatches.status, "AVAILABLE"),
        gt(surplusBatches.expires_at, now.toISOString()),
      ),
    )
    .orderBy(desc(surplusBatches.created_at))
    .limit(LIMIT);
  return withItems(db, batches);
}

// Policy own_preferences.
export async function preferencesFor(db: Db, actor: Actor, organizationId: string) {
  if (!member(actor, organizationId)) return null;
  const row = await db.query.ngoPreferences.findFirst({
    where: eq(ngoPreferences.organization_id, organizationId),
  });
  return (row ?? null) as Preferences | null;
}

// Policy own_driver.
export async function ownDriver(db: Db, actor: Actor) {
  return (
    (await db.query.drivers.findFirst({ where: eq(drivers.profile_id, actor.profileId) })) ?? null
  );
}

// Policy own_notifications, newest 30.
export async function ownNotifications(db: Db, actor: Actor) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.profile_id, actor.profileId))
    .orderBy(desc(notifications.created_at))
    .limit(30);
}

export async function batchDetail(db: Db, actor: Actor, id: string, now: Date) {
  const [batch] = await db
    .select()
    .from(surplusBatches)
    .where(and(eq(surplusBatches.id, id), readableBatches(actor, now)));
  if (!batch) return null;
  const [[full], [market], [rescue]] = await Promise.all([
    withItems(db, [batch]),
    db.select().from(organizations).where(eq(organizations.id, batch.supermarket_id)),
    db
      .select({ id: rescues.id })
      .from(rescues)
      .where(and(eq(rescues.batch_id, id), readableRescues(actor))),
  ]);
  return { batch: full, market: market as Organization | undefined, rescue: rescue ?? null };
}

export async function rescueDetail(db: Db, actor: Actor, id: string) {
  const [row] = await db
    .select({ rescue: rescues, batch: surplusBatches })
    .from(rescues)
    .innerJoin(surplusBatches, eq(surplusBatches.id, rescues.batch_id))
    .where(and(eq(rescues.id, id), readableRescues(actor)));
  if (!row) return null;
  const [events, orgs] = await Promise.all([
    db
      .select()
      .from(rescueEvents)
      .where(eq(rescueEvents.rescue_id, id))
      .orderBy(asc(rescueEvents.created_at), asc(sql`rowid`)),
    db
      .select()
      .from(organizations)
      .where(inArray(organizations.id, [row.rescue.supermarket_id, row.rescue.ngo_id])),
  ]);
  return {
    rescue: { ...row.rescue, surplus_batches: row.batch } as unknown as Rescue,
    events,
    orgs: orgs as Organization[],
  };
}
