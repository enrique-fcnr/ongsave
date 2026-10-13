import { describe, expect, it } from "vitest";
import { filterNetwork, hasMapLocation, networkSummary } from "../src/lib/admin-network";
import { calculateImpact, type Organization, type Rescue } from "../src/lib/domain";

const orgs = [
  {
    id: "market",
    slug: "mercado",
    type: "SUPERMARKET",
    name: "Mercado da Praça",
    neighborhood: "Mooca",
    address_line: "Rua Um, 10",
    city: "São Paulo",
    latitude: -23.55,
    longitude: -46.6,
  },
  {
    id: "ngo",
    slug: "ong",
    type: "NGO",
    name: "Associação Esperança",
    neighborhood: "Brás",
    address_line: "Rua Dois, 20",
    city: "São Paulo",
    latitude: -23.53,
    longitude: -46.62,
  },
  {
    id: "new",
    slug: "nova",
    type: "NGO",
    name: "Nova ONG",
    neighborhood: "Centro",
    address_line: "Rua Três, 30",
    city: "São Paulo",
    latitude: -23.54,
    longitude: -46.64,
  },
] as (Organization & { slug: string })[];
const rescue = (id: string, status: string) =>
  ({
    id,
    supermarket_id: "market",
    ngo_id: "ngo",
    status,
    surplus_batches: { estimated_weight_kg: 10 },
    impact_metrics: [calculateImpact(10)],
  }) as Rescue;

describe("Visão administrativa da rede", () => {
  it("contabiliza somente entregas confirmadas e mantém os dois lados sem duplicar o total da rede", () => {
    const rows = networkSummary(
      orgs,
      [
        rescue("done", "DELIVERED"),
        rescue("ongoing", "WAITING_DRIVER"),
        rescue("cancelled", "CANCELLED"),
      ],
      [],
      Date.now(),
    );
    expect(rows[0]).toMatchObject({ kg: 10, meals: 20, savings: 77.2, delivered: 1, ongoing: 1 });
    expect(rows[1]).toMatchObject({ kg: 10, meals: 20, savings: 77.2, delivered: 1, ongoing: 1 });
    expect(rows.filter((o) => o.type === "SUPERMARKET").reduce((s, o) => s + o.kg, 0)).toBe(10);
    expect(rows[2]).toMatchObject({ kg: 0, delivered: 0, ongoing: 0, savings: 0 });
  });
  it("diferencia lotes publicados de disponibilidade e usa o relógio operacional", () => {
    const rows = networkSummary(
      orgs,
      [],
      [
        {
          id: "active",
          supermarket_id: "market",
          status: "AVAILABLE",
          expires_at: "2026-10-14T00:00:00Z",
        },
        {
          id: "expired",
          supermarket_id: "market",
          status: "AVAILABLE",
          expires_at: "2026-10-12T00:00:00Z",
        },
        {
          id: "reserved",
          supermarket_id: "market",
          status: "RESERVED",
          expires_at: "2026-10-14T00:00:00Z",
        },
      ],
      Date.parse("2026-10-13T00:00:00Z"),
    );
    expect(rows[0]).toMatchObject({ published: 3, available: 1 });
    expect(rows[1]).toMatchObject({ published: 0, available: 0 });
  });
  it("busca sem acentos, filtra o tipo e identifica pontos sem localização", () => {
    const rows = networkSummary(orgs, [], [], Date.now());
    expect(filterNetwork(rows, "NGO", "associacao").map((o) => o.id)).toEqual(["ngo"]);
    expect(filterNetwork(rows, "SUPERMARKET", "brás")).toHaveLength(0);
    expect(filterNetwork(rows, "ALL", " rua um ").map((o) => o.id)).toEqual(["market"]);
    expect(hasMapLocation(orgs[0])).toBe(true);
    expect(hasMapLocation({ latitude: NaN, longitude: -46 })).toBe(false);
    expect(hasMapLocation({ latitude: 0, longitude: 0 })).toBe(false);
  });
  it("usa o registro de impacto e mantém foto genérica identificada quando não há fonte", () => {
    const r = rescue("done", "DELIVERED");
    r.impact_metrics = [calculateImpact(12)];
    const rows = networkSummary(orgs, [r], [], Date.now(), {
      mercado: {
        url: "https://example.org/store.jpg",
        label: "Foto institucional",
        source: "https://example.org",
      },
    });
    expect(rows[0]).toMatchObject({ kg: 12, savings: 92.64 });
    expect(rows[0].photo.source).toBe("https://example.org");
    expect(rows[1].photo.label).toBe("Imagem ilustrativa");
  });
});
