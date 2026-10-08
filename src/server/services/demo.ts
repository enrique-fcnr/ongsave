// private.reset_demo, statement by statement, as one atomic D1 batch.
import { runAtomic, type Db } from "../db/client";
import type { Actor } from "../permissions";
import { UUID_SQL } from "./rescue";

const OFFICIAL = "mercado@ongsave.demo";
const DEMO_ACCOUNTS = ["mercado@ongsave.demo", "ong@ongsave.demo", "motorista@ongsave.demo"];
const MISSION_RESCUES =
  "SELECT r.id FROM rescues r JOIN surplus_batches b ON b.id=r.batch_id WHERE b.seed_kind='MISSION'";

export async function resetDemo(db: Db, actor: Actor, now = new Date()) {
  if (process.env.ENABLE_DEMO_MODE !== "true") throw new Error("Modo demonstração desativado.");
  if (actor.email !== OFFICIAL || actor.role !== "SUPERMARKET")
    throw new Error("Use a conta oficial do supermercado para resetar");
  const at = now.toISOString();
  const expires = new Date(now.getTime() + 36 * 3600000).toISOString();
  const sql = (query: string, ...params: unknown[]) => db.$client.prepare(query).bind(...params);
  await runAtomic(db, [
    sql(
      `DELETE FROM notifications WHERE profile_id IN (SELECT id FROM profiles WHERE email IN (${DEMO_ACCOUNTS.map(() => "?").join(",")}))`,
      ...DEMO_ACCOUNTS,
    ),
    sql("DELETE FROM surplus_batches WHERE is_demo=1 AND is_seed=0"),
    sql(
      "DELETE FROM rescues WHERE batch_id IN (SELECT id FROM surplus_batches WHERE is_seed=1 AND seed_kind='AVAILABLE')",
    ),
    sql(
      "DELETE FROM donation_reservations WHERE batch_id IN (SELECT id FROM surplus_batches WHERE is_seed=1 AND seed_kind='AVAILABLE')",
    ),
    sql(`DELETE FROM impact_metrics WHERE rescue_id IN (${MISSION_RESCUES})`),
    sql(`DELETE FROM rescue_events WHERE rescue_id IN (${MISSION_RESCUES})`),
    sql(
      `UPDATE rescues SET status='WAITING_DRIVER',driver_id=NULL,driver_assigned_at=NULL,going_to_pickup_at=NULL,
         arrived_pickup_at=NULL,picked_up_at=NULL,in_transit_at=NULL,arrived_destination_at=NULL,delivered_at=NULL,
         cancelled_at=NULL,updated_at=?
       WHERE batch_id IN (SELECT id FROM surplus_batches WHERE is_seed=1 AND seed_kind='MISSION')`,
      at,
    ),
    sql(
      `INSERT INTO rescue_events(id,rescue_id,event_type,status,created_at)
       SELECT ${UUID_SQL},r.id,'WAITING_DRIVER','WAITING_DRIVER',? FROM rescues r
       JOIN surplus_batches b ON b.id=r.batch_id WHERE b.seed_kind='MISSION'`,
      at,
    ),
    sql(
      `UPDATE rescue_tokens SET confirmation_token=printf('%04d',abs(random())%10000),attempts=0,locked_until=NULL
       WHERE rescue_id IN (${MISSION_RESCUES})`,
    ),
    sql(
      `UPDATE surplus_batches SET status=CASE WHEN seed_kind='MISSION' THEN 'RESERVED' ELSE 'AVAILABLE' END,
         expires_at=?,updated_at=? WHERE is_seed=1 AND seed_kind IN ('MISSION','AVAILABLE')`,
      expires,
      at,
    ),
    sql(
      "UPDATE donation_reservations SET status='ACTIVE' WHERE batch_id IN (SELECT id FROM surplus_batches WHERE is_seed=1 AND seed_kind='MISSION')",
    ),
    sql("DELETE FROM analyses WHERE profile_id=?", actor.profileId),
    sql(
      "UPDATE drivers SET availability=1 WHERE profile_id IN (SELECT id FROM profiles WHERE email='motorista@ongsave.demo')",
    ),
    sql(
      `UPDATE ngo_preferences SET receiving_enabled=1,daily_capacity_kg=250,receiving_start='00:00',receiving_end='23:59',
         accepted_categories='["produce","bakery","dairy","prepared_food","dry_goods","frozen","other"]',
         current_needs='["produce","bakery"]',has_fridge=1,has_freezer=1,service_radius_km=20
       WHERE organization_id=(SELECT id FROM organizations WHERE slug='instituto-esperanca')`,
    ),
  ]);
}
