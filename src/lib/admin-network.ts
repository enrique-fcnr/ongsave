import { calculateImpact, type Organization, type Rescue } from "./domain";

export type NetworkOrganization = Organization & {
  slug: string;
  photo: { url: string; label: string; source?: string };
  published: number;
  available: number;
  ongoing: number;
  delivered: number;
  kg: number;
  meals: number;
  savings: number;
};

export type NetworkBatch = {
  id: string;
  supermarket_id: string;
  status: string;
  expires_at: string;
};

export function networkSummary(
  organizations: (Organization & { slug: string })[],
  rescues: Rescue[],
  batches: NetworkBatch[],
  asOf: number,
  photos: Record<string, NetworkOrganization["photo"]> = {},
): NetworkOrganization[] {
  return organizations.map((org) => {
    const related = rescues.filter((r) =>
      org.type === "NGO" ? r.ngo_id === org.id : r.supermarket_id === org.id,
    );
    const delivered = related.filter((r) => r.status === "DELIVERED");
    const metrics = delivered.map(
      (r) =>
        r.impact_metrics?.[0] ||
        (Number(r.surplus_batches?.estimated_weight_kg) > 0
          ? calculateImpact(Number(r.surplus_batches?.estimated_weight_kg))
          : null),
    );
    const ownBatches = batches.filter((b) => b.supermarket_id === org.id);
    return {
      ...org,
      photo: photos[org.slug] || {
        url: `/organizations/${org.type === "NGO" ? "ngo" : "market"}-illustrative.webp`,
        label: "Imagem ilustrativa",
      },
      published: ownBatches.length,
      available: ownBatches.filter(
        (b) => b.status === "AVAILABLE" && new Date(b.expires_at).getTime() > asOf,
      ).length,
      ongoing: related.filter((r) => r.status !== "DELIVERED" && r.status !== "CANCELLED").length,
      delivered: delivered.length,
      kg: metrics.reduce((s, m) => s + Number(m?.food_saved_kg || 0), 0),
      meals: metrics.reduce((s, m) => s + Number(m?.estimated_meals || 0), 0),
      savings: metrics.reduce((s, m) => s + Number(m?.estimated_disposal_savings || 0), 0),
    };
  });
}

export function hasMapLocation(org: Pick<Organization, "latitude" | "longitude">) {
  return (
    Number.isFinite(org.latitude) &&
    Number.isFinite(org.longitude) &&
    Math.abs(org.latitude) <= 90 &&
    Math.abs(org.longitude) <= 180 &&
    !(org.latitude === 0 && org.longitude === 0)
  );
}

export function filterNetwork(
  organizations: NetworkOrganization[],
  type: "ALL" | Organization["type"],
  query: string,
) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const text = normalize(query.trim());
  return organizations.filter(
    (org) =>
      (type === "ALL" || org.type === type) &&
      normalize(`${org.name} ${org.neighborhood} ${org.address_line}`).includes(text),
  );
}
