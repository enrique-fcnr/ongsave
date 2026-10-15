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
function routePadding(instance: maplibregl.Map) {
  const { clientWidth: width, clientHeight: height } = instance.getContainer();
  return {
    top: Math.min(140, height * 0.34),
    bottom: Math.min(60, height * 0.16),
    left: Math.min(60, width * 0.08),
    right: Math.min(60, width * 0.08),
  };
}
export default function DriverMap({
  rescues,
  selectedId,
  position = DEFAULT_POSITION,
}: {
  rescues: Rescue[];
  selectedId?: string;
  position?: [number, number];
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [renderedRoute, setRenderedRoute] = useState({ id: "", phase: "", points: 0 });
  const viewportKey = useRef("");
  const routeBounds = useRef<maplibregl.LngLatBounds | null>(null);
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
    const resize = new ResizeObserver(() => {
      if (container.current?.clientWidth && container.current.clientHeight) {
        instance.resize();
        if (routeBounds.current)
          instance.fitBounds(routeBounds.current, {
            padding: routePadding(instance),
            maxZoom: 14,
            duration: 0,
          });
      }
    });
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!loaded || !map.current) return;
    const instance = map.current;
    const markers: Marker[] = [driverMarker(instance, position)];
    const ordered = [...rescues].sort(
      (a, b) => (a.driver_route_position ?? 0) - (b.driver_route_position ?? 0),
    );
    const selected = ordered.find((r) => r.id === selectedId) || ordered[0];
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend(position);
    const coords: [number, number][] = [position];
    for (const r of ordered) {
      const chosen = true;
      markers.push(
        rescueMarker(
          instance,
          [r.pickup_longitude, r.pickup_latitude],
          `Coleta: ${r.pickup_address}`,
          "pickup",
          chosen,
          () => undefined,
        ),
      );
      markers.push(
        rescueMarker(
          instance,
          [r.delivery_longitude, r.delivery_latitude],
          `Entrega: ${r.delivery_address}`,
          "ngo",
          true,
          () => undefined,
        ),
      );
      coords.push([r.pickup_longitude, r.pickup_latitude]);
      bounds.extend([r.pickup_longitude, r.pickup_latitude]);
      bounds.extend([r.delivery_longitude, r.delivery_latitude]);
    }
    const allPickupsComplete = ordered.every((r) =>
      ["PICKED_UP", "IN_TRANSIT", "AT_DESTINATION", "DELIVERED"].includes(r.status),
    );
    for (const r of ordered) coords.push([r.delivery_longitude, r.delivery_latitude]);
    const phase = allPickupsComplete ? "delivery" : "pickup";
    if (selected || instance.getSource("rescue-route")) updateRoute(instance, coords);
    // Report readiness only after MapLibre has drawn the route, including its source update.
    const onIdle = () => {
      const visible = instance.getLayer("rescue-route")
        ? instance.queryRenderedFeatures({ layers: ["rescue-route"] }).length > 0
        : false;
      setRenderedRoute({ id: selected?.id || "", phase, points: visible ? coords.length : 0 });
    };
    instance.once("idle", onIdle);
    const nextViewportKey = `${selected?.id}:${phase}:${rescues.map((r) => r.id).join(",")}:${position.join(",")}`;
    routeBounds.current = rescues.length ? bounds : null;
    if (
      rescues.length &&
      container.current?.clientWidth &&
      viewportKey.current !== nextViewportKey
    ) {
      instance.fitBounds(bounds, {
        padding: routePadding(instance),
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
      aria-label="Mapa das entregas"
      data-route-rescue={renderedRoute.id}
      data-route-phase={renderedRoute.phase}
      data-route-points={renderedRoute.points}
    >
      <div
        ref={container}
        style={{ position: "absolute", inset: 0 }}
        aria-label="Mapa interativo das entregas em São Paulo"
      />
      <div className="map-badge">
        <div className="map-badge-title">
      {rescues.length ? `Rota com ${rescues.length} ${rescues.length === 1 ? "entrega" : "entregas"}` : "Nenhuma entrega ativa"}
        </div>
        <p className="small muted" style={{ marginTop: 5 }}>
          Sua posição → todas as coletas → todas as ONGs
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
          ? "Mapa indisponível. Consulte os endereços da entrega."
          : renderedRoute.points > 1
            ? `Rota simulada até ${renderedRoute.phase === "delivery" ? "a ONG" : "o supermercado"} exibida no mapa.`
            : loaded && !rescues.length
              ? "Mapa carregado. Nenhuma entrega ativa."
              : "Carregando mapa e rota."}
      </span>
      {failed && (
        <div
          className="notice"
          style={{ position: "absolute", bottom: 20, left: 20, right: 60, zIndex: 5 }}
        >
          O mapa precisa de conexão e suporte a WebGL. Você pode acompanhar a entrega pelos
          endereços abaixo.
        </div>
      )}
    </div>
  );
}
