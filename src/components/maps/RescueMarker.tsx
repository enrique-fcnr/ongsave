import { Marker, type Map } from "maplibre-gl";
export function rescueMarker(
  map: Map,
  coords: [number, number],
  name: string,
  kind: "pickup" | "ngo",
  selected: boolean,
  onClick: () => void,
) {
  const el = document.createElement("button");
  el.className = `map-marker ${kind === "ngo" ? "ngo" : ""} ${selected ? "selected" : ""}`;
  el.setAttribute("aria-label", name);
  el.title = name;
  const span = document.createElement("span");
  span.textContent = kind === "ngo" ? "D" : "C";
  el.appendChild(span);
  el.addEventListener("click", onClick);
  return new Marker({ element: el }).setLngLat(coords).addTo(map);
}
