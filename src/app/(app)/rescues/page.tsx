import { FormSections } from "@/components/screen-sections";
import { operationalData } from "@/lib/data";
import { RescueList } from "@/components/shared";
export default async function Rescues() {
  const { rescues, orgs, profile } = await operationalData();
  const ongoing = rescues.filter((r) => r.status !== "DELIVERED" && r.status !== "CANCELLED");
  const delivered = rescues.filter((r) => r.status === "DELIVERED");
  const cancelled = rescues.filter((r) => r.status === "CANCELLED");
  return (
    <div className="stack">
      <div className="title-block">
        <span className="eyebrow muted">Cada etapa conta</span>
        <h1>Resgates</h1>
        <p>
          {profile.role === "DRIVER"
            ? "Acompanhe suas missões e consulte as entregas concluídas."
            : "Da reserva à entrega, acompanhe cada alimento até o novo destino."}
        </p>
      </div>
      <FormSections labels={["Em andamento", "Entregas", "Cancelados"]}>
        <section className="stack">
          <div className="section-heading">
            <h2>Em andamento</h2>
            <span className="pill">{ongoing.length} resgates</span>
          </div>
          <RescueList
            rescues={ongoing}
            orgs={orgs}
            emptyTitle="Nenhum resgate em andamento"
            emptyBody="Quando um resgate começar, acompanhe as próximas etapas por aqui."
          />
        </section>
        <section className="stack">
          <div className="section-heading">
            <h2>Histórico de entregas</h2>
            <span className="small muted">{delivered.length} entregas confirmadas</span>
          </div>
          <RescueList
            rescues={delivered}
            orgs={orgs}
            emptyTitle="Sua primeira entrega ainda está por vir"
            emptyBody="As entregas confirmadas ficam guardadas aqui para você consultar."
          />
        </section>
        {cancelled.length > 0 && (
          <section className="stack">
            <h2>Cancelados</h2>
            <RescueList rescues={cancelled} orgs={orgs} />
          </section>
        )}
      </FormSections>
    </div>
  );
}
