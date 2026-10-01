import { operationalData } from "@/lib/data";
import { RescueList } from "@/components/shared";
export default async function Rescues() {
  const { rescues, orgs, profile } = await operationalData();
  return (
    <div className="stack">
      <div className="title-block">
        <span className="eyebrow muted">Cada etapa conta</span>
        <h1>Resgates</h1>
        <p>
          {profile.role === "DRIVER"
            ? "Suas missões e oportunidades disponíveis."
            : "Acompanhe as operações e os alimentos que chegaram a um novo destino."}
        </p>
      </div>
      <RescueList
        rescues={rescues.filter((r) => r.status !== "DELIVERED" && r.status !== "CANCELLED")}
        orgs={orgs}
      />
      <h2>Histórico de entregas</h2>
      <RescueList rescues={rescues.filter((r) => r.status === "DELIVERED")} orgs={orgs} />
    </div>
  );
}
