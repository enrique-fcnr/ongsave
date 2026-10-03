import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, HeartHandshake, MapPin, PackageCheck, Store } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { number, statusLabels, type Rescue, type RescueStatus } from "@/lib/domain";
import { RescueActions } from "./rescue-actions";
import { RescueMap } from "./rescue-map";
import { StatusPill } from "./shared";
export async function RescueDetail({ id }: { id: string }) {
  const { client, profile } = await requireProfile();
  const { data, error } = await client
    .from("rescues")
    .select("*,surplus_batches(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();
  const r = data as Rescue;
  const [e, o] = await Promise.all([
    client
      .from("rescue_events")
      .select("*")
      .eq("rescue_id", id)
      .order("created_at", { ascending: true }),
    client.from("organizations").select("*").in("id", [r.supermarket_id, r.ngo_id]),
  ]);
  if (e.error || o.error) throw new Error(e.error?.message || o.error?.message);
  const weight = Number(r.surplus_batches?.estimated_weight_kg || 0);
  const driverName = e.data?.find((ev) => ev.event_type === "DRIVER_ASSIGNED")?.metadata
    ?.driver_name;
  return (
    <div className="stack">
      <Link className="back" href={profile.role === "DRIVER" ? "/driver/missions" : "/rescues"}>
        <ArrowLeft size={16} />
        Voltar aos resgates
      </Link>
      <div className="between page-heading">
        <div className="title-block">
          <span className="eyebrow muted">Resgate #{r.id.slice(0, 8)}</span>
          <h1>{r.status === "DELIVERED" ? "Missão concluída" : r.surplus_batches?.title}</h1>
          <p>
            {r.status === "DELIVERED"
              ? "Os alimentos chegaram a um novo destino. Obrigado por fazer parte."
              : driverName
                ? `${driverName} aceitou o resgate.`
                : "Acompanhe cada etapa, em tempo real."}
          </p>
        </div>
        <StatusPill status={r.status} />
      </div>
      {r.status === "DELIVERED" && (
        <div className="impact-banner">
          <div>
            <PackageCheck size={30} color="var(--primary)" />
            <div className="impact-total">{number(weight)} kg resgatados</div>
            <p>
              ≈ {number(weight * 2)} refeições estimadas · {number(Number(r.mock_distance_km))} km
              solidários simulados
            </p>
          </div>
          <HeartHandshake className="art" />
        </div>
      )}
      <div className="detail-grid">
        <div className="stack">
          <RescueMap rescue={r} />
          <div className="panel">
            <div className="route-stop">
              <span className="symbol">
                <Store size={18} />
              </span>
              <div>
                <span className="stop-label">Coleta · Supermercado</span>
                <h3>{o.data?.find((org) => org.id === r.supermarket_id)?.name}</h3>
                <p className="small muted" style={{ marginTop: 5 }}>
                  {r.pickup_address}
                </p>
              </div>
            </div>
            <div className="route-stop">
              <span className="symbol">
                <MapPin size={18} />
              </span>
              <div>
                <span className="stop-label">Entrega · Instituição</span>
                <h3>{o.data?.find((org) => org.id === r.ngo_id)?.name}</h3>
                <p className="small muted" style={{ marginTop: 5 }}>
                  {r.delivery_address}
                </p>
              </div>
            </div>
            <p className="small muted" style={{ marginTop: 15 }}>
              Rota e ETA demonstrativos · {number(Number(r.mock_distance_km))} km · ≈{" "}
              {r.mock_eta_minutes} min
            </p>
          </div>
        </div>
        <div className="panel stack">
          <div className="between">
            <h2>Acompanhe o resgate</h2>
            <span className="small muted">{number(weight)} kg</span>
          </div>
          <div className="timeline">
            {e.data?.map((ev) => (
              <div key={ev.id} className="timeline-item">
                <span className="timeline-dot">
                  <Check size={13} />
                </span>
                <div>
                  <p>{statusLabels[ev.status as RescueStatus]}</p>
                  <time>
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(ev.created_at))}
                  </time>
                </div>
              </div>
            ))}
            {r.status !== "DELIVERED" && r.status !== "CANCELLED" && (
              <div className="timeline-item">
                <span className="timeline-dot next">•</span>
                <p className="muted">
                  {r.status === "WAITING_DRIVER"
                    ? "Aguardando motorista"
                    : "Próxima etapa em andamento"}
                </p>
              </div>
            )}
          </div>
          <RescueActions key={r.status} id={r.id} status={r.status} role={profile.role} />
          {r.status === "DELIVERED" && (
            <Link className="notice" href="/impact" style={{ textAlign: "center" }}>
              Ver impacto atualizado
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
