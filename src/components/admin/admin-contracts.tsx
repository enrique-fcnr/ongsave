import { Banknote, CalendarClock, FileText, ReceiptText } from "lucide-react";
import type { ContractSummary } from "@/lib/admin-contract-data";
import { money, number } from "@/lib/domain";
import { ContractActions } from "./contract-actions";
import styles from "./contracts.module.css";

type ContractData = {
  contracts: ContractSummary[];
  paidInstallments: number;
  amountReceived: number;
  monthlyForecast: number;
  setupRequired: boolean;
};

const statusLabels = {
  PROPOSED: "Proposta",
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  CANCELLED: "Encerrado",
} as const;
const planLabels = {
  SMALL: "Pequeno",
  MEDIUM: "Médio",
  LARGE: "Grande",
} as const;

export function AdminContracts({ data }: { data: ContractData }) {
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Administração financeira</span>
          <h1>Contratos</h1>
          <p>Acompanhe mensalidades previstas e pagamentos registrados por supermercado.</p>
        </div>
        <span className={styles.monthlyPrice}><Banknote size={16} /> Pequeno, médio e grande porte</span>
      </header>

      <section className={styles.planGrid} aria-label="Planos mensais por porte">
        <article><span>Pequeno porte</span><strong>R$ 299 <small>/ mês</small></strong></article>
        <article><span>Médio porte</span><strong>R$ 499 <small>/ mês</small></strong></article>
        <article><span>Grande porte</span><strong>R$ 999 <small>/ mês</small></strong></article>
      </section>

      <section className={styles.metrics} aria-label="Resumo dos contratos">
        <article>
          <span><FileText size={17} /> Contratos cadastrados</span>
          <strong>{number(data.contracts.length)}</strong>
        </article>
        <article>
          <span><ReceiptText size={17} /> Mensalidades pagas</span>
          <strong>{number(data.paidInstallments)}</strong>
        </article>
        <article className={styles.highlight}>
          <span><Banknote size={17} /> Total recebido</span>
          <strong>{money(data.amountReceived)}</strong>
        </article>
        <article>
          <span><CalendarClock size={17} /> Previsão mensal ativa</span>
          <strong>{money(data.monthlyForecast)}</strong>
        </article>
      </section>

      <section className={styles.contracts} aria-labelledby="contract-list-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="contract-list-heading">Supermercados</h2>
            <p>Valores previstos e histórico financeiro de cada contrato.</p>
          </div>
          <span>{number(data.contracts.length)} registros</span>
        </div>
        {data.setupRequired && (
          <div className={styles.setupNotice} role="status">
            <strong>O painel financeiro ainda não está conectado.</strong>
            <p>A estrutura de contratos e mensalidades precisa ser ativada no banco para carregar os supermercados e registrar pagamentos.</p>
          </div>
        )}
        {data.contracts.length ? (
          <>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Supermercado</th>
                    <th>Status</th>
                    <th>Plano</th>
                    <th>Mensalidade</th>
                    <th>Parcelas pagas</th>
                    <th>Total recebido</th>
                    <th>Em aberto</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contracts.map((contract) => (
                    <tr key={contract.id}>
                      <th scope="row">{contract.supermarket}</th>
                      <td><span className={`${styles.status} ${styles[contract.status.toLowerCase()]}`}>{statusLabels[contract.status]}</span></td>
                      <td>{planLabels[contract.planTier]}</td>
                      <td>{money(contract.monthlyAmount)} <small>/ mês</small></td>
                      <td>{number(contract.paidInstallments)}</td>
                      <td className={styles.received}>{money(contract.amountReceived)}</td>
                      <td>{money(contract.pendingAmount)}</td>
                      <td><ContractActions contractId={contract.id} status={contract.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.mobileList}>
              {data.contracts.map((contract) => (
                <article key={contract.id}>
                  <div className={styles.mobileTop}>
                    <strong>{contract.supermarket}</strong>
                    <span className={`${styles.status} ${styles[contract.status.toLowerCase()]}`}>{statusLabels[contract.status]}</span>
                  </div>
                  <span className={styles.mobilePlan}>{planLabels[contract.planTier]} porte</span>
                  <div className={styles.mobileMetrics}>
                    <span>Mensalidade<strong>{money(contract.monthlyAmount)}</strong></span>
                    <span>Pagas<strong>{number(contract.paidInstallments)}</strong></span>
                    <span>Recebido<strong>{money(contract.amountReceived)}</strong></span>
                    <span>Em aberto<strong>{money(contract.pendingAmount)}</strong></span>
                  </div>
                  <ContractActions contractId={contract.id} status={contract.status} />
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <span><ReceiptText size={20} /></span>
            <h3>{data.setupRequired ? "Ative o painel financeiro" : "Nenhum contrato cadastrado"}</h3>
            <p>
              {data.setupRequired
                ? "Depois de ativar a estrutura no banco, os supermercados cadastrados aparecerão aqui."
                : "Os contratos e pagamentos registrados aparecerão aqui."}
            </p>
          </div>
        )}
      </section>
      <p className={styles.note}>Parcelas pagas e valores recebidos refletem somente pagamentos registrados no sistema.</p>
    </div>
  );
}
