import type { Metadata } from "next";
import { HandCoins, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitFinancialSupport } from "./actions";
import { ownFinancialSupportData } from "@/lib/financial-support-data";
import { money } from "@/lib/domain";

export const metadata: Metadata = { title: "Apoio financeiro" };

export default async function FinancialDonationPage() {
  const { company, supports } = await ownFinancialSupportData();
  const committed = supports
    .filter((support) => support.status === "PLEDGED")
    .reduce((sum, support) => sum + support.amount, 0);
  const received = supports
    .filter((support) => support.status === "RECEIVED")
    .reduce((sum, support) => sum + support.amount, 0);

  return (
    <div className="stack">
      <header className="page-heading">
        <div className="title-block">
          <span className="eyebrow">Empresa apoiadora · rede ONGSave</span>
          <h1>{company}</h1>
          <p>Acompanhe os compromissos financeiros destinados ao custeio das entregas.</p>
        </div>
      </header>
      <section className="metric-grid funding-metric-grid" aria-label="Resumo do apoio financeiro">
        <article className="metric">
          <span className="metric-label">Compromissos registrados</span>
          <span className="value">{money(committed)}</span>
          <span className="metric-footnote">Aguardando confirmação administrativa</span>
        </article>
        <article className="metric">
          <span className="metric-label">Valores confirmados</span>
          <span className="value">{money(received)}</span>
          <span className="metric-footnote">Recebimentos registrados no sistema</span>
        </article>
      </section>
      <section className="panel stack" aria-labelledby="new-support-heading">
        <div className="section-heading">
          <div>
            <h2 id="new-support-heading">Registrar novo apoio</h2>
            <p>Informe um compromisso financeiro para apoiar a operação das entregas.</p>
          </div>
          <HandCoins size={22} aria-hidden="true" />
        </div>
        <form action={submitFinancialSupport} className="form-grid">
          <label className="field">
            Valor do apoio (R$)
            <input
              name="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="Ex.: 5000,00"
              required
            />
          </label>
          <label className="field">
            Observação (opcional)
            <textarea
              name="note"
              maxLength={500}
              rows={3}
              placeholder="Indique o período ou a finalidade pretendida."
            />
          </label>
          <Button type="submit">
            <HandCoins size={16} /> Registrar compromisso
          </Button>
        </form>
        <p className="small muted">
          <ShieldCheck size={14} /> O registro é um compromisso demonstrativo. Ele só aparece como
          recebido após conferência administrativa e não gera comprovante fiscal.
        </p>
      </section>
      <section className="panel stack" aria-labelledby="support-history-heading">
        <div className="section-heading">
          <div>
            <h2 id="support-history-heading">Histórico de apoio</h2>
            <p>Valores enviados e compromissos em aberto.</p>
          </div>
        </div>
        {supports.length ? (
          <div className="stack">
            {supports.map((support) => (
              <article key={support.id} className="panel between">
                <div>
                  <strong>{support.purpose}</strong>
                  <p className="small muted">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
                      new Date(support.createdAt),
                    )}
                    {support.note ? ` · ${support.note}` : ""}
                  </p>
                </div>
                <div>
                  <strong>{money(support.amount)}</strong>
                  <p className="small muted">
                    {support.status === "RECEIVED"
                      ? "Recebido"
                      : support.status === "PLEDGED"
                        ? "Aguardando confirmação"
                        : "Cancelado"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhum apoio registrado ainda.</p>
        )}
      </section>
    </div>
  );
}
