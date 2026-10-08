import { describe, expect, it } from "vitest";
import { channelsFor, rescueChannels } from "../src/server/realtime/channels";
import type { Actor } from "../src/server/permissions";

const base = { authUserId: "u", email: "x@ongsave.demo", orgIds: [], driverId: null };
const actor = (patch: Partial<Actor>): Actor => ({
  ...base,
  profileId: "p",
  role: "SUPERMARKET",
  ...patch,
});

describe("Canais de tempo real por papel", () => {
  it("supermercado ouve o próprio perfil e a própria organização", () => {
    expect(channelsFor(actor({ role: "SUPERMARKET", orgIds: ["m1"] }))).toEqual([
      "profile:p",
      "org:m1",
    ]);
  });
  it("ONG ouve a organização e o feed de doações", () => {
    expect(channelsFor(actor({ role: "NGO", orgIds: ["n1"] }))).toEqual([
      "profile:p",
      "org:n1",
      "ngos",
    ]);
  });
  it("motorista ouve missões disponíveis e as próprias", () => {
    expect(channelsFor(actor({ role: "DRIVER", driverId: "d1" }))).toEqual([
      "profile:p",
      "drivers",
      "driver:d1",
    ]);
  });
  it("nenhum papel recebe canal de outra organização ou motorista", () => {
    const all = [
      ...channelsFor(actor({ role: "SUPERMARKET", orgIds: ["m1"] })),
      ...channelsFor(actor({ role: "NGO", orgIds: ["n1"] })),
      ...channelsFor(actor({ role: "DRIVER", driverId: "d1" })),
    ];
    expect(all.filter((c) => c.startsWith("org:"))).toEqual(["org:m1", "org:n1"]);
    expect(all).not.toContain("*");
  });
  it("aviso de resgate vai às duas organizações e ao motorista", () => {
    expect(
      rescueChannels({ supermarket_id: "m1", ngo_id: "n1", driver_id: "d1" }, "drivers"),
    ).toEqual(["org:m1", "org:n1", "driver:d1", "drivers"]);
  });
});
