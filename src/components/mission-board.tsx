"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, MapPin, Store, Truck, Utensils } from "lucide-react";
import { RescueActions } from "./rescue-actions";
import { Empty, StatusPill } from "./shared";
import { number, type Organization, type Rescue } from "@/lib/domain";
const DriverMap = dynamic(() => import("./maps/DriverMap"), {
  ssr: false,
  loading: () => <div className="map-frame skeleton" />,
});
export function MissionBoard({
  rescues,
  orgs,
  position,
}: {
  rescues: Rescue[];
  orgs: Organization[];
  position: [number, number];
}) {
  const [selectedId, setSelectedId] = useState(
    rescues.find((r) => r.status !== "WAITING_DRIVER")?.id || rescues[0]?.id,
  );
  const selected = rescues.find((r) => r.id === selectedId) || rescues[0];
  return (
    <div className="stack">
      <DriverMap
        rescues={rescues}
        selectedId={selected?.id}
        onSelect={setSelectedId}
        position={position}
      />
      {selected ? (
        <section className="mission-sheet stack">
          <div className="between">
            <span className="eyebrow muted">
              {selected.status === "WAITING_DRIVER"
                ? "Sua próxima oportunidade"
                : "Sua missão em andamento"}
            </span>
            <StatusPill status={selected.status} />
          </div>
          <div className="dashboard-grid">
            <div>
              <div className="route-stop">
                <span className="symbol">
                  <Store size={18} />
                </span>
                <div>
                  <span className="stop-label">Coleta · Supermercado</span>
                  <h3>{orgs.find((o) => o.id === selected.supermarket_id)?.name}</h3>
                  <p className="small muted" style={{ marginTop: 4 }}>
                    {selected.pickup_address}
                  </p>
                </div>
              </div>
              <div className="route-stop">
                <span className="symbol">
                  <MapPin size={18} />
                </span>
                <div>
                  <span className="stop-label">Entrega · Instituição</span>
                  <h3>{orgs.find((o) => o.id === selected.ngo_id)?.name}</h3>
                  <p className="small muted" style={{ marginTop: 4 }}>
                    {selected.delivery_address}
                  </p>
                </div>
              </div>
            </div>
            <div className="stack" style={{ gap: 14 }}>
              <div className="between">
                <span className="row small muted">
                  <Truck size={17} />
                  {number(Number(selected.mock_distance_km))} km ·{" "}
                  {number(Number(selected.surplus_batches?.estimated_weight_kg || 0))} kg
                </span>
                <span className="small muted">≈ {selected.mock_eta_minutes} min</span>
              </div>
              <p className="small row muted">
                <Utensils size={16} />≈{" "}
                {number(Number(selected.surplus_batches?.estimated_weight_kg || 0) * 2)} refeições
                estimadas
              </p>
              {selected.status === "WAITING_DRIVER" ? (
                <RescueActions id={selected.id} status={selected.status} role="DRIVER" />
              ) : (
                <Link href={`/driver/missions/${selected.id}`} className="notice between">
                  Continuar missão
                  <ArrowRight size={17} />
                </Link>
              )}
              <Link href={`/driver/missions/${selected.id}`} className="small muted">
                Ver rota e detalhes
              </Link>
            </div>
          </div>
          <p className="small muted">
            Rota, posição e tempo são demonstrativos. As etapas da coleta e da entrega ficam
            registradas no resgate.
          </p>
        </section>
      ) : (
        <Empty
          title="Nenhum resgate próximo no momento"
          body="Novas missões aparecerão no mapa automaticamente."
        />
      )}
      {rescues.length > 1 && (
        <div className="rescue-list">
          {rescues.map((r) => (
            <button
              className="rescue-row"
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              aria-pressed={selected?.id === r.id}
              style={{ textAlign: "left" }}
            >
              <span className="symbol">
                <Truck size={18} />
              </span>
              <div className="info">
                <h3>{r.surplus_batches?.title}</h3>
                <p>
                  {orgs.find((o) => o.id === r.supermarket_id)?.name} →{" "}
                  {orgs.find((o) => o.id === r.ngo_id)?.name}
                </p>
              </div>
              <span className="small muted">
                {number(Number(r.surplus_batches?.estimated_weight_kg || 0))} kg
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
