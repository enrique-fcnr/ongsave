import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Channel } from "./channels";
import { HUB_NAME } from "./hub-name";

// Fire-and-forget after a successful write. A failed notice never fails the operation:
// it is logged and the clients' 15 s refresh picks the change up.
export function notify(channels: Channel[]) {
  if (!channels.length) return;
  try {
    const { env, ctx } = getCloudflareContext();
    const hub = env.REALTIME.get(env.REALTIME.idFromName(HUB_NAME));
    const sent = hub
      .fetch("https://realtime/notify", {
        method: "POST",
        body: JSON.stringify({ channels: [...new Set(channels)] }),
      })
      .then(() => undefined)
      .catch((error: unknown) => console.warn("realtime notify failed", error));
    ctx.waitUntil(sent);
  } catch (error) {
    console.warn("realtime notify unavailable", error);
  }
}
