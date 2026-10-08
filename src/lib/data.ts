import "server-only";
import { requireProfile } from "./auth";
import type { Rescue } from "./domain";
import { operationalTime } from "@/server/db/time";
import {
  availableBatches,
  organizationDirectory,
  preferencesFor,
  rescueList,
} from "@/server/queries";
export async function operationalData() {
  const context = await requireProfile();
  const { db, actor, profile, organization } = context;
  const scope =
    profile.role === "SUPERMARKET" && organization
      ? { supermarketId: organization.id }
      : profile.role === "NGO" && organization
        ? { ngoId: organization.id }
        : {};
  const [rescues, orgs] = await Promise.all([
    rescueList(db, actor, scope),
    organizationDirectory(db),
  ]);
  return { ...context, asOf: operationalTime().getTime(), rescues, orgs };
}
// Private photos are served by an authenticated route that re-checks batch access.
export async function signedPhoto(path: string | null | undefined) {
  if (!path) return undefined;
  return `/api/photos/${path.split("/").map(encodeURIComponent).join("/")}`;
}
export async function donationFeed() {
  const context = await operationalData();
  const { db, actor, organization } = context;
  const [batches, preferences] = await Promise.all([
    availableBatches(db, actor, new Date(context.asOf)),
    organization ? preferencesFor(db, actor, organization.id) : Promise.resolve(null),
  ]);
  return { ...context, batches, preferences };
}
export function ownRescues(rescues: Rescue[], driverId?: string) {
  return driverId ? rescues.filter((r) => r.driver_id === driverId) : rescues;
}
export function summarize(rescues: Rescue[]) {
  const done = rescues.filter((r) => r.status === "DELIVERED");
  const metrics = done.flatMap((r) => r.impact_metrics || []);
  return {
    kg: metrics.reduce((s, m) => s + Number(m.food_saved_kg), 0),
    meals: metrics.reduce((s, m) => s + Number(m.estimated_meals), 0),
    savings: metrics.reduce((s, m) => s + Number(m.estimated_disposal_savings), 0),
    co2: metrics.reduce((s, m) => s + Number(m.estimated_co2_avoided_kg), 0),
    water: metrics.reduce((s, m) => s + Number(m.estimated_water_saved_liters), 0),
    km: done.reduce((s, r) => s + Number(r.mock_distance_km), 0),
    count: done.length,
    partners: new Set(done.map((r) => r.ngo_id)).size,
  };
}
