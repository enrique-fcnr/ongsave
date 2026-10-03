import { redirect } from "next/navigation";
import { operationalData, summarize } from "@/lib/data";
import { number, categoryLabels } from "@/lib/domain";
import { Metrics, Charts } from "@/components/metrics";
import { StatusPill, Empty } from "@/components/shared";
import { PrintButton } from "@/components/print-button";
export default async function Reports() {
  const { profile, organization, rescues, orgs, asOf } = await operationalData();
  if (profile.role !== "SUPERMARKET") redirect("/home");
  const now = new Date(asOf);
  const period = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    month: "long",
    year: "numeric",
  }).format(now);
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  });
  const monthly = rescues.filter(
    (r) => key.format(new Date(r.delivered_at || r.created_at)) === key.format(now),
  );
  const m = summarize(monthly);
  return (
    <div className="stack">
      <div className="between page-heading">
        <div className="title-block">
          <span className="eyebrow muted">
            {organization?.name} · {period}
          </span>
          <h1>Impacto ESG</h1>
          <p>O resultado das entregas deste mês, pronto para acompanhar e compartilhar.</p>
        </div>
        <PrintButton />
      </div>
      <Metrics rescues={monthly} role={profile.role} />
      <div className="panel between">
        <div>
          <h2>{number(m.co2)} kg CO₂e estimados evitados</h2>
          <p className="small muted" style={{ marginTop: 8 }}>
            Estimativa ilustrativa · {m.partners} instituições beneficiadas
          </p>
        </div>
        <span className="pill">Impacto social</span>
      </div>
      <Charts rescues={monthly} asOf={asOf} />
      <section className="panel stack">
        <h2>Registro de resgates</h2>
        <div className="scroll-x">
          <table className="report-table">
            <thead>
              <tr>
                {["Data", "Categoria", "Peso", "Instituição", "Status"].map((t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      day: "2-digit",
                      month: "2-digit",
                    }).format(new Date(r.created_at))}
                  </td>
                  <td>{categoryLabels[r.surplus_batches?.category || "other"]}</td>
                  <td>{number(Number(r.surplus_batches?.estimated_weight_kg || 0))} kg</td>
                  <td>{orgs.find((o) => o.id === r.ngo_id)?.name}</td>
                  <td>
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!monthly.length && (
          <Empty
            title="Nenhum registro neste mês"
            body="As próximas entregas aparecerão neste relatório."
          />
        )}
      </section>
      <p className="small muted">
        Para exportar, selecione “Salvar como PDF” na janela de impressão.
      </p>
      <details className="method-note">
        <summary>Sobre os dados e as estimativas</summary>
        <p>
          Inclui histórico simulado. Refeições, economia, água e CO₂e usam fatores ilustrativos a
          partir das entregas confirmadas e não constituem certificação ESG.
        </p>
      </details>
    </div>
  );
}
