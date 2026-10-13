"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { hasMapLocation, type NetworkOrganization } from "@/lib/admin-network";
import styles from "./network.module.css";

export default function NetworkMap({
  organizations,
  selectedId,
  onSelect,
  resetKey,
}: {
  organizations: NetworkOrganization[];
  selectedId?: string;
  onSelect: (id: string) => void;
  resetKey: number;
}) {
  const locationsJson = JSON.stringify(
    organizations.map(({ id, name, type, latitude, longitude }) => ({
      id,
      name,
      type,
      latitude,
      longitude,
    })),
  );
  const locations = useMemo(
    () =>
      JSON.parse(locationsJson) as Pick<
        NetworkOrganization,
        "id" | "name" | "type" | "latitude" | "longitude"
      >[],
    [locationsJson],
  );
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const markers = useRef<maplibregl.Marker[]>([]);
  const layoutMarkers = useRef<() => void>(() => {});
  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!container.current) return;
    let instance: maplibregl.Map;
    let resize: ResizeObserver;
    try {
      maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      instance = new maplibregl.Map({
        container: container.current,
        center: [-46.641, -23.548],
        zoom: 11,
        style: "/maps/ongsave-soft.json",
        attributionControl: {
          compact: true,
          customAttribution:
            '<a href="https://github.com/openmaptiles/positron-gl-style">Positron</a> · ONGSave',
        },
      });
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
      instance.on("load", () => setLoaded(true));
      instance.on("error", () => setFailed(true));
      instance.on("move", () => layoutMarkers.current());
      resize = new ResizeObserver(() => {
        if (container.current?.clientWidth && container.current.clientHeight) instance.resize();
      });
      resize.observe(container.current);
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    return () => {
      markers.current.forEach((marker) => marker.remove());
      resize.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !loaded) return;
    markers.current.forEach((marker) => marker.remove());
    markers.current = locations.filter(hasMapLocation).map((org) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `${styles.marker} ${org.type === "NGO" ? styles.ngo : styles.market}`;
      button.dataset.organization = org.id;
      button.setAttribute(
        "aria-label",
        `${org.type === "NGO" ? "ONG" : "Supermercado"}: ${org.name}`,
      );
      button.title = org.name;
      // Fixed icon markup only; organization names are assigned through text/attributes.
      button.innerHTML =
        org.type === "NGO"
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 10h18l-2-6H5l-2 6Z M4 10v10h16V10 M9 20v-6h6v6"/></svg>';
      button.addEventListener("click", () => select.current(org.id));
      return new maplibregl.Marker({ element: button, anchor: "bottom" })
        .setLngLat([org.longitude, org.latitude])
        .addTo(instance);
    });
    // Close institutions remain individually clickable at city-wide zoom.
    // The anchor coordinates are preserved; only the screen icon gets an offset.
    layoutMarkers.current = () => {
      const occupied: { x: number; y: number }[] = [];
      for (const marker of markers.current) {
        const point = instance.project(marker.getLngLat());
        let offset: [number, number] = [0, 0];
        for (let attempt = 0; attempt < 80; attempt++) {
          const ring = Math.ceil(attempt / 8);
          const angle = ((attempt % 8) * Math.PI) / 4;
          const x = attempt === 0 ? 0 : Math.cos(angle) * ring * 48;
          const y = attempt === 0 ? 0 : Math.sin(angle) * ring * 50;
          if (
            !occupied.some(
              (other) =>
                Math.abs(other.x - point.x - x) < 42 && Math.abs(other.y - point.y - y) < 48,
            )
          ) {
            offset = [x, y];
            break;
          }
        }
        occupied.push({ x: point.x + offset[0], y: point.y + offset[1] });
        marker.setOffset(offset);
      }
    };
    layoutMarkers.current();
    if (locations.some(hasMapLocation)) {
      const bounds = new maplibregl.LngLatBounds();
      locations
        .filter(hasMapLocation)
        .forEach((org) => bounds.extend([org.longitude, org.latitude]));
      instance.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 70, right: 70 },
        maxZoom: 13,
        duration: 450,
      });
    }
    return () => {
      layoutMarkers.current = () => {};
      markers.current.forEach((marker) => marker.remove());
    };
  }, [locations, loaded, resetKey]);

  useEffect(() => {
    markers.current.forEach((marker) => {
      const button = marker.getElement();
      const active = button.dataset.organization === selectedId;
      button.classList.toggle(styles.selected, active);
      button.setAttribute("aria-pressed", String(active));
    });
    const org = locations.find((item) => item.id === selectedId);
    if (org && hasMapLocation(org) && map.current && container.current) {
      const { clientWidth, clientHeight } = container.current;
      map.current.easeTo({
        center: [org.longitude, org.latitude],
        zoom: Math.max(map.current.getZoom(), 12),
        offset: clientWidth > 650 ? [-150, 0] : [0, -Math.min(120, clientHeight * 0.24)],
        duration: 450,
      });
    }
  }, [selectedId, locations, loaded]);

  return (
    <>
      <div
        ref={container}
        className={styles.canvas}
        role="region"
        aria-label="Mapa das ONGs e supermercados"
      />
      {failed && (
        <p className={styles.mapError} role="status">
          O mapa não carregou por completo. Use a lista para consultar a rede.
        </p>
      )}
      {!loaded && !failed && (
        <span className={styles.mapLoading} role="status">
          Preparando o mapa da rede…
        </span>
      )}
    </>
  );
}
