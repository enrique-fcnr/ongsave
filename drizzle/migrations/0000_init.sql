CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`image_url` text NOT NULL,
	`analysis` text,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `batch_guards` (
	`reason` text NOT NULL,
	CONSTRAINT "guard_unavailable" CHECK("batch_guards"."reason" <> 'unavailable'),
	CONSTRAINT "guard_preferences" CHECK("batch_guards"."reason" <> 'preferences'),
	CONSTRAINT "guard_receiving_hours" CHECK("batch_guards"."reason" <> 'receiving_hours'),
	CONSTRAINT "guard_mission_taken" CHECK("batch_guards"."reason" <> 'mission_taken'),
	CONSTRAINT "guard_vehicle" CHECK("batch_guards"."reason" <> 'vehicle'),
	CONSTRAINT "guard_driver_busy" CHECK("batch_guards"."reason" <> 'driver_busy'),
	CONSTRAINT "guard_not_driver" CHECK("batch_guards"."reason" <> 'not_driver'),
	CONSTRAINT "guard_transition" CHECK("batch_guards"."reason" <> 'transition'),
	CONSTRAINT "guard_token_locked" CHECK("batch_guards"."reason" <> 'token_locked'),
	CONSTRAINT "guard_analysis" CHECK("batch_guards"."reason" <> 'analysis')
);
--> statement-breakpoint
CREATE TABLE `donation_reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`ngo_id` text NOT NULL,
	`accepted_by` text NOT NULL,
	`accepted_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `surplus_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ngo_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accepted_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `donation_reservations_batch_id_unique` ON `donation_reservations` (`batch_id`);--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`vehicle_label` text NOT NULL,
	`vehicle_capacity_kg` real NOT NULL,
	`availability` integer DEFAULT true NOT NULL,
	`mock_latitude` real DEFAULT -23.589 NOT NULL,
	`mock_longitude` real DEFAULT -46.64 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "drivers_vehicle_capacity_kg_check" CHECK("drivers"."vehicle_capacity_kg" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `drivers_profile_id_unique` ON `drivers` (`profile_id`);--> statement-breakpoint
CREATE TABLE `impact_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`rescue_id` text NOT NULL,
	`food_saved_kg` real NOT NULL,
	`estimated_meals` integer NOT NULL,
	`estimated_disposal_savings` real NOT NULL,
	`estimated_co2_avoided_kg` real NOT NULL,
	`estimated_water_saved_liters` real NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`rescue_id`) REFERENCES `rescues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `impact_metrics_rescue_id_unique` ON `impact_metrics` (`rescue_id`);--> statement-breakpoint
CREATE TABLE `ngo_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`daily_capacity_kg` real DEFAULT 250 NOT NULL,
	`receiving_enabled` integer DEFAULT true NOT NULL,
	`receiving_start` text DEFAULT '07:00' NOT NULL,
	`receiving_end` text DEFAULT '22:00' NOT NULL,
	`service_radius_km` real DEFAULT 15 NOT NULL,
	`has_fridge` integer DEFAULT true NOT NULL,
	`has_freezer` integer DEFAULT false NOT NULL,
	`has_cold_room` integer DEFAULT false NOT NULL,
	`accepted_categories` text DEFAULT '["produce","bakery","dry_goods"]' NOT NULL,
	`current_needs` text DEFAULT '["produce"]' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ngo_preferences_daily_capacity_kg_check" CHECK("ngo_preferences"."daily_capacity_kg" > 0),
	CONSTRAINT "ngo_preferences_check" CHECK("ngo_preferences"."receiving_start" < "ngo_preferences"."receiving_end"),
	CONSTRAINT "ngo_preferences_receiving_start_format" CHECK(receiving_start GLOB '[0-2][0-9]:[0-5][0-9]'),
	CONSTRAINT "ngo_preferences_receiving_end_format" CHECK(receiving_end GLOB '[0-2][0-9]:[0-5][0-9]'),
	CONSTRAINT "ngo_preferences_categories_json" CHECK(json_valid("ngo_preferences"."accepted_categories") and json_type("ngo_preferences"."accepted_categories")='array' and json_valid("ngo_preferences"."current_needs") and json_type("ngo_preferences"."current_needs")='array')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ngo_preferences_organization_id_unique` ON `ngo_preferences` (`organization_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`read_at` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_profile_idx` ON `notifications` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`member_role` text DEFAULT 'operator' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `members_profile_idx` ON `organization_members` (`profile_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_members_organization_id_profile_id_key` ON `organization_members` (`organization_id`,`profile_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`logo_url` text,
	`phone` text,
	`email` text,
	`address_line` text NOT NULL,
	`neighborhood` text NOT NULL,
	`city` text DEFAULT 'São Paulo' NOT NULL,
	`state` text DEFAULT 'SP' NOT NULL,
	`postal_code` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "organizations_type_check" CHECK("organizations"."type" in ('SUPERMARKET','NGO'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`avatar_url` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "profiles_role_check" CHECK("profiles"."role" in ('SUPERMARKET','NGO','DRIVER','ADMIN'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_auth_user_id_unique` ON `profiles` (`auth_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);--> statement-breakpoint
CREATE TABLE `rescue_events` (
	`id` text PRIMARY KEY NOT NULL,
	`rescue_id` text NOT NULL,
	`event_type` text NOT NULL,
	`status` text NOT NULL,
	`actor_profile_id` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`rescue_id`) REFERENCES `rescues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "rescue_events_status_check" CHECK("rescue_events"."status" in ('AVAILABLE','RESERVED','WAITING_DRIVER','DRIVER_ASSIGNED','GOING_TO_PICKUP','AT_PICKUP','PICKED_UP','IN_TRANSIT','AT_DESTINATION','DELIVERED','CANCELLED'))
);
--> statement-breakpoint
CREATE INDEX `events_rescue_idx` ON `rescue_events` (`rescue_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `rescue_tokens` (
	`rescue_id` text PRIMARY KEY NOT NULL,
	`confirmation_token` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	FOREIGN KEY (`rescue_id`) REFERENCES `rescues`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "rescue_tokens_confirmation_token_check" CHECK("rescue_tokens"."confirmation_token" GLOB '[0-9][0-9][0-9][0-9]')
);
--> statement-breakpoint
CREATE TABLE `rescues` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`supermarket_id` text NOT NULL,
	`ngo_id` text NOT NULL,
	`driver_id` text,
	`status` text DEFAULT 'WAITING_DRIVER' NOT NULL,
	`pickup_address` text NOT NULL,
	`pickup_latitude` real NOT NULL,
	`pickup_longitude` real NOT NULL,
	`delivery_address` text NOT NULL,
	`delivery_latitude` real NOT NULL,
	`delivery_longitude` real NOT NULL,
	`mock_distance_km` real NOT NULL,
	`mock_eta_minutes` integer NOT NULL,
	`mock_route_geometry` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`reserved_at` text,
	`driver_assigned_at` text,
	`going_to_pickup_at` text,
	`arrived_pickup_at` text,
	`picked_up_at` text,
	`in_transit_at` text,
	`arrived_destination_at` text,
	`delivered_at` text,
	`cancelled_at` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `surplus_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supermarket_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ngo_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "rescues_status_check" CHECK("rescues"."status" in ('AVAILABLE','RESERVED','WAITING_DRIVER','DRIVER_ASSIGNED','GOING_TO_PICKUP','AT_PICKUP','PICKED_UP','IN_TRANSIT','AT_DESTINATION','DELIVERED','CANCELLED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rescues_batch_id_unique` ON `rescues` (`batch_id`);--> statement-breakpoint
CREATE INDEX `rescues_driver_idx` ON `rescues` (`driver_id`,`status`);--> statement-breakpoint
CREATE INDEX `rescues_ngo_idx` ON `rescues` (`ngo_id`);--> statement-breakpoint
CREATE INDEX `rescues_market_idx` ON `rescues` (`supermarket_id`);--> statement-breakpoint
CREATE TABLE `surplus_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`supermarket_id` text NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`image_url` text,
	`estimated_weight_kg` real NOT NULL,
	`estimated_weight_min` real,
	`estimated_weight_max` real,
	`estimated_quantity` real,
	`visual_condition` text NOT NULL,
	`pickup_priority` text NOT NULL,
	`recommended_pickup_hours` integer NOT NULL,
	`expires_at` text NOT NULL,
	`status` text DEFAULT 'AVAILABLE' NOT NULL,
	`ai_analysis_json` text,
	`ai_provider` text,
	`ai_model` text,
	`ai_confidence` real,
	`user_confirmed` integer NOT NULL,
	`estimated_impact_json` text DEFAULT '{}' NOT NULL,
	`is_seed` integer DEFAULT false NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`seed_kind` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`published_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`supermarket_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "surplus_batches_category_check" CHECK("surplus_batches"."category" in ('produce','bakery','dairy','prepared_food','dry_goods','frozen','other')),
	CONSTRAINT "surplus_batches_estimated_weight_kg_check" CHECK("surplus_batches"."estimated_weight_kg" > 0 and "surplus_batches"."estimated_weight_kg" <= 5000),
	CONSTRAINT "surplus_batches_visual_condition_check" CHECK("surplus_batches"."visual_condition" in ('acceptable','attention','not_recommended','inconclusive')),
	CONSTRAINT "surplus_batches_pickup_priority_check" CHECK("surplus_batches"."pickup_priority" in ('low','medium','high','urgent')),
	CONSTRAINT "surplus_batches_recommended_pickup_hours_check" CHECK("surplus_batches"."recommended_pickup_hours" between 1 and 72),
	CONSTRAINT "surplus_batches_status_check" CHECK("surplus_batches"."status" in ('AVAILABLE','RESERVED','WAITING_DRIVER','DRIVER_ASSIGNED','GOING_TO_PICKUP','AT_PICKUP','PICKED_UP','IN_TRANSIT','AT_DESTINATION','DELIVERED','CANCELLED')),
	CONSTRAINT "surplus_batches_user_confirmed_check" CHECK("surplus_batches"."user_confirmed" = 1),
	CONSTRAINT "surplus_batches_seed_kind_check" CHECK("surplus_batches"."seed_kind" in ('HISTORY','AVAILABLE','MISSION'))
);
--> statement-breakpoint
CREATE INDEX `batches_feed_idx` ON `surplus_batches` (`status`,`expires_at`);--> statement-breakpoint
CREATE TABLE `surplus_items` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`name` text NOT NULL,
	`estimated_quantity` real,
	`confidence` real,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `surplus_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "surplus_items_confidence_check" CHECK("surplus_items"."confidence" between 0 and 1)
);
