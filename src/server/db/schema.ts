// D1 (SQLite) port of supabase/migrations/20261001113753_ongsave_core.sql.
// Conventions: ids are text UUIDs generated in code; dates are ISO-8601 UTC strings
// (same format as Date#toISOString); booleans are 0/1 integers; jsonb and text[] are JSON text.
// Property names stay snake_case so rows keep the shape the UI already consumes.
import { relations, sql } from "drizzle-orm";
import { check, index, integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { categories, roles, statuses } from "../../lib/domain";

const list = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(","));
const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;
const createdAt = () => text("created_at").notNull().default(now);
const updatedAt = () => text("updated_at").notNull().default(now);
const clock = (column: string) => sql.raw(`${column} GLOB '[0-2][0-9]:[0-5][0-9]'`);

export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    // References the Better Auth user.id (FK added with the auth tables).
    auth_user_id: text("auth_user_id").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    role: text("role", { enum: roles }).notNull(),
    avatar_url: text("avatar_url"),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [check("profiles_role_check", sql`${t.role} in (${list(roles)})`)],
);

export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["SUPERMARKET", "NGO"] }).notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    logo_url: text("logo_url"),
    phone: text("phone"),
    email: text("email"),
    address_line: text("address_line").notNull(),
    neighborhood: text("neighborhood").notNull(),
    city: text("city").notNull().default("São Paulo"),
    state: text("state").notNull().default("SP"),
    postal_code: text("postal_code"),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [check("organizations_type_check", sql`${t.type} in ('SUPERMARKET','NGO')`)],
);

export const organizationMembers = sqliteTable(
  "organization_members",
  {
    id: text("id").primaryKey(),
    organization_id: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    profile_id: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    member_role: text("member_role").notNull().default("operator"),
    created_at: createdAt(),
  },
  (t) => [
    unique("organization_members_organization_id_profile_id_key").on(
      t.organization_id,
      t.profile_id,
    ),
    index("members_profile_idx").on(t.profile_id),
  ],
);

