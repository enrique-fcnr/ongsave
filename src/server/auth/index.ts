import "server-only";
import { getDb } from "../db/client";
import { createAuth, type Auth } from "./auth";

const instances = new WeakMap<D1Database, Auth>();

export function authOptions() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!secret || !baseURL) throw new Error("Configure BETTER_AUTH_SECRET e BETTER_AUTH_URL.");
  const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return { secret, baseURL, trustedOrigins };
}

export function getAuth(): Auth {
  const db = getDb();
  let auth = instances.get(db.$client);
  if (!auth) {
    auth = createAuth(db, authOptions());
    instances.set(db.$client, auth);
  }
  return auth;
}
