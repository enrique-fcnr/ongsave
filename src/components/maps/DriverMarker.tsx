import { Marker, type Map } from "maplibre-gl";
export function driverMarker(map: Map, coords: [number, number]) {
  const el = document.createElement("div");
  el.className = "map-marker driver";
  el.title = "Sua localização neste mapa";
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", el.title);
  return new Marker({ element: el }).setLngLat(coords).addTo(map);
}
