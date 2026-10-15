import "server-only";
import { redirect } from "next/navigation";
import { requireProfile } from "./auth";

export type ContractSummary = {
  id: string;
  supermarket: string;
  monthlyAmount: number;
  status: "PROPOSED" | "ACTIVE" | "PAUSED" | "CANCELLED";
  paidInstallments: number;
  amountReceived: number;
  pendingAmount: number;
};

export async function adminContractData() {
  const { client, profile } = await requireProfile();
  if (profile.role !== "ADMIN") redirect("/home");

  const { data, error } = await client
    .from("supermarket_contracts")
    .select(
      "id,monthly_amount,status,organizations(name),supermarket_contract_installments(amount,status)",
    )
    .order("created_at", { ascending: false });
  if (error && (error.code === "PGRST205" || error.code === "42P01")) {
    return {
      contracts: [],
      paidInstallments: 0,
      amountReceived: 0,
      monthlyForecast: 0,
      setupRequired: true,
    };
  }
  if (error) throw new Error("Não foi possível carregar os contratos dos supermercados.");

  const contracts = (data || []).map((row) => {
    const installments = row.supermarket_contract_installments || [];
    const organization = Array.isArray(row.organizations)
      ? row.organizations[0]
      : row.organizations;
    const paid = installments.filter((item) => item.status === "PAID");
    const pending = installments.filter((item) => item.status !== "PAID");
    return {
      id: row.id,
      supermarket: organization?.name || "Supermercado",
      monthlyAmount: Number(row.monthly_amount),
      status: row.status,
      paidInstallments: paid.length,
      amountReceived: paid.reduce((sum, item) => sum + Number(item.amount), 0),
      pendingAmount: pending.reduce((sum, item) => sum + Number(item.amount), 0),
    } satisfies ContractSummary;
  });

  return {
    contracts,
    paidInstallments: contracts.reduce((sum, contract) => sum + contract.paidInstallments, 0),
    amountReceived: contracts.reduce((sum, contract) => sum + contract.amountReceived, 0),
    monthlyForecast: contracts
      .filter((contract) => contract.status === "ACTIVE")
      .reduce((sum, contract) => sum + contract.monthlyAmount, 0),
    setupRequired: false,
  };
}
