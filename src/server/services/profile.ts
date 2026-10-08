// Direct writes the original grants allowed, and nothing else:
//   grant update(phone,name) on profiles               (own profile)
//   grant update(...) on ngo_preferences               (own NGO, role NGO)
//   grant update(availability) on drivers              (own driver row)
import { z } from "zod";
import { categories } from "@/lib/domain";
import { runAtomic, type Db } from "../db/client";
import type { Actor } from "../permissions";

const hhmm = z.string().regex(/^[0-2]\d:[0-5]\d$/);
export const profileUpdateSchema = z
  .object({
    profile: z.strictObject({ name: z.string().min(2).max(100), phone: z.string().max(25) }),
    preferences: z
      .strictObject({
        daily_capacity_kg: z.number().positive().max(100000),
        receiving_enabled: z.boolean(),
        receiving_start: hhmm,
        receiving_end: hhmm,
        service_radius_km: z.number().nonnegative().max(500),
        has_fridge: z.boolean(),
        has_freezer: z.boolean(),
        has_cold_room: z.boolean(),
        accepted_categories: z.array(z.enum(categories)).max(categories.length),
        current_needs: z.array(z.enum(categories)).max(categories.length),
      })
      .partial()
      .optional(),
    driver: z.strictObject({ availability: z.boolean() }).optional(),
  })
  .strict();
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

const json = (v: unknown) =>
  Array.isArray(v) ? JSON.stringify(v) : typeof v === "boolean" ? Number(v) : v;

export async function updateOwnProfile(db: Db, actor: Actor, input: ProfileUpdate) {
  const { profile, preferences, driver } = profileUpdateSchema.parse(input);
  const now = new Date().toISOString();
  const statements = [
    db.$client
      .prepare("UPDATE profiles SET name=?, phone=?, updated_at=? WHERE id=?")
      .bind(profile.name, profile.phone || null, now, actor.profileId),
  ];
  if (preferences && Object.keys(preferences).length) {
    // Policy update_preferences: member(organization_id) and actor_role()='NGO'.
    if (actor.role !== "NGO" || !actor.orgIds.length)
      throw new Error("Seu perfil não pode realizar esta ação.");
    const columns = Object.keys(preferences) as (keyof typeof preferences)[];
    if (
      preferences.receiving_start &&
      preferences.receiving_end &&
      preferences.receiving_start >= preferences.receiving_end
    )
      throw new Error("O horário de término precisa ser posterior ao início.");
    statements.push(
      db.$client
        .prepare(
          `UPDATE ngo_preferences SET ${columns.map((c) => `${c}=?`).join(", ")}, updated_at=?
           WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id=?)`,
        )
        .bind(...columns.map((c) => json(preferences[c])), now, actor.profileId),
    );
  }
  if (driver) {
    if (actor.role !== "DRIVER") throw new Error("Seu perfil não pode realizar esta ação.");
    statements.push(
      db.$client
        .prepare("UPDATE drivers SET availability=?, updated_at=? WHERE profile_id=?")
        .bind(Number(driver.availability), now, actor.profileId),
    );
  }
  await runAtomic(db, statements);
}
