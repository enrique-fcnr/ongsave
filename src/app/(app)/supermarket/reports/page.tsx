import { FormSections } from "@/components/screen-sections";
import { redirect } from "next/navigation";
import { operationalData, summarize } from "@/lib/data";
import { number } from "@/lib/domain";
import { Metrics, Charts } from "@/components/metrics";
import { PrintButton } from "@/components/print-button";
import { ImpactCertificate } from "@/components/impact-certificate";
export default async function Reports() {
  const { profile, organization, rescues, asOf } = await operationalData();
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
  const issuedAt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "long",
  }).format(now);
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
      <FormSections
        labels={["Indicadores", "Certificado"]}
      >
        <div className="stack">
          <Metrics rescues={monthly} role={profile.role} />
          <Charts rescues={monthly} asOf={asOf} />
          <div className="panel between">
            <div>
              <h2>{number(m.co2)} kg CO₂e estimados evitados</h2>
              <p className="small muted" style={{ marginTop: 8 }}>
                Estimativa ilustrativa · {m.partners} instituições beneficiadas
              </p>
            </div>
            <span className="pill">Impacto social</span>
          </div>
        </div>
        <ImpactCertificate
          organization={organization?.name || "Supermercado parceiro"}
          period={period}
          issuedAt={issuedAt}
          rescuedKg={m.kg}
          meals={m.meals}
          ngoCount={m.partners}
          co2Kg={m.co2}
        />
      </FormSections>
    </div>
  );
}
