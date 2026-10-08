// Former RLS policies and private.* helper functions, as explicit checks.
// D1 has no row-level security: every read query must filter with these, or the data leaks.
import { and, eq, gt, inArray, or, sql, type SQL } from "drizzle-orm";
import type { Role } from "@/lib/domain";
import type { Db } from "./db/client";
import { drivers, organizationMembers, profiles, rescues, surplusBatches } from "./db/schema";

export type Actor = {
  profileId: string; // private.actor_id()
  authUserId: string;
  email: string;
  role: Role; // private.actor_role()
  orgIds: string[]; // organizations where private.member(org) is true
  driverId: string | null;
};

export async function loadActor(db: Db, authUserId: string): Promise<Actor | null> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.auth_user_id, authUserId),
  });
  if (!profile) return null;
  const [members, driver] = await Promise.all([
    db
      .select({ id: organizationMembers.organization_id })
      .from(organizationMembers)
      .where(eq(organizationMembers.profile_id, profile.id)),
    db.query.drivers.findFirst({ where: eq(drivers.profile_id, profile.id) }),
  ]);
  return {
    profileId: profile.id,
    authUserId,
    email: profile.email,
    role: profile.role,
    orgIds: members.map((m) => m.id),
    driverId: driver?.id ?? null,
  };
}

// private.member(org)
export const member = (actor: Actor, org: string | null | undefined) =>
  !!org && actor.orgIds.includes(org);

type RescueAccess = {
  supermarket_id: string;
  ngo_id: string;
  status: string;
  driver_id: string | null;
};

// private.can_read_rescue(rid)
export function canReadRescue(actor: Actor, r: RescueAccess) {
  return (
    member(actor, r.supermarket_id) ||
    member(actor, r.ngo_id) ||
    (actor.role === "DRIVER" &&
      (r.status === "WAITING_DRIVER" || (!!actor.driverId && r.driver_id === actor.driverId))) ||
    actor.role === "ADMIN"
  );
}

// private.can_read_batch(bid)
export function canReadBatch(
  actor: Actor,
  b: { supermarket_id: string; status: string; expires_at: string },
  rescue: RescueAccess | null | undefined,
  now: Date,
) {
  return (
    member(actor, b.supermarket_id) ||
    (actor.role === "NGO" && b.status === "AVAILABLE" && b.expires_at > now.toISOString()) ||
    (!!rescue && canReadRescue(actor, rescue)) ||
    actor.role === "ADMIN"
  );
}

const never = sql`0`;
const always = sql`1`;
const anyOf = (conditions: (SQL | undefined)[]) => or(never, ...conditions)!;

// Policy read_rescues / read_events / read_impact as a WHERE clause on `rescues`.
export function readableRescues(actor: Actor): SQL {
  if (actor.role === "ADMIN") return always;
  return anyOf([
    actor.orgIds.length ? inArray(rescues.supermarket_id, actor.orgIds) : undefined,
    actor.orgIds.length ? inArray(rescues.ngo_id, actor.orgIds) : undefined,
    actor.role === "DRIVER" ? eq(rescues.status, "WAITING_DRIVER") : undefined,
    actor.role === "DRIVER" && actor.driverId ? eq(rescues.driver_id, actor.driverId) : undefined,
  ]);
}

// Policy read_batches / read_items as a WHERE clause on `surplus_batches`.
export function readableBatches(actor: Actor, now: Date): SQL {
  if (actor.role === "ADMIN") return always;
  return anyOf([
    actor.orgIds.length ? inArray(surplusBatches.supermarket_id, actor.orgIds) : undefined,
    actor.role === "NGO"
      ? and(
          eq(surplusBatches.status, "AVAILABLE"),
          gt(surplusBatches.expires_at, now.toISOString()),
        )
      : undefined,
    sql`exists (select 1 from ${rescues} where ${rescues.batch_id} = ${surplusBatches.id} and ${readableRescues(actor)})`,
  ]);
}
