import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, type Db } from "@/server/db/client";
import { getAuth } from "@/server/auth";
import type { Auth } from "@/server/auth/auth";
import { isConfigured } from "@/server/config";
import { loadActor, type Actor } from "@/server/permissions";
import { organizations, profiles } from "@/server/db/schema";
import type { Organization, Profile } from "./domain";
// Session → profile → organization, or where to send the visitor instead.
export type ProfileContext = {
  db: Db;
  actor: Actor;
  profile: Profile;
  organization: Organization | undefined;
};
export async function resolveProfile(
  db: Db,
  auth: Auth,
  requestHeaders: Headers,
): Promise<ProfileContext | { redirect: string }> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return { redirect: "/login" };
  const actor = await loadActor(db, session.user.id);
  if (!actor) return { redirect: "/login?profile=missing" };
  const [profile, organization] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.id, actor.profileId) }),
    actor.orgIds[0]
      ? db.query.organizations.findFirst({ where: eq(organizations.id, actor.orgIds[0]) })
      : undefined,
  ]);
  return {
    db,
    actor,
    profile: profile as Profile,
    organization: organization as Organization | undefined,
  };
}
export const requireProfile = cache(async function requireProfile() {
  if (!isConfigured()) redirect("/login?setup=1");
  const result = await resolveProfile(getDb(), getAuth(), await headers());
  if ("redirect" in result) redirect(result.redirect);
  return result;
});
