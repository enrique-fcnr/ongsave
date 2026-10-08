import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// True when the Worker has its database binding and the auth secret.
export function isConfigured() {
  try {
    return Boolean(getCloudflareContext().env.DB && process.env.BETTER_AUTH_SECRET);
  } catch {
    return false;
  }
}
