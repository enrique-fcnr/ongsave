"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Banknote, Check, Clock3, MapPin, Package, Route, Scale } from "lucide-react";
import { DEMO_DRIVER_DELIVERY_RATE_BRL, money, number, type Organization, type Rescue } from "@/lib/domain";
import { browserClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { Empty } from "./shared";
import { PagedItems } from "./screen-sections";

export function DriverDeliveries({
  available,
  orgs,
  photos,
  capacityKg,
  activeRouteWeightKg,
  isAvailable,
}: {
  available: Rescue[];
  orgs: Organization[];
  photos: Record<string, string | undefined>;
  capacityKg: number;
  activeRouteWeightKg: number;
  isAvailable: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const selectedRows = useMemo(
    () => available.filter((rescue) => selected.includes(rescue.id)),
    [available, selected],
  );
  const selectedWeight = selectedRows.reduce(
    (total, rescue) => total + Number(rescue.surplus_batches?.estimated_weight_kg || 0),
    0,
  );
  const overCapacity = activeRouteWeightKg + selectedWeight > capacityKg;
  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
    setError("");
  };

  async function addToRoute() {
    if (!selected.length || overCapacity || !isAvailable) return;
    setBusy(true);
    setError("");
    try {
      const { error: rpcError } = await browserClient().rpc("accept_deliveries", {
        rescue_ids: selected,
      });
      if (rpcError) throw rpcError;
      setSelected([]);
      router.push("/driver/missions");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível adicionar à rota.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack driver-deliveries-page">
      <div className="driver-deliveries-tabs" aria-label="Lista de entregas">
        <span className="active">Disponíveis <span>{available.length}</span></span>
      </div>
          <div className="between driver-deliveries-intro">
            <div>
              <h2>Entregas disponíveis</h2>
              <p className="muted">Selecione uma ou várias para montar sua rota.</p>
            </div>
            <Button variant="outline" render={<Link href="/driver/missions" />} className="driver-route-link">
              <Route size={17} /> Minha rota <ArrowRight size={16} />
            </Button>
          </div>
          {!isAvailable && (
            <p className="notice" role="status">
              Seu perfil está indisponível para novas entregas. Atualize sua disponibilidade no perfil.
            </p>
          )}
          {available.length ? (
            <div className="driver-available-list">
              {available.map((rescue) => {
                const batch = rescue.surplus_batches;
                const supermarket = orgs.find((org) => org.id === rescue.supermarket_id);
                const ngo = orgs.find((org) => org.id === rescue.ngo_id);
                const photo = batch?.image_url ? photos[batch.image_url] : undefined;
                const isSelected = selected.includes(rescue.id);
                return (
                  <button
                    type="button"
                    key={rescue.id}
                    className={`driver-available-card ${isSelected ? "is-selected" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => toggle(rescue.id)}
                  >
                    <span className="driver-available-check" aria-hidden="true">
                      {isSelected ? <Check size={17} /> : null}
                    </span>
                    <span className="driver-available-photo">
                      {photo ? (
                        <Image src={photo} alt="" width={76} height={76} unoptimized />
                      ) : (
                        <Package size={25} />
                      )}
                    </span>
                    <span className="driver-available-content">
                      <strong>{batch?.title || "Doação de alimentos"}</strong>
                      <span className="driver-available-partners">
                        {supermarket?.name || "Supermercado"} <ArrowRight size={13} /> {ngo?.name || "ONG"}
                      </span>
                      <span className="driver-available-meta">
                        <span><MapPin size={14} /> {rescue.pickup_address.split(",")[0]}</span>
                        <span><Scale size={14} /> {number(Number(batch?.estimated_weight_kg || 0))} kg</span>
                        <span><Clock3 size={14} /> ≈ {rescue.mock_eta_minutes} min</span>
                      </span>
                    </span>
                    <span className="driver-available-pay">
                      <Banknote size={17} /> {money(DEMO_DRIVER_DELIVERY_RATE_BRL)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <Empty title="Nenhuma entrega disponível agora" body="As novas entregas aparecerão aqui assim que uma ONG aceitar uma doação." />
          )}
          {selectedRows.length > 0 && (
            <section className="driver-selection-bar" aria-live="polite">
              <div>
                <strong>{selectedRows.length} {selectedRows.length === 1 ? "entrega selecionada" : "entregas selecionadas"}</strong>
                <span>{number(selectedWeight)} kg · {money(selectedRows.length * DEMO_DRIVER_DELIVERY_RATE_BRL)} estimados</span>
                {activeRouteWeightKg > 0 && <span>{number(activeRouteWeightKg)} kg já estão na sua rota atual.</span>}
                {overCapacity && <span className="error">Com a rota atual, o peso total passa da capacidade de {number(capacityKg)} kg do veículo.</span>}
                {error && <span className="error" role="alert">{error}</span>}
              </div>
              <Button disabled={busy || overCapacity || !isAvailable} onClick={addToRoute}>
                {busy ? "Adicionando…" : "Adicionar à rota"} <ArrowRight size={17} />
              </Button>
            </section>
          )}
    </div>
  );
}

export function DriverDeliveryHistory({
  finalized,
  orgs,
}: {
  finalized: Rescue[];
  orgs: Organization[];
}) {
  if (!finalized.length)
    return <Empty title="Nenhuma entrega finalizada ainda" body="As entregas concluídas aparecerão aqui com seu valor e os dados de recebimento." />;
  return (
    <div className="stack">
      <div className="section-heading">
        <h2>Histórico de entregas</h2>
        <span className="pill">{finalized.length} finalizadas</span>
      </div>
      <PagedItems className="rescue-list" pageSize={4} mobilePageSize={3} label="Histórico de entregas">
        {finalized.map((rescue) => (
          <Link className="rescue-row" href={`/rescue/${rescue.id}`} key={rescue.id}>
            <span className="symbol"><Package size={20} /></span>
            <span className="info">
              <strong>{rescue.surplus_batches?.title || "Entrega de alimentos"}</strong>
              <span>{orgs.find((org) => org.id === rescue.ngo_id)?.name || "Instituição"} · {number(Number(rescue.surplus_batches?.estimated_weight_kg || 0))} kg</span>
              <span className="driver-finalized-value"><Banknote size={15} /> Valor estimado da entrega: {money(DEMO_DRIVER_DELIVERY_RATE_BRL)}</span>
            </span>
            <span className="pill">Finalizada</span>
          </Link>
        ))}
      </PagedItems>
    </div>
  );
}
