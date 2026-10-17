import type { Metadata } from "next";
import { Banknote, Building2, FileSearch, HandCoins } from "lucide-react";
import { money, number } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { adminFinancialSupportData } from "@/lib/financial-support-data";
import { adminContractData } from "@/lib/admin-contract-data";
import { markFinancialSupportReceived } from "./actions";

export const metadata: Metadata = { title: "Apoios financeiros e editais" };

const contractPlanLabels = {
  SMALL: "Pequeno porte",
  MEDIUM: "Médio porte",
  LARGE: "Grande porte",
} as const;

export default async function AdminFundingPage() {
  const [data, contracts] = await Promise.all([adminFinancialSupportData(), adminContractData()]);
  return (
    <div className="stack">
      <header className="page-heading">
        <div className="title-block">
          <span className="eyebrow">Administração financeira</span>
          <h1>Apoios e editais</h1>
          <p>
            Separe o apoio financeiro empresarial das mensalidades dos supermercados e acompanhe
            oportunidades públicas.
          </p>
        </div>
      </header>
      <section className="metric-grid funding-metric-grid" aria-label="Resumo dos apoios">
        <article className="metric">
          <span className="metric-label">
            <Building2 size={15} /> Empresas apoiadoras
          </span>
          <span className="value">{number(data.companies)}</span>
          <span className="metric-footnote">Com registros financeiros</span>
        </article>
        <article className="metric">
          <span className="metric-label">
            <HandCoins size={15} /> Compromissos em aberto
          </span>
          <span className="value">{money(data.pledgedAmount)}</span>
          <span className="metric-footnote">Aguardando confirmação de recebimento</span>
        </article>
        <article className="metric">
          <span className="metric-label">
            <Banknote size={15} /> Apoios recebidos
          </span>
          <span className="value">{money(data.receivedAmount)}</span>
          <span className="metric-footnote">Recebimentos confirmados</span>
        </article>
      </section>
      <section className="panel stack" aria-labelledby="financial-supports-heading">
        <div className="section-heading">
          <div>
            <h2 id="financial-supports-heading">Doações financeiras empresariais</h2>
            <p>
              Estes registros são independentes dos contratos mensais, que permanecem em Contratos.
            </p>
          </div>
        </div>
        {data.supports.length ? (
          <div className="stack">
            {data.supports.map((support) => (
              <article key={support.id} className="panel between">
                <div>
                  <strong>{support.company}</strong>
                  <p>{support.purpose}</p>
                  <p className="small muted">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
                      new Date(support.createdAt),
                    )}
                    {support.note ? ` · ${support.note}` : ""}
                  </p>
                </div>
                <div className="stack">
                  <strong>{money(support.amount)}</strong>
                  <span className="small muted">
                    {support.status === "RECEIVED"
                      ? "Recebido"
                      : support.status === "PLEDGED"
                        ? "Compromisso pendente"
                        : "Cancelado"}
                  </span>
                  {support.status === "PLEDGED" && (
                    <form action={markFinancialSupportReceived}>
                      <input type="hidden" name="id" value={support.id} />
                      <Button type="submit" variant="outline">
                        Confirmar recebimento
                      </Button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Os registros de apoio financeiro aparecerão aqui.</p>
        )}
      </section>
      <section className="panel stack" aria-labelledby="subscriptions-heading">
        <div className="section-heading">
          <div>
            <h2 id="subscriptions-heading">Mensalidades dos supermercados</h2>
            <p>Planos mensais por unidade: pequeno R$ 299, médio R$ 499 e grande R$ 999.</p>
          </div>
          <a className="text-link" href="/admin/contracts">
            Abrir contratos
          </a>
        </div>
        {contracts.contracts.length ? (
          <div className="stack">
            {contracts.contracts.map((contract) => (
              <article key={contract.id} className="panel between">
                <div>
                  <strong>{contract.supermarket}</strong>
                  <p className="small muted">
                    Plano {contractPlanLabels[contract.planTier]} ·{" "}
                    {contract.status === "ACTIVE"
                      ? "Assinatura ativa"
                      : contract.status === "PROPOSED"
                        ? "Proposta"
                        : contract.status === "PAUSED"
                          ? "Pausada"
                          : "Encerrada"}{" "}
                    · {number(contract.paidInstallments)} mensalidades pagas
                  </p>
                </div>
                <div>
                  <strong>{money(contract.monthlyAmount)} / mês</strong>
                  <p className="small muted">Recebido: {money(contract.amountReceived)}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Os contratos de supermercado aparecerão aqui.</p>
        )}
      </section>
      <section className="panel stack" aria-labelledby="public-procurement-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Terceira frente de receita</span>
            <h2 id="public-procurement-heading">Contratações públicas</h2>
            <p>Oportunidades para fornecer tecnologia e serviços de logística social.</p>
          </div>
          <FileSearch size={22} aria-hidden="true" />
        </div>
        <p>
          Para concorrer, a ONGSave deve verificar os requisitos de cada edital, manter a
          habilitação como fornecedora e cadastrar-se no SICAF quando aplicável. O PNCP centraliza a
          divulgação dos editais e contratos da Lei 14.133/2021.
        </p>
        <div className="row">
          <a
            className="text-link"
            href="https://pncp.gov.br/app/editais"
            target="_blank"
            rel="noreferrer"
          >
            Consultar editais no PNCP
          </a>
          <a
            className="text-link"
            href="https://www.gov.br/pt-br/servicos/cadastrar-se-como-fornecedor-da-administracao-publica"
            target="_blank"
            rel="noreferrer"
          >
            Ver cadastro SICAF
          </a>
        </div>
        <p className="small muted">
          Parcerias entre o poder público e organizações da sociedade civil podem seguir o{" "}
          <a
            href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13019compilado.htm"
            target="_blank"
            rel="noreferrer"
          >
            MROSC (Lei 13.019/2014)
          </a>
          , com chamamento público; esse instrumento é distinto de uma licitação para contratação
          comercial.
        </p>
      </section>
      <p className="small muted">
        Esta demonstração não registra pagamentos reais nem confirma elegibilidade tributária. A
        área contábil deve validar cada operação e documento.
      </p>
    </div>
  );
}
