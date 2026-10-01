import { createHash } from "node:crypto";
import { calculateImpact } from "../src/lib/domain";
export const id = (name: string) => {
  const h = createHash("md5").update(`ongsave:${name}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
export const organizationData = [
  {
    name: "Mercado Paulista",
    slug: "mercado-paulista",
    type: "SUPERMARKET",
    neighborhood: "Vila Mariana",
    address_line: "Rua Domingos de Morais, 1450",
    latitude: -23.5898,
    longitude: -46.6387,
  },
  {
    name: "Supermercado Aurora",
    slug: "supermercado-aurora",
    type: "SUPERMARKET",
    neighborhood: "Moema",
    address_line: "Avenida Moema, 320",
    latitude: -23.6026,
    longitude: -46.6638,
  },
  {
    name: "Empório Central",
    slug: "emporio-central",
    type: "SUPERMARKET",
    neighborhood: "Pinheiros",
    address_line: "Rua dos Pinheiros, 620",
    latitude: -23.5673,
    longitude: -46.6864,
  },
  {
    name: "Mercado Nova Vida",
    slug: "mercado-nova-vida",
    type: "SUPERMARKET",
    neighborhood: "Santana",
    address_line: "Rua Voluntários da Pátria, 2100",
    latitude: -23.5012,
    longitude: -46.6253,
  },
  {
    name: "Instituto Esperança",
    slug: "instituto-esperanca",
    type: "NGO",
    neighborhood: "Vila Mariana",
    address_line: "Rua Joaquim Távora, 940",
    latitude: -23.5846,
    longitude: -46.6442,
  },
  {
    name: "Casa São Lucas",
    slug: "casa-sao-lucas",
    type: "NGO",
    neighborhood: "Moema",
    address_line: "Alameda dos Maracatins, 900",
    latitude: -23.6078,
    longitude: -46.6664,
  },
  {
    name: "Projeto Viver",
    slug: "projeto-viver",
    type: "NGO",
    neighborhood: "Pinheiros",
    address_line: "Rua Teodoro Sampaio, 1850",
    latitude: -23.5627,
    longitude: -46.6881,
  },
  {
    name: "Associação Mãos Abertas",
    slug: "maos-abertas",
    type: "NGO",
    neighborhood: "Bela Vista",
    address_line: "Rua Treze de Maio, 580",
    latitude: -23.5574,
    longitude: -46.6446,
  },
].map((o) => ({
  ...o,
  id: id(o.slug),
  city: "São Paulo",
  state: "SP",
  description: "Organização demonstrativa do ONGSave",
  email: `${o.slug}@ongsave.demo`,
  phone: "(11) 3000-1000",
}));
export const accountData = [
  {
    email: "mercado@ongsave.demo",
    name: "Equipe Mercado Paulista",
    role: "SUPERMARKET",
    org: "mercado-paulista",
  },
  {
    email: "aurora@ongsave.demo",
    name: "Equipe Aurora",
    role: "SUPERMARKET",
    org: "supermercado-aurora",
  },
  {
    email: "central@ongsave.demo",
    name: "Equipe Empório Central",
    role: "SUPERMARKET",
    org: "emporio-central",
  },
  {
    email: "novavida@ongsave.demo",
    name: "Equipe Nova Vida",
    role: "SUPERMARKET",
    org: "mercado-nova-vida",
  },
  {
    email: "ong@ongsave.demo",
    name: "Equipe Instituto Esperança",
    role: "NGO",
    org: "instituto-esperanca",
  },
  {
    email: "saolucas@ongsave.demo",
    name: "Equipe Casa São Lucas",
    role: "NGO",
    org: "casa-sao-lucas",
  },
  { email: "viver@ongsave.demo", name: "Equipe Projeto Viver", role: "NGO", org: "projeto-viver" },
  {
    email: "maosabertas@ongsave.demo",
    name: "Equipe Mãos Abertas",
    role: "NGO",
    org: "maos-abertas",
  },
  { email: "motorista@ongsave.demo", name: "Lucas Almeida", role: "DRIVER", org: null },
  { email: "mariana@ongsave.demo", name: "Mariana Costa", role: "DRIVER", org: null },
  { email: "rafael@ongsave.demo", name: "Rafael Santos", role: "DRIVER", org: null },
];
export const preferencesData = organizationData
  .filter((o) => o.type === "NGO")
  .map((o) => ({
    id: id(`prefs:${o.slug}`),
    organization_id: o.id,
    daily_capacity_kg: 250,
    receiving_enabled: true,
    receiving_start: "00:00",
    receiving_end: "23:59",
    service_radius_km: 20,
    has_fridge: true,
    has_freezer: true,
    has_cold_room: false,
    accepted_categories: [
      "produce",
      "bakery",
      "dairy",
      "prepared_food",
      "dry_goods",
      "frozen",
      "other",
    ],
    current_needs: ["produce", "bakery"],
  }));
export const driverData = accountData
  .filter((a) => a.role === "DRIVER")
  .map((a, i) => ({
    id: id(`driver:${a.email}`),
    profile_id: id(`profile:${a.email}`),
    vehicle_type: i === 0 ? "car" : "van",
    vehicle_label: [
      "Fiat Fiorino · Branco",
      "Renault Kangoo · Prata",
      "Volkswagen Saveiro · Branco",
    ][i],
    vehicle_capacity_kg: [180, 250, 300][i],
    availability: true,
    mock_latitude: -23.589 + i * 0.005,
    mock_longitude: -46.64 + i * 0.003,
  }));
type Row = Record<string, unknown>;
export function operationalSeed(now = new Date()) {
  const tables: Record<string, Row[]> = {
    surplus_batches: [],
    surplus_items: [],
    donation_reservations: [],
    rescues: [],
    rescue_events: [],
    impact_metrics: [],
  };
  const market = organizationData.filter((o) => o.type === "SUPERMARKET");
  const ngos = organizationData.filter((o) => o.type === "NGO");
  const titles = [
    "Hortifrúti da estação",
    "Pães e produtos de padaria",
    "Cesta de mercearia",
    "Legumes e verduras",
  ];
  const cats = ["produce", "bakery", "dry_goods", "produce"];
  for (let i = 0; i < 23; i++) {
    const historical = i < 16;
    const mission = i >= 20;
    const kind = historical ? "HISTORY" : mission ? "MISSION" : "AVAILABLE";
    const m = market[i % 4];
    const n = ngos[historical ? Math.floor(i / 4) % 4 : (i + 1) % 4];
    const date = historical
      ? new Date(now.getTime() - (30 - i * 1.7) * 86400000).toISOString()
      : new Date(now.getTime() - 3600000).toISOString();
    const weight = historical ? [24, 38, 16, 42, 29, 31, 52, 18][i % 8] : [38, 24, 16, 32][i % 4];
    const bid = id(`batch:${i}`);
    const rid = id(`rescue:${i}`);
    const status = historical ? "DELIVERED" : mission ? "RESERVED" : "AVAILABLE";
    const creator = accountData.find((a) => a.org === m.slug)!;
    tables.surplus_batches.push({
      id: bid,
      supermarket_id: m.id,
      created_by: id(`profile:${creator.email}`),
      title: titles[i % 4],
      category: cats[i % 4],
      description: "Lote demonstrativo. Retirada na entrada de serviço.",
      image_url: null,
      estimated_weight_kg: weight,
      estimated_weight_min: weight - 3,
      estimated_weight_max: weight + 3,
      visual_condition: "acceptable",
      pickup_priority: "high",
      recommended_pickup_hours: 36,
      expires_at: new Date(now.getTime() + 36 * 3600000).toISOString(),
      status,
      ai_analysis_json: null,
      ai_provider: "seed",
      ai_model: "historical-fixture",
      ai_confidence: null,
      user_confirmed: true,
      is_seed: true,
      is_demo: false,
      seed_kind: kind,
      created_at: date,
      published_at: date,
    });
    tables.surplus_items.push({
      id: id(`item:${i}`),
      batch_id: bid,
      name: ["Frutas e legumes", "Pães", "Arroz e feijão", "Verduras"][i % 4],
      estimated_quantity: weight,
      confidence: 0.8,
      created_at: date,
    });
    if (historical || mission) {
      const ngoAccount = accountData.find((a) => a.org === n.slug)!;
      tables.donation_reservations.push({
        id: id(`reservation:${i}`),
        batch_id: bid,
        ngo_id: n.id,
        accepted_by: id(`profile:${ngoAccount.email}`),
        status: historical ? "COMPLETED" : "ACTIVE",
        accepted_at: date,
      });
      tables.rescues.push({
        id: rid,
        batch_id: bid,
        supermarket_id: m.id,
        ngo_id: n.id,
        driver_id: historical ? driverData[i % 3].id : null,
        status: historical ? "DELIVERED" : "WAITING_DRIVER",
        pickup_address: m.address_line,
        pickup_latitude: m.latitude,
        pickup_longitude: m.longitude,
        delivery_address: n.address_line,
        delivery_latitude: n.latitude,
        delivery_longitude: n.longitude,
        mock_distance_km: 2.4 + (i % 3) * 0.7,
        mock_eta_minutes: 14 + (i % 3) * 4,
        mock_route_geometry: [
          [m.longitude, m.latitude],
          [m.longitude, n.latitude],
          [n.longitude, n.latitude],
        ],
        created_at: date,
        reserved_at: date,
        driver_assigned_at: historical ? date : null,
        going_to_pickup_at: historical ? date : null,
        arrived_pickup_at: historical ? date : null,
        picked_up_at: historical ? date : null,
        in_transit_at: historical ? date : null,
        arrived_destination_at: historical ? date : null,
        delivered_at: historical ? date : null,
      });
      tables.rescue_events.push({
        id: id(`event:${i}`),
        rescue_id: rid,
        event_type: historical ? "DELIVERED" : "WAITING_DRIVER",
        status: historical ? "DELIVERED" : "WAITING_DRIVER",
        actor_profile_id: id(`profile:${ngoAccount.email}`),
        metadata: { seed: true },
        created_at: date,
      });
      if (historical)
        tables.impact_metrics.push({
          id: id(`impact:${i}`),
          rescue_id: rid,
          ...calculateImpact(weight),
          created_at: date,
        });
    }
  }
  return tables;
}
