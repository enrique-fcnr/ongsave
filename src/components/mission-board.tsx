"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MapPin,
  Navigation,
  Route,
  Store,
  Utensils,
} from "lucide-react";
import { RescueActions } from "./rescue-actions";
import { Empty, StatusPill } from "./shared";
import {
  DEMO_DRIVER_DELIVERY_RATE_BRL,
  money,
  number,
  type Organization,
  type Rescue,
} from "@/lib/domain";

const DriverMap = dynamic(() => import("./maps/DriverMap"), {
  ssr: false,
  loading: () => <div className="map-frame skeleton" />,
});

function streetName(address: string) {
  return address.split(",")[0]?.trim() || address;
}

function navigationLinks(rescue: Rescue, pickupName: string, ngoName: string) {
  const pickupPhase = [
    "WAITING_DRIVER",
    "DRIVER_ASSIGNED",
    "GOING_TO_PICKUP",
    "AT_PICKUP",
  ].includes(rescue.status);
  const nextAddress = pickupPhase ? rescue.pickup_address : rescue.delivery_address;
  const nextCoordinates = pickupPhase
    ? [rescue.pickup_latitude, rescue.pickup_longitude]
    : [rescue.delivery_latitude, rescue.delivery_longitude];
  const targetName = pickupPhase ? pickupName : ngoName;

  const googleParams = new URLSearchParams({
    api: "1",
    origin: "My Location",
    destination:
      pickupPhase && rescue.status !== "WAITING_DRIVER"
        ? ngoName + ", " + rescue.delivery_address
        : nextAddress,
    travelmode: "driving",
    dir_action: "navigate",
  });
  if (pickupPhase && rescue.status !== "WAITING_DRIVER") {
    googleParams.set("waypoints", `${pickupName}, ${rescue.pickup_address}`);
  }
  const googleMaps = `https://www.google.com/maps/dir/?${googleParams.toString()}`;
  const waze = `https://waze.com/ul?ll=${nextCoordinates[0]},${nextCoordinates[1]}&navigate=yes&utm_source=ongsave`;

  return { googleMaps, waze, targetName, pickupPhase };
}

const deliverySteps = [
  "Ir ao ponto de coleta",
  "Retirar os alimentos",
  "Seguir até a ONG",
  "Confirmar com código",
];

function currentDeliveryStep(status: Rescue["status"]) {
  if (status === "DELIVERED") return deliverySteps.length;
  if (status === "AT_DESTINATION") return 3;
  if (status === "PICKED_UP" || status === "IN_TRANSIT") return 2;
  if (status === "AT_PICKUP") return 1;
  return 0;
}

function deliveryStepMessage(status: Rescue["status"]) {
  switch (status) {
    case "WAITING_DRIVER":
      return "Aceite a entrega para começar.";
    case "DRIVER_ASSIGNED":
      return "Entrega aceita. Inicie o trajeto até o supermercado.";
    case "GOING_TO_PICKUP":
      return "Siga até o ponto de coleta indicado no mapa.";
    case "AT_PICKUP":
      return "Confira os alimentos e confirme a retirada.";
    case "PICKED_UP":
      return "Retirada confirmada. Inicie o trajeto até a ONG.";
    case "IN_TRANSIT":
      return "Siga até a ONG para entregar os alimentos.";
    case "AT_DESTINATION":
      return "Peça à equipe da ONG o código de quatro dígitos e informe abaixo.";
    case "DELIVERED":
      return "Entrega confirmada e finalizada.";
    default:
      return "Acompanhe as próximas etapas da entrega aqui.";
  }
}

