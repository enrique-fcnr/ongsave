import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { operationalData } from "@/lib/data";
import { Metrics, Charts, EnvironmentalImpact } from "@/components/metrics";
export default async function Impact() {
  const { profile: actor } = await requireProfile();
  if (actor.role === "NGO") redirect("/home#impacto");
  const { rescues, profile, asOf } = await operationalData();
  return (
    <div className="stack">
      <div className="title-block">
        <span className="eyebrow muted">O resultado das suas conexões</span>
        <h1>O alimento chega. O impacto fica.</h1>
        <p>Alimentos entregues, conexões e resultados da sua participação na rede.</p>
      </div>
      <Metrics rescues={rescues} role={profile.role} />
      <Charts rescues={rescues} asOf={asOf} />
      <EnvironmentalImpact rescues={rescues} />
    </div>
  );
}
