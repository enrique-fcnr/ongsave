import { FormSections } from "@/components/screen-sections";
import { operationalData, signedPhotos } from "@/lib/data";
import { RescueList } from "@/components/shared";
export default async function Rescues() {
  const { rescues, orgs, profile } = await operationalData();
  const ongoing = rescues.filter((r) => r.status !== "DELIVERED" && r.status !== "CANCELLED");
  const delivered = rescues.filter((r) => r.status === "DELIVERED");
  const cancelled = rescues.filter((r) => r.status === "CANCELLED");
  const photoUrls = await signedPhotos(rescues.map((r) => r.surplus_batches?.image_url));
  return (
    <div className="stack">
      <div className="title-block">
        <span className="eyebrow muted">Cada etapa conta</span>
        <h1>Doações</h1>
        <p>
          {profile.role === "DRIVER"
            ? "Acompanhe suas missões e consulte as doações finalizadas."
            : "Acompanhe a jornada de cada alimento, da reserva à confirmação do recebimento."}
        </p>
      </div>
      <FormSections labels={["Em andamento", "Finalizados", "Cancelados"]}>
        <section className="stack">
          <div className="section-heading">
            <h2>Em andamento</h2>
            <span className="pill">{ongoing.length} doações</span>
          </div>
          <RescueList
            rescues={ongoing}
            orgs={orgs}
            photoUrls={photoUrls}
            emptyTitle="Nenhuma doação em andamento"
            emptyBody="Quando uma doação começar, acompanhe as próximas etapas por aqui."
          />
        </section>
        <section className="stack">
          <div className="section-heading">
            <h2>Doações finalizadas</h2>
            <span className="small muted">{delivered.length} doações finalizadas</span>
          </div>
          <RescueList
            rescues={delivered}
            orgs={orgs}
            photoUrls={photoUrls}
            emptyTitle="Sua primeira doação finalizada ainda está por vir"
            emptyBody="As doações finalizadas ficam guardadas aqui para você consultar."
          />
        </section>
        {cancelled.length > 0 && (
          <section className="stack">
            <h2>Cancelados</h2>
            <RescueList rescues={cancelled} orgs={orgs} photoUrls={photoUrls} />
          </section>
        )}
      </FormSections>
    </div>
  );
}
