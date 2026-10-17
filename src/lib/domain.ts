import { z } from "zod";

export const roles = ["SUPERMARKET", "NGO", "DRIVER", "ADMIN", "FINANCIAL_DONOR"] as const;
export type Role = (typeof roles)[number];
export const statuses = [
  "AVAILABLE",
  "RESERVED",
  "WAITING_DRIVER",
  "DRIVER_ASSIGNED",
  "GOING_TO_PICKUP",
  "AT_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_DESTINATION",
  "DELIVERED",
  "CANCELLED",
] as const;
export type RescueStatus = (typeof statuses)[number];
export const statusLabels: Record<RescueStatus, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  WAITING_DRIVER: "Procurando motorista",
  DRIVER_ASSIGNED: "Motorista confirmado",
  GOING_TO_PICKUP: "A caminho da coleta",
  AT_PICKUP: "No supermercado",
  PICKED_UP: "Coleta confirmada",
  IN_TRANSIT: "A caminho da ONG",
  AT_DESTINATION: "Na instituição",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};
export const transitions: Record<RescueStatus, readonly RescueStatus[]> = {
  AVAILABLE: ["RESERVED", "CANCELLED"],
  RESERVED: ["WAITING_DRIVER", "CANCELLED"],
  WAITING_DRIVER: ["DRIVER_ASSIGNED", "CANCELLED"],
  DRIVER_ASSIGNED: ["GOING_TO_PICKUP", "CANCELLED"],
  GOING_TO_PICKUP: ["AT_PICKUP"],
  AT_PICKUP: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["AT_DESTINATION"],
  AT_DESTINATION: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
export function canTransition(from: RescueStatus, to: RescueStatus) {
  return transitions[from].includes(to);
}
export const driverActions: Partial<Record<RescueStatus, { next: RescueStatus; label: string }>> = {
  DRIVER_ASSIGNED: { next: "GOING_TO_PICKUP", label: "Iniciar coleta" },
  GOING_TO_PICKUP: { next: "AT_PICKUP", label: "Cheguei ao supermercado" },
  AT_PICKUP: { next: "PICKED_UP", label: "Confirmar retirada" },
  PICKED_UP: { next: "IN_TRANSIT", label: "Iniciar transporte" },
  IN_TRANSIT: { next: "AT_DESTINATION", label: "Cheguei à ONG" },
};
export const categories = [
  "produce",
  "bakery",
  "dairy",
  "prepared_food",
  "dry_goods",
  "frozen",
  "other",
] as const;
export const categoryLabels: Record<string, string> = {
  produce: "Hortifrúti",
  bakery: "Padaria",
  dairy: "Laticínios",
  prepared_food: "Refeições",
  dry_goods: "Mercearia",
  frozen: "Congelados",
  other: "Outros",
};
export const priorities: Record<string, string> = {
  low: "Baixa",
  medium: "Normal",
  high: "Alta",
  urgent: "Urgente",
};
export const conditions: Record<string, string> = {
  acceptable: "Adequado para avaliação",
  attention: "Requer atenção",
  not_recommended: "Não recomendado visualmente",
  inconclusive: "Avaliação inconclusiva",
};
export const tokenSchema = z.string().regex(/^\d{4}$/, "Digite os quatro dígitos do código.");
export function calculateImpact(weight: number) {
  if (!Number.isFinite(weight) || weight <= 0) throw new Error("Peso inválido");
  return {
    food_saved_kg: weight,
    estimated_meals: Math.round(weight * 2),
    estimated_disposal_savings: Number((weight * 7.72).toFixed(2)),
    estimated_co2_avoided_kg: Number((weight * 1.43).toFixed(2)),
    estimated_water_saved_liters: Math.round(weight * 250),
  };
}
export const DEMO_DRIVER_DELIVERY_RATE_BRL = 25;
export function summarizeDriverDay(
  rescues: Pick<Rescue, "driver_id" | "status" | "delivered_at">[],
  driverId: string,
  asOf = new Date(),
) {
  const dateInSaoPaulo = (date: Date) =>
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const deliveries = rescues.filter(
    (rescue) =>
      rescue.driver_id === driverId &&
      rescue.status === "DELIVERED" &&
      rescue.delivered_at !== null &&
      dateInSaoPaulo(new Date(rescue.delivered_at)) === dateInSaoPaulo(asOf),
  ).length;
  return {
    deliveries,
    revenue: deliveries * DEMO_DRIVER_DELIVERY_RATE_BRL,
  };
}
export type Organization = {
  id: string;
  name: string;
  type: "SUPERMARKET" | "NGO" | "FINANCIAL_DONOR";
  neighborhood: string;
  address_line: string;
  city: string;
  latitude: number;
  longitude: number;
};
export type Profile = {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url?: string | null;
  role: Role;
};
export type Preferences = {
  organization_id: string;
  daily_capacity_kg: number;
  receiving_enabled: boolean;
  receiving_start: string;
  receiving_end: string;
  accepted_categories: string[];
  current_needs: string[];
  has_fridge: boolean;
  has_freezer: boolean;
  has_cold_room: boolean;
  service_radius_km: number;
};
export type Batch = {
  id: string;
  supermarket_id: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  estimated_weight_kg: number;
  visual_condition: string;
  pickup_priority: string;
  recommended_pickup_hours: number;
  expires_at: string;
  status: RescueStatus;
  created_at: string;
  ai_provider: string;
  surplus_items?: { name: string; estimated_quantity: number }[];
};
export type Rescue = {
  id: string;
  batch_id: string;
  supermarket_id: string;
  ngo_id: string;
  driver_id: string | null;
  driver_route_position?: number | null;
  status: RescueStatus;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  mock_distance_km: number;
  mock_eta_minutes: number;
  mock_route_geometry: [number, number][];
  created_at: string;
  delivered_at: string | null;
  surplus_batches?: Batch;
  impact_metrics?: ReturnType<typeof calculateImpact>[];
};
export function matchScore(
  batch: Batch,
  org: Organization,
  prefs: Preferences,
  supermarket?: Organization,
  now = new Date(),
) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return (
    (prefs.accepted_categories.includes(batch.category) ? 30 : 0) +
    (supermarket?.neighborhood === org.neighborhood ? 20 : 0) +
    (Number(batch.estimated_weight_kg) <= Number(prefs.daily_capacity_kg) ? 20 : 0) +
    (prefs.receiving_enabled ? 10 : 0) +
    (hour >= prefs.receiving_start.slice(0, 5) && hour <= prefs.receiving_end.slice(0, 5)
      ? 10
      : 0) +
    (prefs.current_needs.includes(batch.category) ? 10 : 0)
  );
}
export const number = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
