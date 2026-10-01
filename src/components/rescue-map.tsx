"use client";
import dynamic from "next/dynamic";
import type { Rescue } from "@/lib/domain";
const DriverMap = dynamic(() => import("./maps/DriverMap"), {
  ssr: false,
  loading: () => <div className="map-frame skeleton" />,
});
export function RescueMap({ rescue }: { rescue: Rescue }) {
  return <DriverMap rescues={[rescue]} selectedId={rescue.id} />;
}
