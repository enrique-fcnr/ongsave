import type { Map, GeoJSONSource } from "maplibre-gl";
export function updateRoute(map: Map, coordinates: [number, number][]) {
  const data: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates },
  };
  const source = map.getSource("rescue-route") as GeoJSONSource | undefined;
  if (source) source.setData(data);
  else {
    map.addSource("rescue-route", { type: "geojson", data });
    map.addLayer({
      id: "rescue-route-halo",
      type: "line",
      source: "rescue-route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ffffff", "line-width": 10, "line-opacity": 0.95 },
    });
    map.addLayer({
      id: "rescue-route",
      type: "line",
      source: "rescue-route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#6b873f", "line-width": 5 },
    });
  }
}
