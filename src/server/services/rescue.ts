// Ports of the plpgsql RPCs of the original Postgres schema (docs/legacy-*/…_ongsave_core.sql).
// Pattern for every function that used FOR UPDATE: read and validate (for the friendly
// error), then one D1 batch whose guards re-check the same rules inside the transaction.
// Nothing is written outside a guarded batch, so concurrent calls cannot both win.
import { z } from "zod";
import { publicationSchema } from "@/lib/ai/schema";
import { driverActions, type RescueStatus } from "@/lib/domain";
import { GuardError, guard, runAtomic, type Db, type GuardReason } from "../db/client";
import { impactForWeight, round } from "../db/impact";
import { saoPauloClock, saoPauloDay } from "../db/time";
import { member, type Actor } from "../permissions";

// gen_random_uuid() for set-based INSERT ... SELECT.
export const UUID_SQL = `lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-'||substr('89ab',1+(abs(random())%4),1)||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))`;

// lpad(floor(random()*10000)::text,4,'0'), with a CSPRNG.
export function newDeliveryToken() {
  const [n] = crypto.getRandomValues(new Uint32Array(1));
  return String(n % 10000).padStart(4, "0");
}

async function atomic(
  db: Db,
  statements: D1PreparedStatement[],
  messages: Partial<Record<GuardReason, string>>,
) {
  try {
    return await runAtomic(db, statements);
  } catch (error) {
    if (error instanceof GuardError && messages[error.reason])
      throw new Error(messages[error.reason]);
    if (
      error instanceof Error &&
      /UNIQUE constraint failed: (donation_reservations|rescues)\.batch_id/.test(
        `${error.message} ${error.cause ?? ""}`,
      )
    )
      throw new Error("Esta doação não está mais disponível");
    throw error;
  }
}

type OrgRow = {
  id: string;
  name: string;
  type: string;
  address_line: string;
  latitude: number;
  longitude: number;
};

async function ownOrganization(db: Db, actor: Actor, type: "SUPERMARKET" | "NGO") {
  return db.$client
    .prepare(
      `SELECT o.* FROM organization_members m JOIN organizations o ON o.id=m.organization_id
       WHERE m.profile_id=? AND o.type=? LIMIT 1`,
    )
    .bind(actor.profileId, type)
    .first<OrgRow>();
}

const notifyMembers = (
  db: Db,
  orgs: string[],
  type: string,
  title: string,
  body: string,
  metadata: object,
  now: string,
) =>
  db.$client
    .prepare(
      `INSERT INTO notifications(id,profile_id,type,title,body,metadata,created_at)
       SELECT ${UUID_SQL},profile_id,?,?,?,?,? FROM organization_members
       WHERE organization_id IN (${orgs.map(() => "?").join(",")})`,
    )
    .bind(type, title, body, JSON.stringify(metadata), now, ...orgs);

const notifyRole = (
  db: Db,
  role: string,
  type: string,
  title: string,
  body: string,
  metadata: object,
  now: string,
) =>
  db.$client
    .prepare(
      `INSERT INTO notifications(id,profile_id,type,title,body,metadata,created_at)
       SELECT ${UUID_SQL},id,?,?,?,?,? FROM profiles WHERE role=?`,
    )
    .bind(type, title, body, JSON.stringify(metadata), now, role);

const event = (
  db: Db,
  rescueId: string,
  status: string,
  actorId: string | null,
  now: string,
  metadata: object = {},
) =>
  db.$client
    .prepare(
      "INSERT INTO rescue_events(id,rescue_id,event_type,status,actor_profile_id,metadata,created_at) VALUES(?,?,?,?,?,?,?)",
    )
    .bind(crypto.randomUUID(), rescueId, status, status, actorId, JSON.stringify(metadata), now);