export const ngoPreferences = sqliteTable(
  "ngo_preferences",
  {
    id: text("id").primaryKey(),
    organization_id: text("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id),
    daily_capacity_kg: real("daily_capacity_kg").notNull().default(250),
    receiving_enabled: integer("receiving_enabled", { mode: "boolean" }).notNull().default(true),
    receiving_start: text("receiving_start").notNull().default("07:00"),
    receiving_end: text("receiving_end").notNull().default("22:00"),
    service_radius_km: real("service_radius_km").notNull().default(15),
    has_fridge: integer("has_fridge", { mode: "boolean" }).notNull().default(true),
    has_freezer: integer("has_freezer", { mode: "boolean" }).notNull().default(false),
    has_cold_room: integer("has_cold_room", { mode: "boolean" }).notNull().default(false),
    accepted_categories: text("accepted_categories", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'["produce","bakery","dry_goods"]'`),
    current_needs: text("current_needs", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'["produce"]'`),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [
    check("ngo_preferences_daily_capacity_kg_check", sql`${t.daily_capacity_kg} > 0`),
    check("ngo_preferences_check", sql`${t.receiving_start} < ${t.receiving_end}`),
    check("ngo_preferences_receiving_start_format", clock("receiving_start")),
    check("ngo_preferences_receiving_end_format", clock("receiving_end")),
    check(
      "ngo_preferences_categories_json",
      sql`json_valid(${t.accepted_categories}) and json_type(${t.accepted_categories})='array' and json_valid(${t.current_needs}) and json_type(${t.current_needs})='array'`,
    ),
  ],
);

export const drivers = sqliteTable(
  "drivers",
  {
    id: text("id").primaryKey(),
    profile_id: text("profile_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade" }),
    vehicle_type: text("vehicle_type").notNull(),
    vehicle_label: text("vehicle_label").notNull(),
    vehicle_capacity_kg: real("vehicle_capacity_kg").notNull(),
    availability: integer("availability", { mode: "boolean" }).notNull().default(true),
    mock_latitude: real("mock_latitude").notNull().default(-23.589),
    mock_longitude: real("mock_longitude").notNull().default(-46.64),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [check("drivers_vehicle_capacity_kg_check", sql`${t.vehicle_capacity_kg} > 0`)],
);

export const surplusBatches = sqliteTable(
  "surplus_batches",
  {
    id: text("id").primaryKey(),
    supermarket_id: text("supermarket_id")
      .notNull()
      .references(() => organizations.id),
    created_by: text("created_by")
      .notNull()
      .references(() => profiles.id),
    title: text("title").notNull(),
    category: text("category", { enum: categories }).notNull(),
    description: text("description"),
    image_url: text("image_url"),
    estimated_weight_kg: real("estimated_weight_kg").notNull(),
    estimated_weight_min: real("estimated_weight_min"),
    estimated_weight_max: real("estimated_weight_max"),
    estimated_quantity: real("estimated_quantity"),
    visual_condition: text("visual_condition").notNull(),
    pickup_priority: text("pickup_priority").notNull(),
    recommended_pickup_hours: integer("recommended_pickup_hours").notNull(),
    expires_at: text("expires_at").notNull(),
    status: text("status", { enum: statuses }).notNull().default("AVAILABLE"),
    ai_analysis_json: text("ai_analysis_json", { mode: "json" }),
    ai_provider: text("ai_provider"),
    ai_model: text("ai_model"),
    ai_confidence: real("ai_confidence"),
    user_confirmed: integer("user_confirmed", { mode: "boolean" }).notNull(),
    // Filled by impactForWeight() whenever estimated_weight_kg is written.
    estimated_impact_json: text("estimated_impact_json", { mode: "json" })
      .notNull()
      .default(sql`'{}'`),
    is_seed: integer("is_seed", { mode: "boolean" }).notNull().default(false),
    is_demo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    seed_kind: text("seed_kind", { enum: ["HISTORY", "AVAILABLE", "MISSION"] }),
    created_at: createdAt(),
    updated_at: updatedAt(),
    published_at: text("published_at").notNull().default(now),
  },
  (t) => [
    check("surplus_batches_category_check", sql`${t.category} in (${list(categories)})`),
    check(
      "surplus_batches_estimated_weight_kg_check",
      sql`${t.estimated_weight_kg} > 0 and ${t.estimated_weight_kg} <= 5000`,
    ),
    check(
      "surplus_batches_visual_condition_check",
      sql`${t.visual_condition} in ('acceptable','attention','not_recommended','inconclusive')`,
    ),
    check(
      "surplus_batches_pickup_priority_check",
      sql`${t.pickup_priority} in ('low','medium','high','urgent')`,
    ),
    check(
      "surplus_batches_recommended_pickup_hours_check",
      sql`${t.recommended_pickup_hours} between 1 and 72`,
    ),
    check("surplus_batches_status_check", sql`${t.status} in (${list(statuses)})`),
    check("surplus_batches_user_confirmed_check", sql`${t.user_confirmed} = 1`),
    check(
      "surplus_batches_seed_kind_check",
      sql`${t.seed_kind} in ('HISTORY','AVAILABLE','MISSION')`,
    ),
    index("batches_feed_idx").on(t.status, t.expires_at),
  ],
);

export const surplusItems = sqliteTable(
  "surplus_items",
  {
    id: text("id").primaryKey(),
    batch_id: text("batch_id")
      .notNull()
      .references(() => surplusBatches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    estimated_quantity: real("estimated_quantity"),
    confidence: real("confidence"),
    created_at: createdAt(),
  },
  (t) => [check("surplus_items_confidence_check", sql`${t.confidence} between 0 and 1`)],
);

export const donationReservations = sqliteTable("donation_reservations", {
  id: text("id").primaryKey(),
  batch_id: text("batch_id")
    .notNull()
    .unique()
    .references(() => surplusBatches.id, { onDelete: "cascade" }),
  ngo_id: text("ngo_id")
    .notNull()
    .references(() => organizations.id),
  accepted_by: text("accepted_by")
    .notNull()
    .references(() => profiles.id),
  accepted_at: text("accepted_at").notNull().default(now),
  status: text("status").notNull().default("ACTIVE"),
});

export const rescues = sqliteTable(
  "rescues",
  {
    id: text("id").primaryKey(),
    batch_id: text("batch_id")
      .notNull()
      .unique()
      .references(() => surplusBatches.id, { onDelete: "cascade" }),
    supermarket_id: text("supermarket_id")
      .notNull()
      .references(() => organizations.id),
    ngo_id: text("ngo_id")
      .notNull()
      .references(() => organizations.id),
    driver_id: text("driver_id").references(() => drivers.id),
    status: text("status", { enum: statuses }).notNull().default("WAITING_DRIVER"),
    pickup_address: text("pickup_address").notNull(),
    pickup_latitude: real("pickup_latitude").notNull(),
    pickup_longitude: real("pickup_longitude").notNull(),
    delivery_address: text("delivery_address").notNull(),
    delivery_latitude: real("delivery_latitude").notNull(),
    delivery_longitude: real("delivery_longitude").notNull(),
    mock_distance_km: real("mock_distance_km").notNull(),
    mock_eta_minutes: integer("mock_eta_minutes").notNull(),
    mock_route_geometry: text("mock_route_geometry", { mode: "json" })
      .$type<[number, number][]>()
      .notNull(),
    created_at: createdAt(),
    reserved_at: text("reserved_at"),
    driver_assigned_at: text("driver_assigned_at"),
    going_to_pickup_at: text("going_to_pickup_at"),
    arrived_pickup_at: text("arrived_pickup_at"),
    picked_up_at: text("picked_up_at"),
    in_transit_at: text("in_transit_at"),
    arrived_destination_at: text("arrived_destination_at"),
    delivered_at: text("delivered_at"),
    cancelled_at: text("cancelled_at"),
    updated_at: updatedAt(),
  },
  (t) => [
    check("rescues_status_check", sql`${t.status} in (${list(statuses)})`),
    index("rescues_driver_idx").on(t.driver_id, t.status),
    index("rescues_ngo_idx").on(t.ngo_id),
    index("rescues_market_idx").on(t.supermarket_id),
  ],
);

// Former private schema: never selected by read queries, only by services.
export const rescueTokens = sqliteTable(
  "rescue_tokens",
  {
    rescue_id: text("rescue_id")
      .primaryKey()
      .references(() => rescues.id, { onDelete: "cascade" }),
    confirmation_token: text("confirmation_token").notNull(),
    attempts: integer("attempts").notNull().default(0),
    locked_until: text("locked_until"),
  },
  (t) => [
    check(
      "rescue_tokens_confirmation_token_check",
      sql`${t.confirmation_token} GLOB '[0-9][0-9][0-9][0-9]'`,
    ),
  ],
);

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  profile_id: text("profile_id")
    .notNull()
    .references(() => profiles.id),
  image_url: text("image_url").notNull(),
  analysis: text("analysis", { mode: "json" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  created_at: createdAt(),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
});

export const rescueEvents = sqliteTable(
  "rescue_events",
  {
    id: text("id").primaryKey(),
    rescue_id: text("rescue_id")
      .notNull()
      .references(() => rescues.id, { onDelete: "cascade" }),
    event_type: text("event_type").notNull(),
    status: text("status", { enum: statuses }).notNull(),
    actor_profile_id: text("actor_profile_id").references(() => profiles.id),
    metadata: text("metadata", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'`),
    created_at: createdAt(),
  },
  (t) => [
    check("rescue_events_status_check", sql`${t.status} in (${list(statuses)})`),
    index("events_rescue_idx").on(t.rescue_id, t.created_at),
  ],
);

export const impactMetrics = sqliteTable("impact_metrics", {
  id: text("id").primaryKey(),
  rescue_id: text("rescue_id")
    .notNull()
    .unique()
    .references(() => rescues.id, { onDelete: "cascade" }),
  food_saved_kg: real("food_saved_kg").notNull(),
  estimated_meals: integer("estimated_meals").notNull(),
  estimated_disposal_savings: real("estimated_disposal_savings").notNull(),
  estimated_co2_avoided_kg: real("estimated_co2_avoided_kg").notNull(),
  estimated_water_saved_liters: real("estimated_water_saved_liters").notNull(),
  created_at: createdAt(),
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    profile_id: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    read_at: text("read_at"),
    metadata: text("metadata", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'`),
    created_at: createdAt(),
  },
  (t) => [index("notifications_profile_idx").on(t.profile_id, t.created_at)],
);

// Assertion table for atomic batches. D1 has no interactive transactions, so a
// service inserts a row here only when a business rule fails; the named CHECK
// aborts the whole batch and the constraint name tells which rule failed.
// The table is always empty.
export const guardReasons = [
  "unavailable",
  "preferences",
  "receiving_hours",
  "mission_taken",
  "vehicle",
  "driver_busy",
  "not_driver",
  "transition",
  "token_locked",
  "analysis",
] as const;
export const batchGuards = sqliteTable("batch_guards", { reason: text("reason").notNull() }, (t) =>
  guardReasons.map((r) => check(`guard_${r}`, sql`${t.reason} <> ${sql.raw(`'${r}'`)}`)),
);

export const rescuesRelations = relations(rescues, ({ one, many }) => ({
  surplus_batches: one(surplusBatches, {
    fields: [rescues.batch_id],
    references: [surplusBatches.id],
  }),
  impact_metrics: many(impactMetrics),
  rescue_events: many(rescueEvents),
}));
export const surplusBatchesRelations = relations(surplusBatches, ({ many }) => ({
  surplus_items: many(surplusItems),
}));
export const surplusItemsRelations = relations(surplusItems, ({ one }) => ({
  batch: one(surplusBatches, { fields: [surplusItems.batch_id], references: [surplusBatches.id] }),
}));
export const impactMetricsRelations = relations(impactMetrics, ({ one }) => ({
  rescue: one(rescues, { fields: [impactMetrics.rescue_id], references: [rescues.id] }),
}));
export const rescueEventsRelations = relations(rescueEvents, ({ one }) => ({
  rescue: one(rescues, { fields: [rescueEvents.rescue_id], references: [rescues.id] }),
}));
