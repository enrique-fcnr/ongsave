// Who hears what. A message only says "something changed in <scope>"; the browser then
// re-fetches through the server, which applies the permissions. No data travels here.
import type { Actor } from "../permissions";

export type Channel = string;
export const ALL = "*";

// Channels a session may join, computed on the server from role and memberships.
export function channelsFor(actor: Actor): Channel[] {
  const channels = [`profile:${actor.profileId}`, ...actor.orgIds.map((id) => `org:${id}`)];
  if (actor.role === "NGO") channels.push("ngos");
  if (actor.role === "DRIVER") {
    channels.push("drivers");
    if (actor.driverId) channels.push(`driver:${actor.driverId}`);
  }
  return channels;
}

type RescueScope = { supermarket_id: string; ngo_id: string; driver_id?: string | null };
export const rescueChannels = (r: RescueScope, ...extra: Channel[]) => [
  `org:${r.supermarket_id}`,
  `org:${r.ngo_id}`,
  ...(r.driver_id ? [`driver:${r.driver_id}`] : []),
  ...extra,
];