// private.publish_surplus
export const publishPayloadSchema = publicationSchema;
export async function publishSurplus(
  db: Db,
  actor: Actor,
  payload: z.infer<typeof publicationSchema>,
  analysisId: string,
  now = new Date(),
) {
  if (actor.role !== "SUPERMARKET") throw new Error("Apenas supermercados publicam excedentes");
  const org = await ownOrganization(db, actor, "SUPERMARKET");
  if (!org) throw new Error("Organização não encontrada");
  const analysis = await db.$client
    .prepare("SELECT * FROM analyses WHERE id=? AND profile_id=?")
    .bind(analysisId, actor.profileId)
    .first<{
      id: string;
      image_url: string;
      analysis: string | null;
      provider: string;
      model: string;
      published: number;
    }>();
  if (!analysis || analysis.published) throw new Error("Fotografia ausente ou já publicada");
  if (payload.user_confirmed !== true) throw new Error("Revise as informações antes de publicar");
  if (payload.title.length < 3 || payload.title.length > 120 || payload.items.length > 30)
    throw new Error("Dados inválidos");
  const ai = analysis.analysis
    ? (JSON.parse(analysis.analysis) as {
        estimated_weight_range?: { min?: number; max?: number };
        confidence?: number;
      })
    : null;
  const id = crypto.randomUUID();
  const at = now.toISOString();
  const hours = payload.recommended_pickup_hours;
  const weight = payload.estimated_weight_kg;
  await atomic(
    db,
    [
      guard(
        db,
        "analysis",
        "EXISTS (SELECT 1 FROM analyses WHERE id=? AND profile_id=? AND published=0)",
        analysisId,
        actor.profileId,
      ),
      db.$client
        .prepare(
          `INSERT INTO surplus_batches(id,supermarket_id,created_by,title,category,description,image_url,
             estimated_weight_kg,estimated_weight_min,estimated_weight_max,visual_condition,pickup_priority,
             recommended_pickup_hours,expires_at,ai_analysis_json,ai_provider,ai_model,ai_confidence,user_confirmed,
             estimated_impact_json,is_demo,created_at,updated_at,published_at)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?)`,
        )
        .bind(
          id,
          org.id,
          actor.profileId,
          payload.title,
          payload.category,
          payload.description,
          analysis.image_url,
          weight,
          ai?.estimated_weight_range?.min ?? null,
          ai?.estimated_weight_range?.max ?? null,
          payload.visual_condition,
          payload.pickup_priority,
          hours,
          new Date(now.getTime() + hours * 3600000).toISOString(),
          analysis.analysis,
          analysis.provider,
          analysis.model,
          ai?.confidence ?? null,
          JSON.stringify(impactForWeight(weight)),
          Number(actor.email === "mercado@ongsave.demo"),
          at,
          at,
          at,
        ),
      ...payload.items.map((item) =>
        db.$client
          .prepare(
            "INSERT INTO surplus_items(id,batch_id,name,estimated_quantity,confidence,created_at) VALUES(?,?,?,?,?,?)",
          )
          .bind(crypto.randomUUID(), id, item.name, item.estimated_quantity, item.confidence, at),
      ),
      db.$client.prepare("UPDATE analyses SET published=1 WHERE id=?").bind(analysisId),
      notifyRole(
        db,
        "NGO",
        "BATCH_AVAILABLE",
        "Nova doação disponível",
        `${weight} kg de ${payload.title}`,
        { batch_id: id },
        at,
      ),
    ],
    { analysis: "Fotografia ausente ou já publicada" },
  );
  return id;
}