export function MissionBoard({
  rescues,
  orgs,
  position,
}: {
  rescues: Rescue[];
  orgs: Organization[];
  position: [number, number];
}) {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [locationMessage, setLocationMessage] = useState("Localização demonstrativa");
  const [locating, setLocating] = useState(false);
  const routeRescues = useMemo(
    () => [...rescues].sort((a, b) => (a.driver_route_position ?? 0) - (b.driver_route_position ?? 0)),
    [rescues],
  );

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Este aparelho não disponibiliza localização");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentPosition([coords.longitude, coords.latitude]);
        setLocationMessage("Sua localização atual");
        setLocating(false);
      },
      () => {
        setLocationMessage("Não foi possível acessar sua localização");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  if (!routeRescues.length) {
    return (
      <section className="driver-map-empty stack">
        <Empty
          title="Sua rota está vazia"
          body="Escolha uma ou mais entregas disponíveis para ver todas as coletas e instituições no mapa."
        />
        <Link className="driver-route-empty-link" href="/rescues">Ver entregas disponíveis <ArrowRight size={16} /></Link>
      </section>
    );
  }
  const allPickupsComplete = routeRescues.every((rescue) =>
    ["PICKED_UP", "IN_TRANSIT", "AT_DESTINATION", "DELIVERED"].includes(rescue.status),
  );
  const activeCount = routeRescues.filter((rescue) => rescue.status !== "DELIVERED").length;
  const totalDistance = routeRescues.reduce((total, rescue) => total + Number(rescue.mock_distance_km), 0);
  const totalWeight = routeRescues.reduce(
    (total, rescue) => total + Number(rescue.surplus_batches?.estimated_weight_kg || 0), 0,
  );

  return (
    <div className="driver-route-workspace">
      <section className="driver-map-panel" aria-label="Mapa das entregas da rota">
        <DriverMap rescues={routeRescues} selectedId={routeRescues[0]?.id} position={currentPosition} />
        <button
          type="button"
          className="map-location-button"
          onClick={useMyLocation}
          disabled={locating}
          aria-label="Atualizar mapa com minha localização atual"
        >
          <Navigation size={16} />
          <span>{locating ? "Localizando…" : "Meu local"}</span>
        </button>
        <span className="map-location-caption" aria-live="polite">
          {locationMessage}
        </span>
      </section>

      <section className="driver-route-card stack" aria-label="Paradas e andamento da rota">
        <div className="between driver-route-card-heading">
          <div><span className="eyebrow muted">Sua rota · {activeCount} entregas</span><h2>Paradas da rota</h2></div>
          <div className="driver-route-total"><strong>{money(activeCount * DEMO_DRIVER_DELIVERY_RATE_BRL)}</strong><span>ganho estimado</span></div>
        </div>
        <div className="driver-route-totals"><span><Route size={15} /> {number(totalDistance)} km estimados</span><span><Utensils size={15} /> {number(totalWeight)} kg no total</span></div>
        {!allPickupsComplete && routeRescues.length > 1 && (
          <p className="notice">Faça as coletas de todas as entregas antes de iniciar os trajetos até as instituições.</p>
        )}
        <div className="driver-route-items">
          {routeRescues.map((delivery, index) => {
            const supermarket = orgs.find((org) => org.id === delivery.supermarket_id);
            const ngo = orgs.find((org) => org.id === delivery.ngo_id);
            const route = navigationLinks(delivery, supermarket?.name || "Supermercado", ngo?.name || "ONG");
            const step = currentDeliveryStep(delivery.status);
            const showNavigation = !["AT_PICKUP", "AT_DESTINATION"].includes(delivery.status);
            const waitingForPickups = delivery.status === "PICKED_UP" && !allPickupsComplete;
            return (
              <article className="driver-route-item" key={delivery.id}>
                <div className="between driver-route-item-heading">
                  <div><span className="stop-label">ENTREGA {index + 1} · {supermarket?.name || "Supermercado"} → {ngo?.name || "Instituição"}</span><h3>{delivery.surplus_batches?.title || "Entrega de alimentos"}</h3></div>
                  <StatusPill status={delivery.status} />
                </div>
                <div className="driver-route-item-stops">
                  <span><Store size={15} /><strong>Coleta:</strong> {streetName(delivery.pickup_address)}</span>
                  <span><MapPin size={15} /><strong>Entrega:</strong> {streetName(delivery.delivery_address)}</span>
                </div>
                <div className="driver-route-item-meta"><span>{number(Number(delivery.surplus_batches?.estimated_weight_kg || 0))} kg</span><span>{number(Number(delivery.mock_distance_km))} km</span><strong>{money(DEMO_DRIVER_DELIVERY_RATE_BRL)}</strong></div>
                <section className="driver-progress" aria-label={`Fases da entrega ${index + 1}`}>
                  <div className="between"><h4>Andamento</h4><span className="small muted">{step === deliverySteps.length ? "Concluída" : `Etapa ${step + 1} de ${deliverySteps.length}`}</span></div>
                  <ol>{deliverySteps.map((label, stepIndex) => <li key={label} className={stepIndex < step ? "is-complete" : stepIndex === step ? "is-active" : ""} aria-current={stepIndex === step && step < deliverySteps.length ? "step" : undefined}><span className="driver-progress-marker">{stepIndex < step ? <Check size={13} /> : stepIndex + 1}</span><span>{label}</span></li>)}</ol>
                  <p className="driver-step-message" aria-live="polite">{waitingForPickups ? "Coletas pendentes: retire os outros alimentos antes de seguir para a ONG." : deliveryStepMessage(delivery.status)}</p>
                </section>
                {delivery.status !== "DELIVERED" && delivery.status !== "CANCELLED" && (
                  waitingForPickups
                    ? <p className="driver-route-waiting">A próxima fase será liberada quando todas as coletas forem confirmadas.</p>
                    : <div className="driver-next-action" key={`${delivery.id}-${delivery.status}`}><RescueActions id={delivery.id} status={delivery.status} role="DRIVER" /></div>
                )}
                {showNavigation && <details className="driver-navigation-menu"><summary><span><Navigation size={17} /> Abrir rota até {route.targetName}</span><ArrowUpRight size={18} /></summary><div className="driver-navigation-options"><a href={route.googleMaps} target="_blank" rel="noreferrer">Google Maps <ArrowUpRight size={15} /></a><a href={route.waze} target="_blank" rel="noreferrer">Waze <ArrowUpRight size={15} /></a></div></details>}
              </article>
            );
          })}
        </div>
        <p className="driver-route-note">Valores, distâncias e horários são estimativas demonstrativas. Cada instituição confirma o recebimento com seu próprio código.</p>
      </section>
    </div>
  );
}
