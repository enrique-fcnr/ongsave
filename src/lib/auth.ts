import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { serverClient } from "./supabase/server";
import { isConfigured } from "./supabase/config";
import type { Organization, Profile } from "./domain";
export const requireProfile = cache(async function requireProfile() {
  if (!isConfigured()) redirect("/login?setup=1");
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();
  if (error || !data) redirect("/login?profile=missing");
  const profile = data as Profile;
  const { data: members } = await client
    .from("organization_members")
    .select("organizations(*)")
    .eq("profile_id", profile.id);
  const organization = members?.[0]?.organizations as unknown as Organization | undefined;
  return { client, profile, organization };
});
