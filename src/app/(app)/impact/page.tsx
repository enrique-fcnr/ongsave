import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { operationalData } from "@/lib/data";
import { ScreenSections } from "@/components/screen-sections";
import { Metrics, Charts, EnvironmentalImpact } from "@/components/metrics";
import { DriverDeliveryHistory } from "@/components/driver-deliveries";
export default async function Impact() {
  const { profile: actor } = await requireProfile();
  if (actor.role !== "DRIVER") redirect("/home#impacto");
  const { client, rescues, orgs, profile, asOf } = await operationalData();
  const { data: driver, error } = await client
    .from("drivers")
    .select("id")
    .eq("profile_id", profile.id)
    .single();
  if (error) throw new Error(error.message);
  const finalized = rescues
    .filter((rescue) => rescue.driver_id === driver.id && rescue.status === "DELIVERED")
    .sort((a, b) => (b.delivered_at || b.created_at).localeCompare(a.delivered_at || a.created_at));
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
          {
            id: "historico-entregas",
            label: "Histórico de entregas",
            content: <DriverDeliveryHistory finalized={finalized} orgs={orgs} />,
          },
        ]}
      />
    </div>
  );
}
