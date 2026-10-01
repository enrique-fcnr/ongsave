"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { rescueMarker } from "./RescueMarker";
import { driverMarker } from "./DriverMarker";
import { updateRoute } from "./RouteLayer";
import type { Rescue } from "@/lib/domain";
const DEFAULT_POSITION: [number, number] = [-46.64, -23.589];
export default function DriverMap({
  rescues,
  selectedId,
  onSelect,
  position = DEFAULT_POSITION,
}: {
  rescues: Rescue[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  position?: [number, number];
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [renderedRoute, setRenderedRoute] = useState({ id: "", phase: "", points: 0 });
  const selectRef = useRef(onSelect);
  const viewportKey = useRef("");
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!container.current) return;
    let instance: maplibregl.Map;
    try {
      maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      instance = new maplibregl.Map({
        container: container.current,
        center: [-46.638, -23.588],
        zoom: 13,
        attributionControl: {
          compact: true,
          customAttribution:
            '<a href="https://github.com/openmaptiles/positron-gl-style">Positron</a> · ONGSave',
        },
        style: process.env.NEXT_PUBLIC_MAP_TILE_URL
          ? {
              version: 8,
              sources: {
                osm: {
                  type: "raster",
                  tiles: [process.env.NEXT_PUBLIC_MAP_TILE_URL],
                  tileSize: 256,
                  attribution:
                    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
                },
              },
              layers: [
                { id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.5 } },
              ],
            }
          : "/maps/ongsave-soft.json",
      });
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      instance.on("load", () => setLoaded(true));
      instance.on("error", () => setFailed(true));
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!loaded || !map.current) return;
    const instance = map.current;
    const markers: Marker[] = [driverMarker(instance, position)];
    const selected = rescues.find((r) => r.id === selectedId) || rescues[0];
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend(position);
    for (const r of rescues) {
      const chosen = r.id === selected?.id;
      markers.push(
        rescueMarker(
          instance,
          [r.pickup_longitude, r.pickup_latitude],
          `Coleta: ${r.pickup_address}`,
          "pickup",
          chosen,
          () => selectRef.current?.(r.id),
        ),
      );
      if (chosen) {
        markers.push(
          rescueMarker(
            instance,
            [r.delivery_longitude, r.delivery_latitude],
            `Entrega: ${r.delivery_address}`,
            "ngo",
            true,
            () => selectRef.current?.(r.id),
          ),
        );
        bounds.extend([r.delivery_longitude, r.delivery_latitude]);
      }
      bounds.extend([r.pickup_longitude, r.pickup_latitude]);
    }
    const phase =
      selected &&
      ["PICKED_UP", "IN_TRANSIT", "AT_DESTINATION", "DELIVERED"].includes(selected.status)
        ? "delivery"
        : "pickup";
    const coords: [number, number][] = !selected
      ? []
      : phase === "delivery"
        ? selected.mock_route_geometry
        : [
            position,
            [selected.pickup_longitude, position[1]],
            [selected.pickup_longitude, selected.pickup_latitude],
          ];
    if (selected || instance.getSource("rescue-route")) updateRoute(instance, coords);
    // Report readiness only after MapLibre has drawn the route, including its source update.
    const onIdle = () => {
      const visible = instance.getLayer("rescue-route")
        ? instance.queryRenderedFeatures({ layers: ["rescue-route"] }).length > 0
        : false;
      setRenderedRoute({ id: selected?.id || "", phase, points: visible ? coords.length : 0 });
    };
    instance.once("idle", onIdle);
    const nextViewportKey = `${selected?.id}:${phase}:${rescues.map((r) => r.id).join(",")}`;
    if (rescues.length && viewportKey.current !== nextViewportKey) {
      instance.fitBounds(bounds, {
        padding: { top: 150, bottom: 100, left: 60, right: 60 },
        maxZoom: 14,
        duration: 500,
      });
      viewportKey.current = nextViewportKey;
    }
    return () => {
      instance.off("idle", onIdle);
      markers.forEach((m) => m.remove());
    };
  }, [rescues, selectedId, loaded, position]);
  return (
    <div
      className="map-frame"
      role="region"
      aria-label="Mapa dos resgates"
      data-route-rescue={renderedRoute.id}
      data-route-phase={renderedRoute.phase}
      data-route-points={renderedRoute.points}
    >
      <div
        ref={container}
        style={{ position: "absolute", inset: 0 }}
        aria-label="Mapa interativo dos resgates em São Paulo"
      />
      <div className="map-badge">
        <div className="map-badge-title">
          <span className="map-count">{rescues.length}</span>
          {rescues.length === 1 ? "resgate próximo" : "resgates próximos"}
        </div>
        <p className="small muted" style={{ marginTop: 5 }}>
          Posição e rota simuladas
        </p>
        <div className="map-legend" aria-label="Legenda do mapa">
          <span>
            <i className="legend-driver" />
            Motorista
          </span>
          <span>
            <i className="legend-pickup">C</i>Coleta
          </span>
          <span>
            <i className="legend-ngo">D</i>Entrega
          </span>
        </div>
      </div>
      <span className="sr-only" role="status">
        {failed
          ? "Mapa indisponível. Consulte os endereços da missão."
          : renderedRoute.points > 1
            ? `Rota simulada até ${renderedRoute.phase === "delivery" ? "a ONG" : "o supermercado"} exibida no mapa.`
            : loaded && !rescues.length
              ? "Mapa carregado. Nenhum resgate disponível."
              : "Carregando mapa e rota."}
      </span>
      {failed && (
        <div
          className="notice"
          style={{ position: "absolute", bottom: 20, left: 20, right: 60, zIndex: 5 }}
        >
          O mapa precisa de conexão e suporte a WebGL. Você pode seguir a missão pelos endereços
          abaixo.
        </div>
      )}
    </div>
  );
}