// private.reserve_donation
export async function reserveDonation(db: Db, actor: Actor, batchId: string, now = new Date()) {
  const unavailable = "Esta doação não está mais disponível";
  const preferences = "Confira a capacidade e as preferências de recebimento";
  const hoursMessage = "Instituição fora do horário de recebimento";
  if (actor.role !== "NGO") throw new Error("Apenas ONGs podem aceitar doações");
  const at = now.toISOString();
  const batch = await db.$client
    .prepare("SELECT * FROM surplus_batches WHERE id=?")
    .bind(batchId)
    .first<{
      id: string;
      status: string;
      expires_at: string;
      category: string;
      estimated_weight_kg: number;
      supermarket_id: string;
      title: string;
    }>();
  if (!batch || batch.status !== "AVAILABLE" || batch.expires_at <= at)
    throw new Error(unavailable);
  const ngo = await ownOrganization(db, actor, "NGO");
  if (!ngo) throw new Error("Instituição não encontrada");
  const day = saoPauloDay(now);
  const clock = saoPauloClock(now);
  // Daily load: weight of the NGO's non-cancelled rescues created today in São Paulo.
  const todayWeight = `(SELECT coalesce(sum(sb.estimated_weight_kg),0) FROM rescues r JOIN surplus_batches sb ON sb.id=r.batch_id
     WHERE r.ngo_id=p.organization_id AND r.status<>'CANCELLED' AND r.created_at>=? AND r.created_at<?)`;
  const fits = `p.receiving_enabled=1
     AND EXISTS (SELECT 1 FROM json_each(p.accepted_categories) WHERE value=(SELECT category FROM surplus_batches WHERE id=?))
     AND ${todayWeight} + (SELECT estimated_weight_kg FROM surplus_batches WHERE id=?) <= p.daily_capacity_kg`;
  const prefs = await db.$client
    .prepare(
      `SELECT (${fits}) AS fits, (? BETWEEN p.receiving_start||':00' AND p.receiving_end||':00') AS open
       FROM ngo_preferences p WHERE p.organization_id=?`,
    )
    .bind(batchId, day.start, day.end, batchId, clock, ngo.id)
    .first<{ fits: number; open: number }>();
  if (!prefs || !prefs.fits) throw new Error(preferences);
  if (!prefs.open) throw new Error(hoursMessage);
  const market = (await db.$client
    .prepare("SELECT * FROM organizations WHERE id=?")
    .bind(batch.supermarket_id)
    .first<OrgRow>())!;
  const rescueId = crypto.randomUUID();
  const distance =
    round(
      Math.sqrt((market.latitude - ngo.latitude) ** 2 + (market.longitude - ngo.longitude) ** 2) *
        111 *
        1.3,
      1,
    ) + 0.5;
  const route = [
    [market.longitude, market.latitude],
    [market.longitude, ngo.latitude],
    [ngo.longitude, ngo.latitude],
  ];
  await atomic(
    db,
    [
      guard(
        db,
        "unavailable",
        "EXISTS (SELECT 1 FROM surplus_batches WHERE id=? AND status='AVAILABLE' AND expires_at>?)",
        batchId,
        at,
      ),
      guard(
        db,
        "preferences",
        `EXISTS (SELECT 1 FROM ngo_preferences p WHERE p.organization_id=? AND ${fits})`,
        ngo.id,
        batchId,
        day.start,
        day.end,
        batchId,
      ),
      guard(
        db,
        "receiving_hours",
        "EXISTS (SELECT 1 FROM ngo_preferences p WHERE p.organization_id=? AND ? BETWEEN p.receiving_start||':00' AND p.receiving_end||':00')",
        ngo.id,
        clock,
      ),
      db.$client
        .prepare(
          "INSERT INTO donation_reservations(id,batch_id,ngo_id,accepted_by,accepted_at) VALUES(?,?,?,?,?)",
        )
        .bind(crypto.randomUUID(), batchId, ngo.id, actor.profileId, at),
      db.$client
        .prepare(
          `INSERT INTO rescues(id,batch_id,supermarket_id,ngo_id,pickup_address,pickup_latitude,pickup_longitude,
             delivery_address,delivery_latitude,delivery_longitude,mock_distance_km,mock_eta_minutes,mock_route_geometry,
             reserved_at,created_at,updated_at)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,14,?,?,?,?)`,
        )
        .bind(
          rescueId,
          batchId,
          market.id,
          ngo.id,
          market.address_line,
          market.latitude,
          market.longitude,
          ngo.address_line,
          ngo.latitude,
          ngo.longitude,
          distance,
          JSON.stringify(route),
          at,
          at,
          at,
        ),
      // Former trigger init_rescue_token.
      db.$client
        .prepare("INSERT INTO rescue_tokens(rescue_id,confirmation_token) VALUES(?,?)")
        .bind(rescueId, newDeliveryToken()),
      db.$client
        .prepare("UPDATE surplus_batches SET status='RESERVED',updated_at=? WHERE id=?")
        .bind(at, batchId),
      event(db, rescueId, "RESERVED", actor.profileId, at),
      event(db, rescueId, "WAITING_DRIVER", actor.profileId, at),
      notifyMembers(
        db,
        [market.id],
        "DONATION_RESERVED",
        `${ngo.name} aceitou sua doação`,
        batch.title,
        { rescue_id: rescueId },
        at,
      ),
      notifyRole(
        db,
        "DRIVER",
        "MISSION_AVAILABLE",
        "Nova missão próxima",
        `${market.name} → ${ngo.name}`,
        { rescue_id: rescueId },
        at,
      ),
    ],
    { unavailable, preferences, receiving_hours: hoursMessage },
  );
  return rescueId;
}

type RescueRow = {
  id: string;
  batch_id: string;
  supermarket_id: string;
  ngo_id: string;
  driver_id: string | null;
  status: RescueStatus;
};

