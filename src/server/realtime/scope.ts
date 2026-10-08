import type { Db } from "../db/client";

// Organizations and driver of a rescue, to address its change notice.
export function rescueScope(db: Db, rescueId: string) {
  return db.$client
    .prepare("SELECT supermarket_id, ngo_id, driver_id FROM rescues WHERE id=?")
    .bind(rescueId)
    .first<{ supermarket_id: string; ngo_id: string; driver_id: string | null }>();
}
