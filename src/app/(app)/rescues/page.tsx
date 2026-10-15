import { FormSections } from "@/components/screen-sections";
import { operationalData, signedPhotos } from "@/lib/data";
import { RescueList } from "@/components/shared";
import { DriverDeliveries } from "@/components/driver-deliveries";
export default async function Rescues() {
  const { client, rescues, orgs, profile } = await operationalData();
  if (profile.role === "DRIVER") {
    const { data: driver, error } = await client
      .from("drivers")
      .select("id,vehicle_capacity_kg,availability")
      .eq("profile_id", profile.id)
      .single();
    if (error) throw new Error(error.message);
    const available = rescues.filter((rescue) => rescue.status === "WAITING_DRIVER");
    const activeRouteWeightKg = rescues
      .filter((rescue) => rescue.driver_id === driver.id && !["DELIVERED", "CANCELLED"].includes(rescue.status))
      .reduce((total, rescue) => total + Number(rescue.surplus_batches?.estimated_weight_kg || 0), 0);
    const photoUrls = await signedPhotos(rescues.map((rescue) => rescue.surplus_batches?.image_url));
    return (
      <div className="stack">
        <div className="title-block">
          <span className="eyebrow muted">Cada entrega importa</span>
          <h1>Entregas</h1>
          <p>Encontre entregas disponíveis e escolha várias para montar uma rota completa.</p>
        </div>
        <DriverDeliveries
          available={available}
          orgs={orgs}
          photos={photoUrls}
          capacityKg={Number(driver.vehicle_capacity_kg)}
          activeRouteWeightKg={activeRouteWeightKg}
          isAvailable={driver.availability}
        />
      </div>
    );
  }
  const ongoing = rescues.filter((r) => r.status !== "DELIVERED" && r.status !== "CANCELLED");
  const delivered = rescues.filter((r) => r.status === "DELIVERED");
  const cancelled = rescues.filter((r) => r.status === "CANCELLED");
  const photoUrls = await signedPhotos(rescues.map((r) => r.surplus_batches?.image_url));
  return (
    <div className="stack">
      <div className="title-block">
        <span className="eyebrow muted">Cada etapa conta</span>
        <h1>Doações</h1>
        <p>Acompanhe a jornada de cada alimento, da reserva à confirmação do recebimento.</p>
      </div>
      <FormSections
          labels={["Em andamento", "Finalizados", "Cancelados"]}
      >
        <section className="stack">
          <div className="section-heading">
            <h2>Em andamento</h2>
            <span className="pill">
              {ongoing.length} doações
            </span>
          </div>
          <RescueList
            rescues={ongoing}
            orgs={orgs}
            photoUrls={photoUrls}
            emptyTitle={
              "Nenhuma doação em andamento"
            }
            emptyBody={
              "Quando uma doação começar, acompanhe as próximas etapas por aqui."
            }
            label="Doações em andamento"
          />
        </section>
        <section className="stack">
          <div className="section-heading">
            <h2>Doações finalizadas</h2>
            <span className="small muted">
              {delivered.length} doações finalizadas
            </span>
          </div>
          <RescueList
            rescues={delivered}
            orgs={orgs}
            photoUrls={photoUrls}
            emptyTitle={
              "Sua primeira doação finalizada ainda está por vir"
            }
            emptyBody={
              "As doações finalizadas ficam guardadas aqui para você consultar."
            }
            label="Doações finalizadas"
          />
        </section>
        {cancelled.length > 0 && (
          <section className="stack">
            <h2>Cancelados</h2>
            <RescueList
              rescues={cancelled}
              orgs={orgs}
              photoUrls={photoUrls}
              label="Doações canceladas"
            />
          </section>
        )}
      </FormSections>
    </div>
  );
}