// private.accept_mission
export async function acceptMission(db: Db, actor: Actor, rescueId: string, now = new Date()) {
  const taken = "Outro motorista já aceitou esta missão";
  const vehicle = "Veículo indisponível ou capacidade insuficiente";
  const busy = "Conclua sua missão atual primeiro";
  if (actor.role !== "DRIVER") throw new Error("Apenas motoristas podem aceitar missões");
  const rescue = await db.$client
    .prepare("SELECT * FROM rescues WHERE id=?")
    .bind(rescueId)
    .first<RescueRow>();
  if (!rescue || rescue.status !== "WAITING_DRIVER") throw new Error(taken);
  const driver = await db.$client
    .prepare(
      "SELECT d.*, p.name AS driver_name FROM drivers d JOIN profiles p ON p.id=d.profile_id WHERE d.profile_id=?",
    )
    .bind(actor.profileId)
    .first<{
      id: string;
      availability: number;
      vehicle_capacity_kg: number;
      driver_name: string;
    }>();
  const weight = (await db.$client
    .prepare("SELECT estimated_weight_kg AS w FROM surplus_batches WHERE id=?")
    .bind(rescue.batch_id)
    .first<{ w: number }>())!.w;
  if (!driver || !driver.availability || driver.vehicle_capacity_kg < weight)
    throw new Error(vehicle);
  const active = await db.$client
    .prepare(
      "SELECT 1 FROM rescues WHERE driver_id=? AND status NOT IN ('DELIVERED','CANCELLED') LIMIT 1",
    )
    .bind(driver.id)
    .first();
  if (active) throw new Error(busy);
  const at = now.toISOString();
  await atomic(
    db,
    [
      guard(
        db,
        "mission_taken",
        "EXISTS (SELECT 1 FROM rescues WHERE id=? AND status='WAITING_DRIVER')",
        rescueId,
      ),
      guard(
        db,
        "vehicle",
        "EXISTS (SELECT 1 FROM drivers WHERE id=? AND availability=1 AND vehicle_capacity_kg>=(SELECT estimated_weight_kg FROM surplus_batches WHERE id=?))",
        driver.id,
        rescue.batch_id,
      ),
      guard(
        db,
        "driver_busy",
        "NOT EXISTS (SELECT 1 FROM rescues WHERE driver_id=? AND status NOT IN ('DELIVERED','CANCELLED'))",
        driver.id,
      ),
      db.$client
        .prepare(
          "UPDATE rescues SET driver_id=?,status='DRIVER_ASSIGNED',driver_assigned_at=?,updated_at=? WHERE id=?",
        )
        .bind(driver.id, at, at, rescueId),
      event(db, rescueId, "DRIVER_ASSIGNED", actor.profileId, at, {
        driver_name: driver.driver_name,
      }),
      notifyMembers(
        db,
        [rescue.supermarket_id, rescue.ngo_id],
        "DRIVER_ASSIGNED",
        `${driver.driver_name} aceitou o resgate`,
        "A coleta será iniciada em breve.",
        { rescue_id: rescueId },
        at,
      ),
    ],
    { mission_taken: taken, vehicle, driver_busy: busy },
  );
}

const timestampColumn: Partial<Record<RescueStatus, string>> = {
  GOING_TO_PICKUP: "going_to_pickup_at",
  AT_PICKUP: "arrived_pickup_at",
  PICKED_UP: "picked_up_at",
  IN_TRANSIT: "in_transit_at",
  AT_DESTINATION: "arrived_destination_at",
  DELIVERED: "delivered_at",
};
// Exactly the six transitions accepted by private.advance_rescue.
export function driverTransitionAllowed(from: RescueStatus, to: RescueStatus) {
  return (from === "AT_DESTINATION" && to === "DELIVERED") || driverActions[from]?.next === to;
}

