import "server-only";
import { requireProfile } from "./auth";
import type { Batch, Organization, Preferences, Rescue } from "./domain";
export async function operationalData() {
  const context = await requireProfile();
  const { client, profile, organization } = context;
  let query = client
    .from("rescues")
    .select("*,surplus_batches(*),impact_metrics(*)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (profile.role === "SUPERMARKET" && organization)
    query = query.eq("supermarket_id", organization.id);
  if (profile.role === "NGO" && organization) query = query.eq("ngo_id", organization.id);
  const [rescueResult, orgResult, timeResult] = await Promise.all([
    query,
    client.from("organizations").select("*"),
    client.rpc("operational_time"),
  ]);
  if (rescueResult.error || orgResult.error || timeResult.error)
    throw new Error(
      rescueResult.error?.message || orgResult.error?.message || timeResult.error?.message,
    );
  return {
    ...context,
    asOf: new Date(timeResult.data).getTime(),
    rescues: (rescueResult.data || []) as Rescue[],
    orgs: (orgResult.data || []) as Organization[],
  };
}
export async function signedPhoto(path: string | null | undefined) {
  if (!path) return undefined;
  const { client } = await requireProfile();
  const { data } = await client.storage.from("surplus").createSignedUrl(path, 3600);
  return data?.signedUrl;
}
export async function donationFeed() {
  const context = await operationalData();
  const { client, organization } = context;
  const [b, p] = await Promise.all([
    client
      .from("surplus_batches")
      .select("*,surplus_items(*)")
      .eq("status", "AVAILABLE")
      .gt("expires_at", new Date(context.asOf).toISOString())
      .order("created_at", { ascending: false }),
    organization
      ? client.from("ngo_preferences").select("*").eq("organization_id", organization.id).single()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (b.error || p.error) throw new Error(b.error?.message || p.error?.message);
  return {
    ...context,
    batches: (b.data || []) as Batch[],
    preferences: p.data as Preferences | null,
  };
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
