import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { operationalData } from "@/lib/data";
import { ScreenSections } from "@/components/screen-sections";
import { Metrics, Charts, EnvironmentalImpact } from "@/components/metrics";
export default async function Impact() {
  const { profile: actor } = await requireProfile();
  if (actor.role !== "DRIVER") redirect("/home#impacto");
  const { rescues, profile, asOf } = await operationalData();
  return (
    <div className="stack">
      <div className="title-block">
        <span className="eyebrow muted">O resultado das suas conexões</span>
        <h1>O alimento chega. O impacto fica.</h1>
        <p>Alimentos entregues, conexões e resultados da sua participação na rede.</p>
      </div>
      <ScreenSections
        sections={[
          {
            id: "indicadores",
            label: "Indicadores",
            content: <Metrics rescues={rescues} role={profile.role} />,
          },
          { id: "graficos", label: "Gráficos", content: <Charts rescues={rescues} asOf={asOf} /> },
          {
            id: "ambiente",
            label: "Estimativas ambientais",
            content: <EnvironmentalImpact rescues={rescues} />,
          },
        ]}
      />
    </div>
  );
}