// private.advance_rescue: false only for a wrong/missing delivery code.
export async function advanceRescue(
  db: Db,
  actor: Actor,
  rescueId: string,
  next: RescueStatus,
  token: string | null = null,
  now = new Date(),
) {
  const notDriver = "Você não é o motorista deste resgate";
  const invalid = "Transição de status inválida";
  const locked = "Muitas tentativas. Aguarde 1 minuto";
  const rescue = await db.$client
    .prepare("SELECT * FROM rescues WHERE id=?")
    .bind(rescueId)
    .first<RescueRow>();
  if (!rescue || actor.role !== "DRIVER" || !actor.driverId || rescue.driver_id !== actor.driverId)
    throw new Error(notDriver);
  const previous = rescue.status;
  if (!driverTransitionAllowed(previous, next)) throw new Error(invalid);
  const at = now.toISOString();
  if (next === "DELIVERED") {
    const row = await db.$client
      .prepare("SELECT confirmation_token, locked_until FROM rescue_tokens WHERE rescue_id=?")
      .bind(rescueId)
      .first<{ confirmation_token: string; locked_until: string | null }>();
    if (row?.locked_until && row.locked_until > at) throw new Error(locked);
    if (!token || !/^\d{4}$/.test(token) || token !== row?.confirmation_token) {
      // Wrong code: count the attempt; every 5th locks for one minute. No impact, no status change.
      await db.$client
        .prepare(
          "UPDATE rescue_tokens SET attempts=attempts+1, locked_until=CASE WHEN (attempts+1)%5=0 THEN ? ELSE NULL END WHERE rescue_id=?",
        )
        .bind(new Date(now.getTime() + 60000).toISOString(), rescueId)
        .run();
      return false;
    }
  }
  const column = timestampColumn[next]!;
  const statements = [
    guard(
      db,
      "not_driver",
      "EXISTS (SELECT 1 FROM rescues WHERE id=? AND driver_id=?)",
      rescueId,
      actor.driverId,
    ),
    guard(
      db,
      "transition",
      "EXISTS (SELECT 1 FROM rescues WHERE id=? AND status=?)",
      rescueId,
      previous,
    ),
    ...(next === "DELIVERED"
      ? [
          guard(
            db,
            "token_locked",
            "EXISTS (SELECT 1 FROM rescue_tokens WHERE rescue_id=? AND confirmation_token=? AND (locked_until IS NULL OR locked_until<=?))",
            rescueId,
            token,
            at,
          ),
        ]
      : []),
    db.$client
      .prepare(`UPDATE rescues SET status=?, ${column}=?, updated_at=? WHERE id=?`)
      .bind(next, at, at, rescueId),
    event(db, rescueId, next, actor.profileId, at),
    ...(next === "DELIVERED"
      ? [
          db.$client
            .prepare("UPDATE surplus_batches SET status='DELIVERED',updated_at=? WHERE id=?")
            .bind(at, rescue.batch_id),
          db.$client
            .prepare("UPDATE donation_reservations SET status='COMPLETED' WHERE batch_id=?")
            .bind(rescue.batch_id),
          db.$client
            .prepare(
              `INSERT INTO impact_metrics(id,rescue_id,food_saved_kg,estimated_meals,estimated_disposal_savings,
                 estimated_co2_avoided_kg,estimated_water_saved_liters,created_at)
               SELECT ?,?,json_extract(estimated_impact_json,'$.food_saved_kg'),json_extract(estimated_impact_json,'$.estimated_meals'),
                 json_extract(estimated_impact_json,'$.estimated_disposal_savings'),json_extract(estimated_impact_json,'$.estimated_co2_avoided_kg'),
                 json_extract(estimated_impact_json,'$.estimated_water_saved_liters'),?
               FROM surplus_batches WHERE id=?
               ON CONFLICT(rescue_id) DO NOTHING`,
            )
            .bind(crypto.randomUUID(), rescueId, at, rescue.batch_id),
        ]
      : []),
    notifyMembers(
      db,
      [rescue.supermarket_id, rescue.ngo_id],
      next,
      next === "IN_TRANSIT"
        ? "Sua doação está a caminho"
        : next === "DELIVERED"
          ? "Resgate concluído"
          : "Resgate atualizado",
      "Acompanhe o resgate no ONGSave.",
      { rescue_id: rescueId },
      at,
    ),
  ];
  await atomic(db, statements, {
    not_driver: notDriver,
    transition: invalid,
    token_locked: locked,
  });
  return true;
}

// private.delivery_token: only the NGO of the rescue, only once the driver is at the door.
export async function deliveryToken(db: Db, actor: Actor, rescueId: string) {
  const denied = "Código disponível à instituição quando o motorista chegar";
  const rescue = await db.$client
    .prepare("SELECT ngo_id, status FROM rescues WHERE id=?")
    .bind(rescueId)
    .first<{ ngo_id: string; status: string }>();
  if (
    actor.role !== "NGO" ||
    !rescue ||
    !member(actor, rescue.ngo_id) ||
    rescue.status !== "AT_DESTINATION"
  )
    throw new Error(denied);
  const row = await db.$client
    .prepare("SELECT confirmation_token FROM rescue_tokens WHERE rescue_id=?")
    .bind(rescueId)
    .first<{ confirmation_token: string }>();
  return row?.confirmation_token ?? null;
}

// grant update(read_at) on notifications, policy read_notification (own rows only).
export async function markNotificationRead(db: Db, actor: Actor, id: string, now = new Date()) {
  await db.$client
    .prepare("UPDATE notifications SET read_at=? WHERE id=? AND profile_id=?")
    .bind(now.toISOString(), id, actor.profileId)
    .run();
}
