import { redirect } from "next/navigation";
import { Banknote } from "lucide-react";
import { operationalData } from "@/lib/data";
import { DEMO_DRIVER_DELIVERY_RATE_BRL, money, summarizeDriverDay } from "@/lib/domain";
import { MissionBoard } from "@/components/mission-board";
export default async function DriverMapPage() {
  const { client, profile, rescues, orgs, asOf } = await operationalData();
  if (profile.role !== "DRIVER") redirect("/home");
  const { data: d, error } = await client
    .from("drivers")
    .select("*")
    .eq("profile_id", profile.id)
    .single();
  if (error) throw new Error(error.message);
  const daily = summarizeDriverDay(rescues, d.id, new Date(asOf));
  return (
    <div className="stack">
      <div className="between page-heading">
        <div className="title-block">
          <span className="eyebrow muted">Cada entrega importa</span>
          <h1>Mapa</h1>
          <p>Acompanhe o caminho da sua posição até a coleta e a ONG.</p>
        </div>
        <section className="driver-daily-revenue" aria-label="Faturamento estimado de hoje">
          <div className="between">
            <span className="metric-label">Faturamento de hoje</span>
            <Banknote className="metric-icon" />
          </div>
          <strong className="value">{money(daily.revenue)}</strong>
          <span className="metric-footnote">
            {daily.deliveries} entregas concluídas · simulação de{" "}
            {money(DEMO_DRIVER_DELIVERY_RATE_BRL)} por entrega
          </span>
        </section>
      </div>
      <MissionBoard
        rescues={rescues
          .filter((r) => r.driver_id === d.id && !["DELIVERED", "CANCELLED"].includes(r.status))
          .sort((a, b) => (a.driver_route_position ?? 0) - (b.driver_route_position ?? 0))}
        orgs={orgs}
        position={[d.mock_longitude, d.mock_latitude]}
      />
    </div>
  );
}
