import "server-only";
import { redirect } from "next/navigation";
import { requireProfile } from "./auth";
import { networkSummary, type NetworkBatch } from "./admin-network";
import { organizationPhotos } from "./organization-photos";
import type { Organization, Rescue } from "./domain";

// The session's RLS policies apply to every read; no service key reaches this page.
export async function adminNetworkData() {
  const { client, profile } = await requireProfile();
  if (profile.role !== "ADMIN") redirect("/home");
  async function allRows<T>(
    fetchPage: (
      start: number,
      end: number,
    ) => PromiseLike<{
      data: T[] | null;
      error: { message: string } | null;
    }>,
  ) {
    const rows: T[] = [];
    for (let start = 0; ; start += 500) {
      const { data, error } = await fetchPage(start, start + 499);
      if (error) throw new Error("Não foi possível carregar a visão da rede.");
      rows.push(...(data || []));
      if ((data?.length || 0) < 500) return rows;
    }
  }
  const [orgs, rescues, batches, time] = await Promise.all([
    allRows<Organization & { slug: string }>((start, end) =>
      client
        .from("organizations")
        .select("id,name,slug,type,neighborhood,address_line,city,latitude,longitude")
        .order("id")
        .range(start, end),
    ),
    allRows<Rescue>((start, end) =>
      client
        .from("rescues")
        .select(
          "id,supermarket_id,ngo_id,status,surplus_batches(estimated_weight_kg),impact_metrics(food_saved_kg,estimated_meals,estimated_disposal_savings)",
        )
        .order("id")
        .range(start, end)
        .returns<Rescue[]>(),
    ),
    allRows<NetworkBatch>((start, end) =>
      client
        .from("surplus_batches")
        .select("id,supermarket_id,status,expires_at")
        .order("id")
        .range(start, end),
    ),
    client.rpc("operational_time"),
  ]);
  if (time.error) throw new Error("Não foi possível atualizar os indicadores da rede.");
  return networkSummary(orgs, rescues, batches, new Date(time.data).getTime(), organizationPhotos);
}
